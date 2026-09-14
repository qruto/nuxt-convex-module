// PARITY: A-16
//
// `useAsyncQuery` (A-04) for paginated queries: the first page is fetched on
// the server and embedded in the Nuxt payload, so the list paints with real
// rows; after hydration `usePaginatedQuery` takes over with the live
// subscription and `loadMore`. No `convex/react` counterpart — see PARITY.md.

import { useAsyncData } from '#app'
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import type { FunctionReference, PaginationResult } from 'convex/server'
import { getFunctionName } from 'convex/server'
import { convexToJson, jsonToConvex } from 'convex/values'
import type { Value } from 'convex/values'
import {
  usePaginatedQuery,
  type PaginatedQueryArgs,
  type PaginatedQueryItem,
  type PaginatedQueryReference,
  type PaginationStatus,
  type UsePaginatedQueryReturnType,
} from '../../vue/composables/use-paginated-query'
import { fetchQuery } from '../index'
import { useAsyncQueryContext, type AsyncQueryOptions } from './use-async-query'

/**
 * Options for {@link useAsyncPaginatedQuery}: `usePaginatedQuery`'s
 * `initialNumItems` plus the SSR options of {@link AsyncQueryOptions}.
 *
 * @public
 */
export interface AsyncPaginatedQueryOptions extends Pick<AsyncQueryOptions, 'key' | 'server' | 'lazy' | 'token'> {
  /** How many items the first page holds — on the server and on the client. */
  initialNumItems: number
}

/**
 * The reactive half of {@link AsyncPaginatedQueryReturn}: `usePaginatedQuery`'s
 * fields plus the `error` and `refresh` of the Nuxt data contract.
 *
 * @public
 */
export interface AsyncPaginatedQueryData<Item> {
  /**
   * The rows: the server-rendered first page until the live subscription
   * delivers its own, then every loaded page, live. The server page is
   * shown for the initial args only — after an args change the list is
   * empty until the new first page arrives.
   */
  results: ComputedRef<Item[]>
  /**
   * `usePaginatedQuery`'s status. Before the live subscription has its first
   * page it is derived from the server page: `'CanLoadMore'` or `'Exhausted'`.
   */
  status: ComputedRef<PaginationStatus>
  /** `true` while no page — server or live — is available yet, or more rows are loading. */
  isLoading: ComputedRef<boolean>
  /** The SSR fetch error or the live subscription's, `null` when none. Never thrown. */
  error: ComputedRef<Error | null>
  /**
   * Fetch `numItems` more rows. Takes effect once the live subscription has
   * its first page (`status` no longer derived from the server page).
   */
  loadMore: (numItems: number) => void
  /** Re-run the server-side first-page fetch (client-side it is a no-op — the subscription is live). */
  refresh: (opts?: { dedupe?: 'cancel' | 'defer' }) => Promise<void>
}

/**
 * Result of {@link useAsyncPaginatedQuery}: awaitable like `useAsyncData`, and
 * the refs of {@link AsyncPaginatedQueryData}.
 *
 * @public
 */
export interface AsyncPaginatedQueryReturn<Item> extends PromiseLike<AsyncPaginatedQueryData<Item>>, AsyncPaginatedQueryData<Item> {}

// The payload entry: the first page as JSON, and whether it was the last one.
type AsyncPaginatedQueryPayload = { page: ReturnType<typeof convexToJson>, isDone: boolean } | null

/**
 * A paginated Convex query the Nuxt way: the first page is fetched during SSR
 * and hydrated from the payload, then {@link usePaginatedQuery} takes over on
 * the client — live rows and `loadMore`, no loading flash for the first page.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '#convex/api'
 *
 * const { results, status, loadMore } = useAsyncPaginatedQuery(
 *   api.messages.list,
 *   {},
 *   { initialNumItems: 20 },
 * )
 * </script>
 * ```
 *
 * The payload entry is keyed on the query name, the *initial* args and
 * `initialNumItems` (override with `options.key`). Client-side navigation does
 * not fetch a page over HTTP: the subscription opens straight away, and the
 * server page only matters for the first paint.
 *
 * @param query - a `FunctionReference` for the public paginated query.
 * @param args - the query's arguments without `paginationOpts`, or `'skip'`.
 *   Accepts a ref, computed, or getter.
 * @param options - {@link AsyncPaginatedQueryOptions}.
 * @returns An awaitable {@link AsyncPaginatedQueryReturn}.
 *
 * @public
 */
export function useAsyncPaginatedQuery<Query extends PaginatedQueryReference>(
  query: Query,
  args: MaybeRefOrGetter<PaginatedQueryArgs<Query> | 'skip'>,
  options: AsyncPaginatedQueryOptions,
): AsyncPaginatedQueryReturn<PaginatedQueryItem<Query>> {
  type Item = PaginatedQueryItem<Query>
  const { initialNumItems, server = true, lazy = false, token } = options

  const queryName = getFunctionName(query)
  const initialArgs = toValue(args)
  const key = options.key ?? defaultAsyncPaginatedQueryKey(queryName, initialArgs, initialNumItems)

  const { client, deploymentUrl, resolveToken } = useAsyncQueryContext(token)

  const asyncData = useAsyncData<AsyncPaginatedQueryPayload>(
    key,
    async (): Promise<AsyncPaginatedQueryPayload> => {
      const currentArgs = toValue(args)
      // On the client the live subscription is the source of truth; a one-shot
      // page here could not be deduplicated against it (its args carry the
      // pagination id), so nothing is fetched.
      if (currentArgs === 'skip' || !import.meta.server) {
        return null
      }
      if (!deploymentUrl) {
        throw new Error(
          '`useAsyncPaginatedQuery` could not fetch during SSR: no Convex deployment URL is configured. '
          + 'Set NUXT_PUBLIC_CONVEX_URL or `convex.url` in nuxt.config.',
        )
      }
      // A plain query reference: `fetchQuery`'s args tuple is conditional on
      // the reference type and cannot resolve against the generic `Query`.
      const result = await fetchQuery(
        query as FunctionReference<'query'>,
        { ...currentArgs, paginationOpts: { numItems: initialNumItems, cursor: null } } as Record<string, Value>,
        { token: await resolveToken(), url: deploymentUrl },
      ) as PaginationResult<Item>
      return { page: convexToJson(result.page as Value), isDone: result.isDone }
    },
    { server, lazy, deep: false, immediate: initialArgs !== 'skip' },
  )

  const payloadPage = computed<Item[] | undefined>(() => {
    const entry = asyncData.data.value
    return entry ? (jsonToConvex(entry.page) as Item[]) : undefined
  })

  // The live half — client only, and only when a client was provided.
  const live: UsePaginatedQueryReturnType<Query> | undefined
    = !import.meta.server && client
      ? usePaginatedQuery(query, args, { initialNumItems })
      : undefined

  // `usePaginatedQuery` throws the query error on read (upstream's
  // render-throw). Here it lands in `error` instead — the Nuxt data contract.
  const liveState = computed<{ results: Item[], status: PaginationStatus, error: Error | null } | undefined>(() => {
    if (!live) return undefined
    try {
      return { results: live.results.value, status: live.status.value, error: null }
    }
    catch (thrown) {
      return { results: [], status: 'LoadingFirstPage', error: thrown as Error }
    }
  })
  const liveHasPage = computed(() => liveState.value !== undefined && liveState.value.status !== 'LoadingFirstPage')

  // A client without a Convex client (no deployment URL — the plugin warned
  // and provided nothing) has no live half; say so through `error` rather
  // than rendering the hydrated page as if it were live.
  const clientError = computed<Error | null>(() => {
    if (import.meta.server || client || toValue(args) === 'skip') return null
    return new Error(
      '`useAsyncPaginatedQuery` could not start on the client: no Convex client is available. '
      + 'Set NUXT_PUBLIC_CONVEX_URL or `convex.url` in nuxt.config.',
    )
  })

  // The server page belongs to the initial args only. Once the live query
  // has delivered a page — or the args have moved on — it is retired for
  // good: a query reset to `LoadingFirstPage` by an args change must not
  // show the previous args' rows while its own load.
  const initialArgsJson = argsJson(initialArgs)
  let payloadRetired = false
  const payloadApplies = computed(() => {
    // Both retiring conditions are reactive reads, so the flag flips inside
    // the very recompute they trigger and needs no watcher of its own.
    if (liveHasPage.value || argsJson(toValue(args)) !== initialArgsJson) payloadRetired = true
    return !payloadRetired && payloadPage.value !== undefined
  })

  const results = computed<Item[]>(() => {
    if (liveHasPage.value) return liveState.value!.results
    return payloadApplies.value ? payloadPage.value! : []
  })
  const status = computed<PaginationStatus>(() => {
    if (liveHasPage.value) return liveState.value!.status
    if (payloadApplies.value) return asyncData.data.value!.isDone ? 'Exhausted' : 'CanLoadMore'
    return 'LoadingFirstPage'
  })
  const isLoading = computed(() => status.value === 'LoadingFirstPage' || status.value === 'LoadingMore')
  const error = computed<Error | null>(
    () => liveState.value?.error ?? clientError.value ?? asyncData.error.value ?? null,
  )

  const loadMore = (numItems: number) => {
    live?.loadMore(numItems)
  }
  const refresh = (opts?: { dedupe?: 'cancel' | 'defer' }) => asyncData.refresh(opts)

  const result: AsyncPaginatedQueryData<Item> = { results, status, isLoading, error, loadMore, refresh }
  const promise = Promise.resolve(asyncData).then(() => result)
  return Object.assign(promise, result)
}

/** Stable JSON for a set of query args (or the skip sentinel). */
function argsJson(args: unknown): string {
  return args === 'skip' ? '"skip"' : JSON.stringify(convexToJson((args ?? {}) as Value))
}

/** Payload key for a paginated query + initial args + page size. Exported for tests. @internal */
export function defaultAsyncPaginatedQueryKey(queryName: string, initialArgs: unknown, initialNumItems: number): string {
  return `convex:paginated:${queryName}:${argsJson(initialArgs)}:${initialNumItems}`
}

/** @public */
export const useConvexAsyncPaginatedQuery = useAsyncPaginatedQuery
