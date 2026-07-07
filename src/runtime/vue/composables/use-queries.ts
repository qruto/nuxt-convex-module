import type { Value } from 'convex/values'
import { onScopeDispose, shallowRef, toValue, watchEffect, type MaybeRefOrGetter, type ShallowRef } from 'vue'
import { useConvexOrThrow } from '../client'
import { QueriesObserver, type CreateWatch, type SubscribeToPaginatedQueryOptions } from '../queries-observer'
import type { QueryJournal } from 'convex/browser'
import type { FunctionReference } from 'convex/server'
import type { RequestForQueries } from 'convex/react'

/**
 * Load a variable number of reactive Convex queries.
 *
 * `useQueries` is similar to {@link useQuery} but it allows
 * loading multiple queries which can be useful for loading a dynamic number
 * of queries without violating the rules of composables.
 *
 * This composable accepts an object whose keys are identifiers for each query and the
 * values are objects of `{ query: FunctionReference, args: Record<string, Value> }`. The
 * `query` is a FunctionReference for the Convex query function to load, and the `args` are
 * the arguments to that function.
 *
 * The composable returns an object that maps each identifier to the result of the query,
 * `undefined` if the query is still loading, or an instance of `Error` if the query
 * threw an exception.
 *
 * For example if you loaded a query like:
 * ```typescript
 * const results = useQueries({
 *   messagesInGeneral: {
 *     query: "listMessages",
 *     args: { channel: "#general" }
 *   }
 * });
 * ```
 * then the result would look like:
 * ```typescript
 * {
 *   messagesInGeneral: [{
 *     channel: "#general",
 *     body: "hello"
 *     _id: ...,
 *     _creationTime: ...
 *   }]
 * }
 * ```
 *
 * This composable returns a reactive result that updates
 * whenever any of the query results change.
 *
 * Throws an error if no Convex client has been provided (see {@link useConvex}).
 *
 * @param queries - An object mapping identifiers to objects of
 * `{query: string, args: Record<string, Value> }` describing which query
 * functions to fetch. Reactive (ref/computed/getter) or plain.
 * @returns A shallow ref of an object with the same keys as the input. The
 * values are the result of the query function, `undefined` if it's still
 * loading, or an `Error` if it threw an exception.
 *
 * @public
 */
export function useQueries(
  queries: MaybeRefOrGetter<RequestForQueries>,
): ShallowRef<Record<string, any | undefined | Error>> {
  // Error message includes `useQuery` because this composable is called by
  // `useQuery` more often than it's called directly.
  const convex = useConvexOrThrow('useQuery')
  // Upstream memoizes `createWatch` on the client identity; a composable runs
  // once with one client, so a plain closure suffices.
  const createWatch = (
    query: FunctionReference<'query'>,
    args: Record<string, Value>,
    {
      journal,
      paginationOptions,
    }: {
      journal?: QueryJournal
      paginationOptions?: SubscribeToPaginatedQueryOptions
    },
  ) => {
    if (paginationOptions) {
      return convex.watchPaginatedQuery(query, args, paginationOptions)
    }
    else {
      return convex.watchQuery(query, args, journal ? { journal } : {})
    }
  }
  return useQueriesHelper(queries, createWatch)
}

/**
 * Internal version of `useQueries` that is exported for testing.
 */
export function useQueriesHelper(
  queries: MaybeRefOrGetter<RequestForQueries>,
  createWatch: CreateWatch,
): ShallowRef<Record<string, any | undefined | Error>> {
  const observer = new QueriesObserver(createWatch)
  const results = shallowRef<Record<string, any | undefined | Error>>({})

  // Upstream reconciles per render (`useState` observer, `useSubscription`
  // resubscribe when the `queries` identity changes). A composable runs once,
  // so a single watchEffect re-runs the same reconciliation whenever the
  // reactive `queries` input changes.
  watchEffect((onCleanup) => {
    const currentQueries = toValue(queries)
    observer.setQueries(currentQueries)

    // Read the initial value synchronously.
    results.value = observer.getLocalResults(currentQueries)

    const unsubscribe = observer.subscribe(() => {
      results.value = observer.getLocalResults(toValue(queries))
    })

    onCleanup(unsubscribe)
  })

  // Unsubscribe from all queries on unmount.
  onScopeDispose(() => observer.destroy())

  return results
}

// Upstream declares `RequestForQueries` here; the port re-exports the
// canonical type from `convex/react` instead of duplicating its shape.
export type { RequestForQueries } from 'convex/react'

/** @public */
export const useConvexQueries = useQueries
