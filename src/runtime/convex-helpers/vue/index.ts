/**
 * A Vue port of `convex-helpers/react`: {@link useQuery} with a status object,
 * {@link makeUseQueryWithStatus}, and {@link usePaginatedQuery} for the
 * `stream` and `paginator` server helpers.
 *
 * @module convex-helpers/client
 */
import type {
  FunctionReference,
  FunctionReference_future,
  FunctionReturnType,
} from 'convex/server'
import type { Value } from 'convex/values'
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import type { OptionalRestArgsOrSkip } from '../../vue/composables/use-query'
import type {
  PaginatedQueryArgs,
  PaginatedQueryReference,
  UsePaginatedQueryReturnType,
} from '../../vue/composables/use-paginated-query'
import { useQueries } from '../../vue/composables/use-queries'
import { makeUsePaginatedQuery } from './paginated'

/**
 * Use in place of `useQuery` from `nuxt-convex-module` to fetch data, with a
 * status object the result refs carry.
 *
 * @example
 * ```ts
 * const result = useQuery(api.foo.bar, { arg: 'baz' })
 * // result.value.status, result.value.data, result.value.error, …
 * ```
 *
 * @public
 */
export const useQuery = makeUseQueryWithStatus(useQueries)

/**
 * Makes a `useQuery` with a status object on any `useQueries`, such as the
 * cached one of `nuxt-convex-module/convex-helpers/cache`:
 * ```ts
 * import { useQueries } from 'nuxt-convex-module/convex-helpers/cache'
 * export const useQuery = makeUseQueryWithStatus(useQueries)
 * ```
 *
 * @param useQueriesHook The `useQueries` to load the query on.
 * @returns A `useQuery` whose result is a ref of
 * `{ status, data, error, isSuccess, isPending, isError }`. It never throws.
 * @public
 */
export function makeUseQueryWithStatus(useQueriesHook: typeof useQueries) {
  return function useQuery<
    Query extends
    FunctionReference<'query'> | FunctionReference_future<'query'>,
  >(
    query: Query,
    ...queryArgs: OptionalRestArgsOrSkip<Query>
  ): ComputedRef<
    | {
      status: 'success'
      data: FunctionReturnType<Query>
      error: undefined
      isSuccess: true
      isPending: false
      isError: false
    }
    | {
      status: 'pending'
      data: undefined
      error: undefined
      isSuccess: false
      isPending: true
      isError: false
    }
    | {
      status: 'error'
      data: undefined
      error: Error
      isSuccess: false
      isPending: false
      isError: true
    }
  > {
    const currentArgs = () => toValue(queryArgs[0]) ?? {}
    const queries = () => {
      const args = currentArgs()
      if (args === 'skip') {
        return {} as Record<string, never>
      }
      return {
        data: {
          query: query as FunctionReference<'query'>,
          args: args as Record<string, Value>,
        },
      }
    }
    const result = useQueriesHook(queries)
    return computed(() => {
      if (currentArgs() === 'skip') {
        return {
          status: 'pending',
          data: undefined,
          error: undefined,
          isSuccess: false,
          isPending: true,
          isError: false,
        } as const
      }
      if (result.value.data instanceof Error) {
        return {
          status: 'error',
          data: undefined,
          error: result.value.data,
          isSuccess: false,
          isPending: false,
          isError: true,
        } as const
      }
      const { data } = result.value
      if (data === undefined) {
        return {
          status: 'pending',
          data,
          error: undefined,
          isSuccess: false,
          isPending: true,
          isError: false,
        } as const
      }
      return {
        status: 'success',
        data,
        error: undefined,
        isSuccess: true,
        isPending: false,
        isError: false,
      } as const
    })
  }
}

const usePaginatedQueryWithOptions = makeUsePaginatedQuery(useQueries)

/**
 * This is a clone of the `usePaginatedQuery` composable from
 * `nuxt-convex-module` made for use with the `stream` and `paginator` helpers,
 * which don't automatically "grow" until you explicitly call `loadMore`.
 *
 * @param query - A FunctionReference to the public query function to run.
 * @param args - The arguments object for the query function, excluding
 * the `paginationOpts` property, as a value, a ref or a getter.
 * @param options - An object specifying the `initialNumItems` to be loaded in
 * the first page.
 * @returns The refs of the currently loaded items and the status of the
 * pagination, and a `loadMore` function.
 * @public
 */
export function usePaginatedQuery<Query extends PaginatedQueryReference>(
  query: Query,
  args: MaybeRefOrGetter<PaginatedQueryArgs<Query> | 'skip'>,
  options: { initialNumItems: number },
): UsePaginatedQueryReturnType<Query> {
  return usePaginatedQueryWithOptions(query, args, { ...options, customPagination: true })
}
