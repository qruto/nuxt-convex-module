/**
 * Nuxt-idiomatic data fetching for Convex queries.
 *
 * {@link useAsyncQuery} is a Vue/Nuxt-only addition (no `convex/react`
 * counterpart — see PARITY.md): it marries Nuxt's `useAsyncData` model with
 * Convex's live queries. During SSR the query runs over HTTP and the result is
 * embedded in the Nuxt payload; after hydration the composable upgrades to the
 * WebSocket subscription, so the page paints with server data and stays live —
 * no loading flash, no client refetch.
 *
 * @module
 */

import { useAsyncData, useRuntimeConfig, useState } from '#app'
import { computed, shallowRef, toValue, type ComputedRef, type MaybeRefOrGetter, type ShallowRef } from 'vue'
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server'
import { getFunctionName, makeFunctionReference } from 'convex/server'
import { convexToJson, jsonToConvex } from 'convex/values'
import type { Value } from 'convex/values'
import { useConvex } from '../../vue/client'
import { useConvexQueries, type RequestForQueries } from '../../vue/composables/use-queries'
import { fetchQuery } from '../index'

/**
 * Request status of a {@link useAsyncQuery} call — mirrors Nuxt's
 * `useAsyncData` statuses.
 *
 * @public
 */
export type AsyncQueryStatus = 'idle' | 'pending' | 'success' | 'error'

/**
 * Options for {@link useAsyncQuery}.
 *
 * @public
 */
export interface AsyncQueryOptions {
  /**
   * Key for the underlying `useAsyncData` entry (payload dedup across
   * components). Defaults to a key derived from the query name and the
   * initial args. Provide an explicit key when two call sites must not
   * share a payload entry.
   */
  key?: string
  /**
   * Fetch the query on the server during SSR and embed the result in the Nuxt
   * payload. Set `false` to fetch on the client only.
   *
   * @default true
   */
  server?: boolean
  /**
   * Mirror `useAsyncData`'s `lazy` option: don't block client-side navigation
   * on the initial fetch.
   *
   * @default false
   */
  lazy?: boolean
  /**
   * Upgrade to a live WebSocket subscription on the client. Set `false` for
   * SSR + hydration *without* realtime updates — no WebSocket is opened for
   * this query, and {@link AsyncQueryReturn.refresh | refresh} becomes the way
   * to get fresh data.
   *
   * @default true
   */
  live?: boolean
  /**
   * JWT to authenticate the SSR fetch, or a function resolving one. Defaults
   * to the token the Better Auth server plugin prefetched for this request
   * (when that integration is enabled); pass a value here to integrate any
   * other server-side auth source. The client-side live subscription
   * authenticates through the Convex client's own `setAuth` wiring.
   */
  token?: string | (() => string | null | Promise<string | null>)
}

/**
 * Reactive result of {@link useAsyncQuery}. Also awaitable — `await
 * useAsyncQuery(...)` blocks until the initial fetch settles, like
 * `useAsyncData`.
 *
 * @public
 */
export interface AsyncQueryReturn<T> extends PromiseLike<AsyncQueryData<T>> {
  /**
   * The query result: the server-fetched value first, replaced by the live
   * subscription's value once the client receives one. `undefined` while
   * nothing has loaded (or while skipped).
   */
  data: ComputedRef<T | undefined>
  /** The initial-fetch or live-subscription error, `null` when none. */
  error: ComputedRef<Error | null>
  /**
   * Initial-fetch status. Live pushes don't churn it: once data exists it
   * stays `'success'` unless the live subscription errors.
   */
  status: ComputedRef<AsyncQueryStatus>
  /**
   * Re-run the one-shot fetch. With a live subscription (`live: true`) the
   * server already pushes updates, so this is mainly for retrying after an
   * error; with `live: false` it is the way to get fresh data.
   */
  refresh: (opts?: { dedupe?: 'cancel' | 'defer' }) => Promise<void>
}

type AsyncQueryData<T> = Pick<AsyncQueryReturn<T>, 'data' | 'error' | 'status' | 'refresh'>

// Wraps the query value so "no payload entry" (undefined/null) is
// distinguishable from a query legitimately returning `null`.
type AsyncQueryPayload = { value: ReturnType<typeof convexToJson> } | null

/**
 * Load a Convex query the Nuxt way: fetched on the server during SSR,
 * hydrated through the Nuxt payload, then seamlessly upgraded to a live
 * WebSocket subscription on the client.
 *
 * Compared to {@link useQuery} (which renders `undefined` during SSR and
 * fetches on the client), `useAsyncQuery` puts real data in the
 * server-rendered HTML and never refetches it on hydration — the live
 * subscription simply takes over. Compared to `preloadQuery` +
 * `usePreloadedQuery`, no server route or prop-threading is needed.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '#convex/api'
 *
 * // SSR-rendered AND live:
 * const { data: tasks, status, error } = useAsyncQuery(api.tasks.list, { completed: false })
 *
 * // SSR + hydration without a WebSocket (fetch-once pages):
 * const { data: stats, refresh } = useAsyncQuery(api.stats.summary, {}, { live: false })
 * </script>
 * ```
 *
 * The Nuxt payload entry is keyed on the query name and the *initial* args
 * (override with `options.key`). Reactive args are honored by the live
 * subscription; the payload only matters for first paint.
 *
 * Pass `'skip'` as args (or a getter returning it) to pause the query — no
 * fetch runs and no subscription opens until args become real.
 *
 * @param query - a `FunctionReference` for the public query to run, like
 * `api.dir1.dir2.filename.func`.
 * @param args - The arguments to the query function, or `'skip'`. Accepts a
 * ref, computed, or getter for reactive args.
 * @param options - {@link AsyncQueryOptions}.
 * @returns An awaitable {@link AsyncQueryReturn} of `data` / `error` /
 * `status` refs and a `refresh` function.
 *
 * @public
 */
export function useAsyncQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args?: MaybeRefOrGetter<FunctionArgs<Query> | 'skip'>,
  options: AsyncQueryOptions = {},
): AsyncQueryReturn<FunctionReturnType<Query>> {
  const { server = true, lazy = false, live = true, token } = options

  const queryReference
    = typeof query === 'string'
      ? (makeFunctionReference<'query', any, any>(query) as Query)
      : query
  const queryName = getFunctionName(queryReference)

  const initialArgs = toValue(args) ?? {}
  const key = options.key ?? defaultAsyncQueryKey(queryName, initialArgs)

  // The Better Auth server plugin prefetches the request's Convex JWT into
  // this well-known state key. Reading it by key (instead of importing the
  // integration) keeps the composable decoupled from the optional package:
  // without the integration the state simply defaults to `null`.
  const initialToken = useState<string | null>('convex:initialToken', () => null)

  // Captured at setup — `inject` is unavailable inside the async handler.
  // May be `undefined` (no plugin provided a client, e.g. missing URL).
  const client = useConvex()

  // Also captured at setup: the async handler runs outside the Nuxt context
  // (its `await`s drop the async-local store), where `useRuntimeConfig()` —
  // which `fetchQuery` falls back to — would throw.
  const deploymentUrl = import.meta.server
    ? useRuntimeConfig().public.convex.url
    : ''

  const resolveToken = async (): Promise<string | undefined> => {
    const resolved = typeof token === 'function' ? await token() : token ?? initialToken.value
    return resolved ?? undefined
  }

  const asyncData = useAsyncData<AsyncQueryPayload>(
    key,
    async (): Promise<AsyncQueryPayload> => {
      const currentArgs = toValue(args) ?? {}
      if (currentArgs === 'skip') {
        return null
      }
      if (import.meta.server) {
        if (!deploymentUrl) {
          throw new Error(
            '`useAsyncQuery` could not fetch during SSR: no Convex deployment URL is configured. '
            + 'Set the `convex.url` module option or NUXT_PUBLIC_CONVEX_URL.',
          )
        }
        const value = await fetchQuery(queryReference, currentArgs as FunctionArgs<Query>, {
          token: await resolveToken(),
          url: deploymentUrl,
        })
        return { value: convexToJson(value as Value) }
      }
      if (!client) {
        throw new Error(
          '`useAsyncQuery` could not fetch on the client: no Convex client is available. '
          + 'Is the `convex.url` module option (or NUXT_PUBLIC_CONVEX_URL) configured?',
        )
      }
      // One-shot read through the live client — resolved from the local
      // store when the subscription below already has a value, so the
      // `live: true` path never issues a duplicate network request.
      const value = await client.query(queryReference, currentArgs as FunctionArgs<Query>)
      return { value: convexToJson(value as Value) }
    },
    {
      server,
      lazy,
      deep: false,
      // Skipped-at-setup queries start idle instead of "successfully null".
      immediate: initialArgs !== 'skip',
    },
  )

  const payloadValue = computed<FunctionReturnType<Query> | undefined>(() => {
    const entry = asyncData.data.value
    if (entry === null || entry === undefined) {
      return undefined
    }
    return jsonToConvex(entry.value) as FunctionReturnType<Query>
  })

  // Live subscription (client only; `import.meta.server` keeps it out of the
  // server bundle's execution path). Errors are captured into the `error` ref
  // rather than thrown — the Nuxt trio contract — unlike `useQuery`, which
  // throws on read.
  const liveResults: ShallowRef<Record<string, unknown>>
    = !import.meta.server && live && client
      ? useConvexQueries(computed((): RequestForQueries => {
          const currentArgs = toValue(args) ?? {}
          if (currentArgs === 'skip') {
            return {}
          }
          return {
            query: { query: queryReference, args: currentArgs as Record<string, Value> },
          }
        }))
      : shallowRef({})

  const liveValue = computed<FunctionReturnType<Query> | undefined>(() => {
    const result = liveResults.value['query']
    return result instanceof Error ? undefined : (result as FunctionReturnType<Query> | undefined)
  })
  const liveError = computed<Error | null>(() => {
    const result = liveResults.value['query']
    return result instanceof Error ? result : null
  })

  const data = computed<FunctionReturnType<Query> | undefined>(() =>
    liveValue.value !== undefined ? liveValue.value : payloadValue.value,
  )
  const error = computed<Error | null>(
    () => liveError.value ?? asyncData.error.value ?? null,
  )
  const status = computed<AsyncQueryStatus>(() => {
    if (liveError.value) {
      return 'error'
    }
    if (liveValue.value !== undefined) {
      return 'success'
    }
    return asyncData.status.value
  })

  const refresh = (opts?: { dedupe?: 'cancel' | 'defer' }) => asyncData.refresh(opts)

  const result: AsyncQueryData<FunctionReturnType<Query>> = { data, error, status, refresh }

  // Awaitable like `useAsyncData`: `await useAsyncQuery(...)` blocks until the
  // initial fetch settles and resolves to the same reactive object.
  const promise = Promise.resolve(asyncData).then(() => result)
  return Object.assign(promise, result)
}

/** Payload key for a query + initial args. Exported for tests. @internal */
export function defaultAsyncQueryKey(queryName: string, initialArgs: unknown): string {
  const argsJson = initialArgs === 'skip'
    ? '"skip"'
    : JSON.stringify(convexToJson((initialArgs ?? {}) as Value))
  return `convex:${queryName}:${argsJson}`
}

/** @public */
export const useConvexAsyncQuery = useAsyncQuery
