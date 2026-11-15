/**
 * The paginated query of `convex-helpers`, which the package ships twice: in
 * `react.ts` for the `stream` and `paginator` server helpers, and in
 * `react/cache/hooks.ts` on the cached queries, where `customPagination` is an
 * option. The two copies differ only there and in the pagination id, so
 * this translates them once (PARITY N-18). Not part of the public API.
 */
import type {
  FunctionReference,
  PaginationOptions,
  PaginationResult,
} from 'convex/server'
import { getFunctionName } from 'convex/server'
import type { Value } from 'convex/values'
import { ConvexError, convexToJson } from 'convex/values'
import { computed, shallowRef, toValue, type ComputedRef, type MaybeRefOrGetter, type ShallowRef } from 'vue'
import { useConvexOrThrow } from '../../vue/client'
import type {
  PaginatedQueryArgs,
  PaginatedQueryItem,
  PaginatedQueryReference,
  PaginationStatus,
  UsePaginatedQueryReturnType,
} from '../../vue/composables/use-paginated-query'

/** The `useQueries` a paginated query runs its pages on. */
type UseQueriesHook = (
  queries: MaybeRefOrGetter<Record<string, { query: FunctionReference<'query'>, args: Record<string, Value> }>>,
) => Readonly<ShallowRef<Record<string, any>>> | ComputedRef<Record<string, any>>

// Incrementing integer for each page queried in the usePaginatedQuery hook.
type QueryPageKey = number

type UsePaginatedQueryState = {
  query: FunctionReference<'query'>
  args: Record<string, Value>
  id?: number
  nextPageKey: QueryPageKey
  pageKeys: QueryPageKey[]
  queries: Record<
    QueryPageKey,
    {
      query: FunctionReference<'query'>
      args: { paginationOpts: PaginationOptions & { id?: number } }
    }
  >
  ongoingSplits: Record<QueryPageKey, [QueryPageKey, QueryPageKey]>
  skip: boolean
}

// State updaters, applied as `state.value = updater(state.value)` — the Vue
// translation of upstream's `setState(updater)`.
const splitQuery
  = (key: QueryPageKey, splitCursor: string, continueCursor: string) =>
    (prevState: UsePaginatedQueryState) => {
      const queries = { ...prevState.queries }
      const splitKey1 = prevState.nextPageKey
      const splitKey2 = prevState.nextPageKey + 1
      const nextPageKey = prevState.nextPageKey + 2
      queries[splitKey1] = {
        query: prevState.query,
        args: {
          ...prevState.args,
          paginationOpts: {
            ...prevState.queries[key]!.args.paginationOpts,
            endCursor: splitCursor,
          },
        },
      }
      queries[splitKey2] = {
        query: prevState.query,
        args: {
          ...prevState.args,
          paginationOpts: {
            ...prevState.queries[key]!.args.paginationOpts,
            cursor: splitCursor,
            endCursor: continueCursor,
          },
        },
      }
      const ongoingSplits = { ...prevState.ongoingSplits }
      ongoingSplits[key] = [splitKey1, splitKey2]
      return {
        ...prevState,
        nextPageKey,
        queries,
        ongoingSplits,
      }
    }

const completeSplitQuery
  = (key: QueryPageKey) => (prevState: UsePaginatedQueryState) => {
    const completedSplit = prevState.ongoingSplits[key]
    if (completedSplit === undefined) {
      return prevState
    }
    const queries = { ...prevState.queries }
    delete queries[key]
    const ongoingSplits = { ...prevState.ongoingSplits }
    delete ongoingSplits[key]
    let pageKeys = prevState.pageKeys.slice()
    const pageIndex = prevState.pageKeys.findIndex(v => v === key)
    if (pageIndex >= 0) {
      pageKeys = [
        ...prevState.pageKeys.slice(0, pageIndex),
        ...completedSplit,
        ...prevState.pageKeys.slice(pageIndex + 1),
      ]
    }
    return {
      ...prevState,
      queries,
      pageKeys,
      ongoingSplits,
    }
  }

type PageResult = PaginationResult<Value> & {
  splitCursor?: string | null
  pageStatus?: 'SplitRecommended' | 'SplitRequired' | null
}

type InternalResult = {
  results: Value[]
  status: PaginationStatus
  isLoading: boolean
  loadMore: (numItems: number) => void
} | { error: Error }

function noop(_numItems: number): void {
  // Intentional noop.
}

/**
 * The paginated query on `useQueriesHook`. `nextPaginationId` gives each
 * pagination its id, as the cached copy does; without it the page options
 * carry none, as the copy in `react.ts` does.
 */
export function makeUsePaginatedQuery(
  useQueriesHook: UseQueriesHook,
  nextPaginationId?: () => number,
) {
  return function usePaginatedQuery<Query extends PaginatedQueryReference>(
    query: Query,
    args: MaybeRefOrGetter<PaginatedQueryArgs<Query> | 'skip'>,
    options: {
      initialNumItems: number
      /**
       * Set this to true if you are using the `stream` or `paginator` helpers.
       */
      customPagination?: boolean
    },
  ): UsePaginatedQueryReturnType<Query> {
    if (
      typeof options?.initialNumItems !== 'number'
      || options.initialNumItems <= 0
    ) {
      throw new Error(
        `\`options.initialNumItems\` must be a positive number. Received \`${options?.initialNumItems}\`.`,
      )
    }
    const convexClient = useConvexOrThrow('usePaginatedQuery')
    const logger = convexClient.logger

    const createInitialState = (argsObject: Record<string, Value>, skip: boolean): UsePaginatedQueryState => {
      const id = nextPaginationId?.()
      return {
        query,
        args: argsObject,
        ...(id === undefined ? {} : { id }),
        nextPageKey: 1,
        pageKeys: skip ? [] : [0],
        queries: skip
          ? {}
          : {
              0: {
                query,
                args: {
                  ...argsObject,
                  paginationOpts: {
                    numItems: options.initialNumItems,
                    cursor: null,
                    ...(id === undefined ? {} : { id }),
                  },
                },
              },
            },
        ongoingSplits: {},
        skip,
      }
    }
    const currentArgs = () => {
      const raw = toValue(args)
      const skip = raw === 'skip'
      return { skip, argsObject: (skip ? {} : raw) as Record<string, Value> }
    }

    const initial = currentArgs()
    const state = shallowRef(createInitialState(initial.argsObject, initial.skip))

    // `currState` is the state that we'll render based on: a change of the
    // args resets it, as upstream does during render.
    const queriesInput = computed(() => {
      const { skip, argsObject } = currentArgs()
      if (
        skip !== state.value.skip
        || getFunctionName(query) !== getFunctionName(state.value.query)
        || JSON.stringify(convexToJson(argsObject as Value))
        !== JSON.stringify(convexToJson(state.value.args))
      ) {
        state.value = createInitialState(argsObject, skip)
      }
      return state.value.queries as unknown as Record<string, { query: FunctionReference<'query'>, args: Record<string, Value> }>
    })

    const resultsObject = useQueriesHook(queriesInput)

    const internal = computed((): InternalResult => {
      const currState = state.value
      const pageResults = resultsObject.value
      let currResult: PageResult | undefined
      let maybeLastResult: PageResult | undefined

      const allItems: Value[] = []
      let lastResultIsSet = false
      for (const pageKey of currState.pageKeys) {
        currResult = pageResults[pageKey]
        if (currResult === undefined) {
          break
        }

        if (currResult instanceof Error) {
          if (
            currResult.message.includes('InvalidCursor')
            || (currResult instanceof ConvexError
              && typeof currResult.data === 'object'
              && currResult.data?.isConvexSystemError === true
              && currResult.data?.paginationError === 'InvalidCursor')
          ) {
            // - InvalidCursor: If the cursor is invalid, probably the paginated
            // database query was data-dependent and changed underneath us. The
            // cursor in the params or journal no longer matches the current
            // database query.

            // In all cases, we want to restart pagination to throw away all our
            // existing cursors.
            logger.warn(
              'usePaginatedQuery hit error, resetting pagination state: '
              + currResult.message,
            )
            const { skip, argsObject } = currentArgs()
            state.value = createInitialState(argsObject, skip)
            return { results: [], status: 'LoadingFirstPage', isLoading: true, loadMore: noop }
          }
          else {
            return { error: currResult }
          }
        }
        const ongoingSplit = currState.ongoingSplits[pageKey]
        if (ongoingSplit !== undefined) {
          if (
            pageResults[ongoingSplit[0]] !== undefined
            && pageResults[ongoingSplit[1]] !== undefined
          ) {
            // Both pages of the split have results now. Swap them in.
            state.value = completeSplitQuery(pageKey)(state.value)
          }
        }
        else if (
          currResult.splitCursor
          && (currResult.pageStatus === 'SplitRecommended'
            || currResult.pageStatus === 'SplitRequired'
            // For custom pagination, we eagerly split the page when it grows.
            || (options.customPagination
              ? currResult.page.length > options.initialNumItems
              : currResult.page.length > options.initialNumItems * 2))
        ) {
          // If a single page has more than 1.5x the expected number of items,
          // or if the server requests a split, split the page into two.
          state.value = splitQuery(
            pageKey,
            currResult.splitCursor,
            currResult.continueCursor,
          )(state.value)
        }
        if (currResult.pageStatus === 'SplitRequired') {
          // If pageStatus is 'SplitRequired', it means the server was not able to
          // fetch the full page. So we stop results before the incomplete
          // page and return 'LoadingMore' while the page is splitting.
          maybeLastResult = undefined
          lastResultIsSet = true
          break
        }
        allItems.push(...currResult.page)
      }
      if (!lastResultIsSet) maybeLastResult = currResult

      if (maybeLastResult === undefined && currState.pageKeys.length <= 1) {
        return { results: allItems, status: 'LoadingFirstPage', isLoading: true, loadMore: noop }
      }
      else if (
        maybeLastResult === undefined
        // The last page (which isn't the first page) is splitting, which is how
        // we model loading more with custom pagination.
        || (options.customPagination
          && currState.ongoingSplits[currState.pageKeys.at(-1)!] !== undefined)
      ) {
        return { results: allItems, status: 'LoadingMore', isLoading: true, loadMore: noop }
      }
      if (maybeLastResult.isDone) {
        return { results: allItems, status: 'Exhausted', isLoading: false, loadMore: noop }
      }
      const continueCursor = maybeLastResult.continueCursor
      let alreadyLoadingMore = false
      return {
        results: allItems,
        status: 'CanLoadMore',
        isLoading: false,
        loadMore: (numItems: number) => {
          if (!alreadyLoadingMore) {
            alreadyLoadingMore = true
            const prevState = state.value
            let nextPageKey = prevState.nextPageKey
            const queries = { ...prevState.queries }
            let ongoingSplits = prevState.ongoingSplits
            let pageKeys = prevState.pageKeys
            if (options.customPagination) {
              // Connect the current last page to the next page
              // by setting the endCursor of the last page to the continueCursor
              // of the next page.
              const lastPageKey = prevState.pageKeys.at(-1)!
              const boundLastPageKey = nextPageKey
              queries[boundLastPageKey] = {
                query: prevState.query,
                args: {
                  ...prevState.args,
                  paginationOpts: {
                    ...queries[lastPageKey]!.args.paginationOpts,
                    endCursor: continueCursor,
                  },
                },
              }
              nextPageKey++
              ongoingSplits = {
                ...ongoingSplits,
                [lastPageKey]: [boundLastPageKey, nextPageKey],
              }
            }
            else {
              pageKeys = [...prevState.pageKeys, nextPageKey]
            }
            queries[nextPageKey] = {
              query: prevState.query,
              args: {
                ...prevState.args,
                paginationOpts: {
                  numItems,
                  cursor: continueCursor,
                  ...(prevState.id === undefined ? {} : { id: prevState.id }),
                },
              },
            }
            nextPageKey++
            state.value = {
              ...prevState,
              pageKeys,
              nextPageKey,
              queries,
              ongoingSplits,
            }
          }
        },
      }
    })

    // Upstream throws a page's error while rendering. Each ref throws it
    // when read, so the error reaches the reader of any of them.
    const current = () => {
      const value = internal.value
      if ('error' in value) throw value.error
      return value
    }
    return {
      results: computed(() => current().results as PaginatedQueryItem<Query>[]),
      status: computed(() => current().status),
      isLoading: computed(() => current().isLoading),
      loadMore: (numItems: number) => {
        current().loadMore(numItems)
      },
    }
  }
}
