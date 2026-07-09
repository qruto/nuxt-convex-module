import type { FunctionArgs, FunctionReference } from 'convex/server'
import { makeFunctionReference } from 'convex/server'
import type { Value } from 'convex/values'
import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useConvexQueries, type RequestForQueries } from './use-queries'
// Derive UseQueryResult from the canonical React integration (avoids duplicating
// the discriminated union shape here). Import is type-only so no "react" peer
// is pulled for pure-Vue usage. Barrel re-exports the same for consumers.
import type { UseQueryResult as ConvexUseQueryResult } from 'convex/react'

// Vue-enhanced form of upstream's `OptionalRestArgsOrSkip`: args accept a
// `MaybeRefOrGetter` for reactivity. `Record<string, never>` inlines convex's
// non-exported `EmptyObject`. The constraint matches upstream's
// `FunctionReference<any>` so generic helpers written against the upstream
// export keep compiling.
export type OptionalRestArgsOrSkip<FuncRef extends FunctionReference<any>>
  = FuncRef['_args'] extends Record<string, never>
    ? [args?: MaybeRefOrGetter<Record<string, never> | 'skip'>]
    : [args: MaybeRefOrGetter<FuncRef['_args'] | 'skip'>]

/**
 * Result returned by object-form {@link useQuery_experimental}.
 *
 * @public
 */
export type UseQueryResult<QueryResult, ThrowOnError extends boolean = false>
  = ConvexUseQueryResult<QueryResult, ThrowOnError>

type UseQueryOptions<
  Query extends FunctionReference<'query'>,
  ThrowOnError extends boolean,
> = {
  query: Query
  args: MaybeRefOrGetter<FunctionArgs<Query> | 'skip'>
  throwOnError?: ThrowOnError
}

/**
 * Load a reactive query within a Vue component.
 *
 * This Vue composable subscribes to a Convex query and updates the returned
 * ref whenever the query result changes. The subscription is managed
 * automatically -- it starts when the component mounts and stops when it
 * unmounts.
 *
 * Throws an error if no Convex client has been provided.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useQuery } from '#imports'
 * import { api } from '#convex/api'
 *
 * // Reactively loads tasks; the ref updates when data changes:
 * const tasks = useQuery(api.tasks.list, { completed: false })
 * // tasks.value is `undefined` while loading
 *
 * // Pass "skip" (or a reactive getter returning it) to conditionally
 * // disable the query:
 * const profile = useQuery(
 *   api.users.get,
 *   computed(() => userId.value ? { userId: userId.value } : 'skip'),
 * )
 * </script>
 * ```
 *
 * @param query - a {@link server.FunctionReference} for the public query to run
 * like `api.dir1.dir2.filename.func`.
 * @param args - The arguments to the query function or the string `"skip"` if
 * the query should not be loaded. Accepts a ref, computed, or getter for
 * reactive args.
 * @returns a computed ref with the result of the query. Contains `undefined`
 * while loading.
 *
 * @public
 */
export function useQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  ...args: OptionalRestArgsOrSkip<Query>
): ComputedRef<Query['_returnType'] | undefined> {
  const queryReference
    = typeof query === 'string'
      ? makeFunctionReference<'query', any, any>(query)
      : query

  // Upstream memoizes `queries` on the stringified args (`useMemo`); this
  // computed re-derives it reactively instead — args arrive as a
  // `MaybeRefOrGetter` per the Vue translation rules. Upstream's `parseArgs`
  // (convex/common, not a public export) reduces to the `?? {}` defaulting.
  const queries = computed((): RequestForQueries => {
    const rawArgs = toValue(args[0]) ?? {}
    const skip = rawArgs === 'skip'
    const argsObject = rawArgs === 'skip' ? {} : rawArgs
    return skip
      ? ({} as RequestForQueries)
      : { query: { query: queryReference, args: argsObject as Record<string, Value> } }
  })

  const results = useConvexQueries(queries)

  // Derived state → a `computed`. Mirroring upstream's render-time throw, the
  // getter throws on error — Vue surfaces that when `.value` is read during
  // render and propagates it to the nearest `errorCaptured` boundary (React's
  // `<ErrorBoundary>` analog).
  return computed(() => {
    const result = results.value['query'] as Query['_returnType'] | undefined | Error

    if (result instanceof Error) {
      throw result
    }
    return result
  })
}

/**
 * Load a reactive query within a Vue component using an options object.
 *
 * This is an experimental form of {@link useQuery} that accepts a single
 * {@link UseQueryOptions} object instead of positional arguments.
 *
 * Consumers are expected to check the returned object `status` field to
 * make proper use of the result. If an error occurs, it will be present
 * in the result object unless `throwOnError` is `true`, in which case
 * the error will be thrown instead.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useQuery_experimental as useQuery } from '#imports'
 * import { api } from '#convex/api'
 *
 * const state = useQuery({ query: api.tasks.list, args: { completed: false } })
 * // state.value.status: 'pending' | 'success' | 'error'
 * </script>
 * ```
 *
 * @param options - Query options. Pass `args: "skip"` to disable the query.
 * @returns a computed ref with the current query state as a
 * {@link UseQueryResult} object.
 *
 * @public
 */
export function useQuery_experimental<
  Query extends FunctionReference<'query'>,
  ThrowOnError extends boolean = false,
>(
  options: UseQueryOptions<Query, ThrowOnError>,
): ComputedRef<UseQueryResult<Query['_returnType'], ThrowOnError>>

export function useQuery_experimental<
  Query extends FunctionReference<'query'>,
  ThrowOnError extends boolean = false,
>(
  options: UseQueryOptions<Query, ThrowOnError>,
): ComputedRef<UseQueryResult<Query['_returnType'], false>> {
  const throwOnError = options.throwOnError ?? false
  const queryReference
    = typeof options.query === 'string'
      ? (makeFunctionReference<'query', any, any>(options.query) as Query)
      : options.query

  // Upstream memoizes `queries` on the stringified args (`useMemo`); this
  // computed re-derives it reactively instead.
  const queries = computed((): RequestForQueries => {
    const rawArgs = toValue(options.args)
    const skip = rawArgs === 'skip'
    const argsObject = !skip ? (rawArgs as Record<string, Value>) : {}
    return skip
      ? ({} as RequestForQueries)
      : { query: { query: queryReference, args: argsObject } }
  })

  const results = useConvexQueries(queries)

  // Derived discriminated-union state → a `computed`. The explicit type
  // argument gives the returned object literals their contextual type (so
  // `status: 'error'` narrows to the literal). Errors are returned as
  // `status: 'error'` unless `throwOnError`, in which case the getter throws
  // (→ `errorCaptured`).
  return computed<UseQueryResult<Query['_returnType'], false>>(() => {
    const result = results.value['query'] as Query['_returnType'] | undefined | Error

    if (result instanceof Error) {
      if (throwOnError) {
        throw result
      }
      return {
        error: result,
        status: 'error',
      }
    }

    if (result === undefined) {
      return {
        status: 'pending',
      }
    }

    return {
      data: result,
      status: 'success',
    }
  })
}

/** @public */
export const useConvexQuery = useQuery
