import { flushPromises, mount } from '@vue/test-utils'
import { makeFunctionReference, type FunctionReference_future } from 'convex/server'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { defineComponent, h, provide, ref, type ComputedRef } from 'vue'
import { usePaginatedQuery as useCachedPaginatedQuery, useQueries, useQuery, provideConvexQueryCache } from '../../src/runtime/convex-helpers/vue/cache/index'
import { makeUseQueryWithStatus, usePaginatedQuery } from '../../src/runtime/convex-helpers/vue/index'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

// The Vue counterpart of upstream's `react.test.ts`, scenario for scenario,
// then the cache, the status query and the custom pagination, which
// upstream's tests leave out.

const query = makeFunctionReference<'query', { id: string }, string>('test:query')
const futureQuery: FunctionReference_future<
  'query',
  'public',
  { id: string },
  string
> = query

/** A client whose `watchQuery` answers `value` for every query. */
function setup(value: string | undefined | Error) {
  const unsubscribe = vi.fn()
  const watchQuery = vi.fn(() => ({
    localQueryResult: () => {
      if (value instanceof Error) throw value
      return value
    },
    onUpdate: () => unsubscribe,
    journal: () => undefined,
  }))
  const client = { watchQuery, logger: { warn: vi.fn() } } as unknown as ConvexVueClient
  return { client, watchQuery, unsubscribe }
}

/** Run `useComposable` below the client and a query cache. */
function mountUnder<T>(client: ConvexVueClient, useComposable: () => T, cacheOptions: Parameters<typeof provideConvexQueryCache>[0] = { maxIdleEntries: 0 }) {
  const result = {} as { current: T }
  const visible = ref(true)
  const Child = defineComponent({
    setup() {
      result.current = useComposable()
      return () => null
    },
  })
  // A component cannot inject what it provides itself, so the cache sits
  // one level below the client.
  const Cache = defineComponent({
    setup() {
      provideConvexQueryCache(cacheOptions)
      return () => (visible.value ? h(Child) : null)
    },
  })
  const wrapper = mount(defineComponent({
    setup() {
      provide(ConvexClientKey, client)
      return () => h(Cache)
    },
  }))
  return { result, wrapper, visible }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('cached queries', () => {
  it.each([
    ['plain', query],
    ['future', futureQuery],
  ] as const)('cached useQuery subscribes with a %s reference', (_name, reference) => {
    const { client, watchQuery, unsubscribe } = setup('found')
    const { result, wrapper } = mountUnder(client, () => useQuery(reference, { id: 'one' }))
    expectTypeOf(result.current).toEqualTypeOf<ComputedRef<string | undefined>>()
    expect(result.current.value).toBe('found')
    expect(watchQuery).toHaveBeenCalledWith(reference, { id: 'one' })
    expect(unsubscribe).not.toHaveBeenCalled()
    wrapper.unmount()
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('cached useQueries composes with makeUseQueryWithStatus for future references', () => {
    const { client } = setup('found')
    const useQueryWithStatus = makeUseQueryWithStatus(useQueries)
    const { result } = mountUnder(client, () => useQueryWithStatus(futureQuery, { id: 'one' }))
    expectTypeOf(result.current.value.data).toEqualTypeOf<string | undefined>()
    expect(result.current.value).toEqual({
      status: 'success',
      data: 'found',
      error: undefined,
      isSuccess: true,
      isPending: false,
      isError: false,
    })
  })

  it.each([undefined, new Error('query failed')])('cached status queries preserve pending and error results: %s', (value) => {
    const { client } = setup(value)
    const useQueryWithStatus = makeUseQueryWithStatus(useQueries)
    const { result } = mountUnder(client, () => useQueryWithStatus(futureQuery, { id: 'one' }))
    expect(result.current.value.status).toBe(value === undefined ? 'pending' : 'error')
    expect(result.current.value.data).toBeUndefined()
    expect(result.current.value.error).toBe(value)
  })

  it('skipped future references do not open cached subscriptions', () => {
    const { client, watchQuery } = setup('found')
    const useQueryWithStatus = makeUseQueryWithStatus(useQueries)
    const { result } = mountUnder(client, () => ({
      cached: useQuery(futureQuery, 'skip'),
      status: useQueryWithStatus(futureQuery, 'skip'),
    }))
    expect(result.current.cached.value).toBeUndefined()
    expect(result.current.status.value.status).toBe('pending')
    expect(watchQuery).not.toHaveBeenCalled()
  })

  it('keeps the subscription open for `expiration` after the last component lets go', async () => {
    vi.useFakeTimers()
    const { client, watchQuery, unsubscribe } = setup('found')
    const { visible } = mountUnder(client, () => useQuery(query, { id: 'one' }), { expiration: 1000 })
    // The cache's own subscription, held beside the component's.
    const held = watchQuery.mock.calls.length

    visible.value = false
    await flushPromises()
    // The component's subscription ended; the cache's is still open.
    expect(unsubscribe).toHaveBeenCalledTimes(1)

    // A remount within the window takes the cached entry over.
    visible.value = true
    await flushPromises()
    visible.value = false
    await flushPromises()
    vi.advanceTimersByTime(999)
    expect(unsubscribe).toHaveBeenCalledTimes(2)

    vi.advanceTimersByTime(1)
    expect(unsubscribe).toHaveBeenCalledTimes(3)
    expect(held).toBeGreaterThan(0)
  })

  it('follows changed args, ending the old cached entry', async () => {
    const { client, watchQuery, unsubscribe } = setup('found')
    const id = ref('one')
    mountUnder(client, () => useQuery(query, () => ({ id: id.value })))
    id.value = 'two'
    await flushPromises()

    expect(watchQuery).toHaveBeenCalledWith(query, { id: 'two' })
    // `maxIdleEntries: 0` ends the idle entry at once.
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('throws the query\'s error when read', () => {
    const { client } = setup(new Error('query failed'))
    const { result } = mountUnder(client, () => useQuery(query, { id: 'one' }))
    expect(() => result.current.value).toThrow('query failed')
  })

  it('needs a query cache above it', () => {
    const { client } = setup('found')
    const Child = defineComponent({
      setup() {
        useQuery(query, { id: 'one' })
        return () => null
      },
    })
    expect(() => mount(defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        return () => h(Child)
      },
    }))).toThrow('Could not find `ConvexQueryCacheContext`!')
  })
})

describe('makeUseQueryWithStatus on the plain useQueries', () => {
  it('reports success, then follows the args', async () => {
    const { client, watchQuery } = setup('found')
    const useQueryWithStatus = makeUseQueryWithStatus((await import('../../src/runtime/vue/composables/use-queries')).useQueries)
    const id = ref('one')
    const { result } = mountUnder(client, () => useQueryWithStatus(query, () => ({ id: id.value })))
    expect(result.current.value).toMatchObject({ status: 'success', data: 'found', isSuccess: true })
    id.value = 'two'
    await flushPromises()
    expect(watchQuery).toHaveBeenCalledWith(query, { id: 'two' }, expect.anything())
  })
})

// A paginated query on a fake client: every page returns `size` items and
// a split cursor, until the cursor reaches `total`.
function pagedClient(size: (numItems: number) => number) {
  const calls: Array<{ paginationOpts: Record<string, unknown> }> = []
  const watchQuery = vi.fn((_query: unknown, args: { paginationOpts: { numItems: number, cursor: string | null, endCursor?: string } }) => {
    calls.push(args)
    const start = Number(args.paginationOpts.cursor ?? 0)
    const end = args.paginationOpts.endCursor === undefined
      ? start + size(args.paginationOpts.numItems)
      : Number(args.paginationOpts.endCursor)
    const page = Array.from({ length: end - start }, (_, i) => start + i)
    return {
      localQueryResult: () => ({
        page,
        isDone: false,
        continueCursor: String(end),
        splitCursor: String(start + Math.floor(page.length / 2)),
      }),
      onUpdate: () => () => {},
      journal: () => undefined,
    }
  })
  return { client: { watchQuery, logger: { warn: vi.fn() } } as unknown as ConvexVueClient, calls }
}

const listQuery = makeFunctionReference<'query', { paginationOpts: { numItems: number, cursor: string | null } }, { page: number[], isDone: boolean, continueCursor: string }>('test:list')

describe('usePaginatedQuery for the stream and paginator helpers', () => {
  it('loads the first page, and binds the last page to the next on loadMore', async () => {
    const { client, calls } = pagedClient(n => n)
    const { result } = mountUnder(client, () => usePaginatedQuery(listQuery, {}, { initialNumItems: 2 }))
    await flushPromises()
    expect(result.current.results.value).toEqual([0, 1])
    expect(result.current.status.value).toBe('CanLoadMore')
    // No pagination id, as upstream's `react.ts` sends none.
    expect(calls[0]!.paginationOpts).toEqual({ numItems: 2, cursor: null })

    result.current.loadMore(2)
    await flushPromises()

    // The last page gets an end cursor, and the new page starts there.
    expect(calls.map(c => c.paginationOpts)).toContainEqual({ numItems: 2, cursor: null, endCursor: '2' })
    expect(calls.map(c => c.paginationOpts)).toContainEqual({ numItems: 2, cursor: '2' })
    expect(result.current.results.value).toEqual([0, 1, 2, 3])
  })

  it('splits a page that grew past initialNumItems', async () => {
    // The server hands back one more item than was asked for.
    const { client, calls } = pagedClient(n => n + 1)
    const { result } = mountUnder(client, () => usePaginatedQuery(listQuery, {}, { initialNumItems: 2 }))
    await flushPromises()
    // The split runs when the results are read.
    void result.current.results.value
    await flushPromises()

    expect(calls.map(c => c.paginationOpts)).toContainEqual({ numItems: 2, cursor: null, endCursor: '1' })
    expect(calls.map(c => c.paginationOpts)).toContainEqual({ numItems: 2, cursor: '1', endCursor: '3' })
    expect(result.current.results.value).toEqual([0, 1, 2])
  })

  it('throws a page error from the refs', async () => {
    const watchQuery = vi.fn(() => ({
      localQueryResult: () => {
        throw new Error('page failed')
      },
      onUpdate: () => () => {},
      journal: () => undefined,
    }))
    const client = { watchQuery, logger: { warn: vi.fn() } } as unknown as ConvexVueClient
    const { result } = mountUnder(client, () => usePaginatedQuery(listQuery, {}, { initialNumItems: 2 }))
    await flushPromises()
    expect(() => result.current.results.value).toThrow('page failed')
    expect(() => result.current.status.value).toThrow('page failed')
  })

  it('rejects an initialNumItems that is not positive', () => {
    const { client } = pagedClient(n => n)
    expect(() => mountUnder(client, () => usePaginatedQuery(listQuery, {}, { initialNumItems: 0 })))
      .toThrow('`options.initialNumItems` must be a positive number. Received `0`.')
  })
})

describe('cached usePaginatedQuery', () => {
  it('sends pagination id 0, so every mount shares the cached pages', async () => {
    const { client, calls } = pagedClient(n => n)
    const { result } = mountUnder(client, () => useCachedPaginatedQuery(listQuery, {}, { initialNumItems: 2 }))
    await flushPromises()
    expect(result.current.results.value).toEqual([0, 1])
    expect(calls[0]!.paginationOpts).toEqual({ numItems: 2, cursor: null, id: 0 })
  })

  it('appends a page on loadMore without customPagination', async () => {
    const { client, calls } = pagedClient(n => n)
    const { result } = mountUnder(client, () => useCachedPaginatedQuery(listQuery, {}, { initialNumItems: 2 }))
    await flushPromises()
    result.current.loadMore(3)
    await flushPromises()
    expect(calls.map(c => c.paginationOpts)).toContainEqual({ numItems: 3, cursor: '2', id: 0 })
    expect(calls.map(c => c.paginationOpts)).not.toContainEqual(expect.objectContaining({ endCursor: '2' }))
    expect(result.current.results.value).toEqual([0, 1, 2, 3, 4])
  })
})
