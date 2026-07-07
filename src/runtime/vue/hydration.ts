import type { FunctionReference } from 'convex/server'
import { makeFunctionReference } from 'convex/server'
import type { Value } from 'convex/values'
import { jsonToConvex } from 'convex/values'
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useConvexQueries, type RequestForQueries } from './composables/use-queries'

/**
 * The preloaded query payload, which should be passed to a client component
 * and passed to {@link usePreloadedQuery}.
 *
 * @public
 */
export type Preloaded<Query extends FunctionReference<'query'>> = {
  __type: Query
  _name: string
  _argsJSON: string
  _valueJSON: string
}

/**
 * Load a reactive query within a Vue component using a `Preloaded` payload
 * from the server returned by {@link preloadQuery}.
 *
 * This Vue composable contains internal state that will cause a rerender
 * whenever the query result changes.
 *
 * Throws an error if no Convex client has been provided (see {@link useConvex}).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { usePreloadedQuery } from '#imports'
 *
 * const props = defineProps<{
 *   preloaded: Preloaded<typeof api.tasks.list>
 * }>()
 *
 * const tasks = usePreloadedQuery(props.preloaded)
 * </script>
 * ```
 *
 * @param preloadedQuery - The `Preloaded` query payload from the server.
 *   Accepts a ref, computed, or getter; a fresh payload re-subscribes with the
 *   new query and args.
 * @returns a computed ref with the result of the query. Initially returns the
 * result fetched by the server. Subsequently returns the result fetched by the client.
 *
 * @public
 */
export function usePreloadedQuery<Query extends FunctionReference<'query'>>(
  preloadedQuery: MaybeRefOrGetter<Preloaded<Query>>,
): ComputedRef<Query['_returnType']> {
  const { query, args, preloadedResult } = usePreloadedPayload(preloadedQuery)

  // On the server there is no live query — expose the preloaded value as a
  // computed without opening a Convex subscription. The client plugin
  // replaces this with a reactive query after hydration.
  if (import.meta.server) {
    return preloadedResult
  }

  const result = useReactiveQuery(query, args)

  return computed(() =>
    result.value === undefined ? preloadedResult.value : result.value,
  )
}

/**
 * Derive the query reference and reactive args/fallback from a (possibly
 * reactive) `Preloaded` payload. All three are reactive: swapping in a payload
 * for a different query re-derives the reference, matching upstream's
 * `usePreloadedQuery`, which recomputes `makeFunctionReference(_name)` on
 * every render.
 *
 * @internal
 */
export function usePreloadedPayload<Query extends FunctionReference<'query'>>(
  preloadedQuery: MaybeRefOrGetter<Preloaded<Query>>,
): {
  query: ComputedRef<Query>
  args: ComputedRef<Query['_args']>
  preloadedResult: ComputedRef<Query['_returnType']>
} {
  const args = computed(
    () => jsonToConvex(toValue(preloadedQuery)._argsJSON) as Query['_args'],
  )

  const preloadedResult = computed(
    () => jsonToConvex(toValue(preloadedQuery)._valueJSON) as Query['_returnType'],
  )

  const query = computed(
    () => makeFunctionReference(toValue(preloadedQuery)._name) as Query,
  )

  return { query, args, preloadedResult }
}

/**
 * A `useQuery` variant whose query *reference* is reactive alongside its args.
 * Pass `'skip'` args to pause the subscription.
 *
 * @internal
 */
export function useReactiveQuery<Query extends FunctionReference<'query'>>(
  query: ComputedRef<Query>,
  args: ComputedRef<Query['_args'] | 'skip'>,
): ComputedRef<Query['_returnType'] | undefined> {
  const queriesInput = computed((): RequestForQueries => {
    const currentArgs = args.value
    if (currentArgs === 'skip') {
      return {}
    }
    return {
      query: {
        query: query.value,
        args: currentArgs as Record<string, Value>,
      },
    }
  })

  const allResults = useConvexQueries(queriesInput)

  // Mirrors `useQuery`: errors throw on read and propagate to the nearest
  // `errorCaptured` boundary.
  return computed(() => {
    const r = allResults.value.query as Query['_returnType'] | undefined | Error
    if (r instanceof Error) throw r
    return r
  })
}
