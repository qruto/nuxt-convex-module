/**
 * The cached queries of `convex-helpers/react/cache/hooks`: {@link useQueries},
 * {@link useQuery} and {@link usePaginatedQuery}, on the cache
 * `provideConvexQueryCache` provides.
 */
import type {
  FunctionArgs,
  FunctionReference,
  FunctionReference_future,
  FunctionReturnType,
} from 'convex/server'
import { getFunctionName } from 'convex/server'
import { convexToJson, type Value } from 'convex/values'
import { computed, inject, toValue, watch, type ComputedRef, type MaybeRefOrGetter, type ShallowRef } from 'vue'
import type { OptionalRestArgsOrSkip } from '../../../vue/composables/use-query'
import { useQueries as useQueriesCore } from '../../../vue/composables/use-queries'
import { makeUsePaginatedQuery } from '../paginated'
import { ConvexQueryCacheKey } from './provider'

const uuid
  = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID.bind(crypto)
    : () =>
        Math.random().toString(36).substring(2)
        + Math.random().toString(36).substring(2)

/**
 * Load a variable number of reactive Convex queries, utilizing
 * the query cache.
 *
 * `useQueries` is similar to {@link useQuery} but it allows
 * loading multiple queries which can be useful for loading a dynamic number
 * of queries.
 *
 * Throws an error if not used under `provideConvexQueryCache`.
 *
 * @param queries - An object mapping identifiers to objects of
 * `{query: string, args: Record<string, Value> }` describing which query
 * functions to fetch, as a value, a ref or a getter.
 * @returns A ref of an object with the same keys as the input. The values are
 * the result of the query function, `undefined` if it's still loading, or an
 * `Error` if it threw an exception.
 *
 * @public
 */
export function useQueries(
  queries: MaybeRefOrGetter<Record<
    string,
    {
      query: FunctionReference<'query'> | FunctionReference_future<'query'>
      args: Record<string, Value>
    }
  >>,
): Readonly<ShallowRef<Record<string, any | undefined | Error>>> {
  const cache = inject(ConvexQueryCacheKey, { registry: null })
  if (cache.registry === null) {
    throw new Error(
      'Could not find `ConvexQueryCacheContext`! This `useQuery` implementation must be used in the Vue component '
      + 'tree under `ConvexQueryCacheProvider`. Did you forget it? ',
    )
  }
  const queryKeys = computed(() => {
    const keys: Record<string, string> = {}
    for (const [key, { query, args }] of Object.entries(toValue(queries))) {
      keys[key] = createQueryKey(query, args)
    }
    return keys
  })

  // PARITY: D-01
  // Upstream holds the cached subscriptions from an effect, which React
  // never runs on the server.
  if (!import.meta.server) {
    // Upstream's effect depends on the registry too: a provider with new
    // options builds a new one.
    watch(
      [() => cache.registry!, () => JSON.stringify(queryKeys.value)],
      ([registry], _previous, onCleanup) => {
        const ids: string[] = []
        for (const [key, { query, args }] of Object.entries(toValue(queries))) {
          const id = uuid()
          registry.start(id, queryKeys.value[key]!, query, args)
          ids.push(id)
        }
        onCleanup(() => {
          for (const id of ids) {
            registry.end(id)
          }
        })
      },
      { immediate: true },
    )
  }
  return useQueriesCore(() => toValue(queries) as Record<string, { query: FunctionReference<'query'>, args: Record<string, Value> }>)
}

/**
 * Load a reactive query within a Vue component, utilizing the query cache.
 *
 * Throws an error if not used under the Convex client and `provideConvexQueryCache`.
 *
 * @param query - a {@link FunctionReference} for the public query to run
 * like `api.dir1.dir2.filename.func`, as a value, a ref or a getter.
 * @param queryArgs - The arguments to the query function or the string "skip" if the
 * query should not be loaded, as a value, a ref or a getter.
 * @returns A ref of the result of the query. If the query is loading it holds `undefined`.
 *
 * @public
 */
export function useQuery<
  Query extends FunctionReference<'query'> | FunctionReference_future<'query'>,
>(
  query: MaybeRefOrGetter<Query>,
  ...queryArgs: OptionalRestArgsOrSkip<Query>
): ComputedRef<FunctionReturnType<Query> | undefined> {
  // Unlike the regular useQuery implementation, we don't need to memoize
  // the params here, since the cached useQueries will handle that.
  const results = useQueries(() => {
    const args = toValue(queryArgs[0]) ?? {}
    return args === 'skip'
      ? {} as Record<string, never> // Use queries doesn't support skip.
      : {
          _default: { query: toValue(query), args: args as Record<string, Value> },
        }
  })

  return computed(() => {
    // This may be undefined either because the upstream
    // value is actually undefined, or because the value
    // was not sent to `useQueries` due to "skip".
    const result = results.value._default
    if (result instanceof Error) {
      throw result
    }
    return result
  })
}

/**
 * Generate a query key from a query function and its arguments.
 * @param query Query function reference like api.foo.bar
 * @param args Arguments to the function, like { foo: "bar" }
 * @returns A string key that uniquely identifies the query and its arguments.
 */
function createQueryKey<
  Query extends FunctionReference<'query'> | FunctionReference_future<'query'>,
>(query: Query, args: FunctionArgs<Query>): string {
  const queryString = getFunctionName(query)
  const key = [queryString, convexToJson(args)]
  const queryKey = JSON.stringify(key)
  return queryKey
}

// NOTE!: We use the same ID so it's always cached, but it can mean a split is
// required off the bat if it's an old stale query result.
function nextPaginationId(): number {
  return 0
}

/**
 * Load data reactively from a paginated query to a create a growing list,
 * utilizing the query cache.
 *
 * Note: This is a modified version of the original `usePaginatedQuery`
 * composable. The main difference is that subscriptions stay active longer.
 *
 * This can be used to power "infinite scroll" UIs.
 *
 * If the query reference or arguments change, the pagination state will be reset
 * to the first page. Similarly, if any of the pages result in an InvalidCursor
 * error or an error associated with too much data, the pagination state will also
 * reset to the first page.
 *
 * To learn more about pagination, see [Paginated Queries](https://docs.convex.dev/database/pagination).
 *
 * @param query - A FunctionReference to the public query function to run,
 * as a value, a ref or a getter.
 * @param args - The arguments object for the query function, excluding
 * the `paginationOpts` property, as a value, a ref or a getter. That
 * property is injected by this composable.
 * @param options - An object specifying the `initialNumItems` to be loaded in
 * the first page, and the `customPagination` to use, as a value, a ref or a getter.
 * @param options.customPagination - Set this to true when you are using
 * `stream` or `paginator` helpers on the server. This enables gapless
 * pagination by connecting the pages explicitly when calling `loadMore`.
 * @returns The refs of the currently loaded items and the status of the
 * pagination, and a `loadMore` function.
 *
 * @public
 */
export const usePaginatedQuery = makeUsePaginatedQuery(useQueries, nextPaginationId)
