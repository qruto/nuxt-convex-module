import { flushPromises, mount } from '@vue/test-utils'
import { getFunctionName, makeFunctionReference, type FunctionReference_future } from 'convex/server'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { defineComponent, h, provide, ref, shallowRef, type ComputedRef } from 'vue'
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

/**
 * A client whose pages answer what `answer` says for each query and its
 * pagination options, re-read on `update()` as a subscription would be.
 */
function scriptedClient(answer: (name: string, opts: { numItems: number, cursor: string | null, endCursor?: string }) => unknown) {
  const listeners = new Set<() => void>()
  const calls: Array<{ name: string, opts: { numItems: number, cursor: string | null, endCursor?: string } }> = []
  const unsubscribed: string[] = []
  const watchQuery = vi.fn((reference: unknown, args: { paginationOpts: { numItems: number, cursor: string | null, endCursor?: string } }) => {
    const name = getFunctionName(reference as never)
    calls.push({ name, opts: args.paginationOpts })
    return {
      localQueryResult: () => {
        const value = answer(name, args.paginationOpts)
        if (value instanceof Error) throw value
        return value
      },
      onUpdate: (listener: () => void) => {
        listeners.add(listener)
        return () => {
          listeners.delete(listener)
          unsubscribed.push(name)
        }
      },
      journal: () => undefined,
    }
  })
  const logger = { warn: vi.fn() }
  return {
    client: { watchQuery, logger } as unknown as ConvexVueClient,
    calls,
    unsubscribed,
    logger,
    update: () => listeners.forEach(listener => listener()),
  }
}

const page = (items: number[], extra: Record<string, unknown> = {}) =>
  ({ page: items, isDone: false, continueCursor: String(items.at(-1)! + 1), ...extra })

describe('the paginated query, case by case', () => {
  // Upstream reads the query on every render; a new one resets the pages.
  it('a new query from a ref resets the pagination and loads it', async () => {
    const other = makeFunctionReference<'query', { paginationOpts: { numItems: number, cursor: string | null } }, { page: number[], isDone: boolean, continueCursor: string }>('test:other')
    const { client } = scriptedClient(name => page(name === 'test:list' ? [0, 1] : [10, 11]))
    const current = shallowRef(listQuery)
    const { result } = mountUnder(client, () => usePaginatedQuery(current, {}, { initialNumItems: 2 }))
    await flushPromises()
    expect(result.current.results.value).toEqual([0, 1])

    current.value = other
    await flushPromises()
    void result.current.results.value
    await flushPromises()
    expect(result.current.results.value).toEqual([10, 11])
  })

  it('sizes the first page from initialNumItems in a ref', async () => {
    const { client, calls } = scriptedClient(() => page([0]))
    const options = ref({ initialNumItems: 2 })
    const args = ref({ tag: 'a' })
    mountUnder(client, () => usePaginatedQuery(listQuery, args as never, options))
    await flushPromises()
    options.value = { initialNumItems: 5 }
    args.value = { tag: 'b' }
    await flushPromises()
    expect([...new Set(calls.map(c => c.opts.numItems))]).toEqual([2, 5])
  })

  // After the reset upstream returns no last result, so a pagination past
  // its first page reads `LoadingMore` for that render.
  it('resets on InvalidCursor, reading LoadingMore past the first page', async () => {
    let invalid = false
    const { client, calls, logger, update } = scriptedClient((_name, opts) =>
      opts.cursor === '2' && invalid ? new Error('InvalidCursor: the data changed') : page(opts.cursor === null ? [0, 1] : [2, 3]))
    const { result } = mountUnder(client, () => useCachedPaginatedQuery(listQuery, {}, { initialNumItems: 2 }))
    await flushPromises()
    result.current.loadMore(2)
    await flushPromises()
    expect(result.current.results.value).toEqual([0, 1, 2, 3])

    const firstPages = () => calls.filter(c => c.opts.cursor === null).length
    const before = firstPages()
    invalid = true
    update()
    await flushPromises()
    expect(result.current.status.value).toBe('LoadingMore')
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('resetting pagination state'))
    await flushPromises()
    void result.current.results.value
    expect(firstPages()).toBeGreaterThan(before)
  })

  it('reads Exhausted once the last page is done', async () => {
    const { client } = scriptedClient(() => page([0, 1], { isDone: true }))
    const { result } = mountUnder(client, () => usePaginatedQuery(listQuery, {}, { initialNumItems: 2 }))
    await flushPromises()
    expect(result.current.status.value).toBe('Exhausted')
    expect(result.current.isLoading.value).toBe(false)
  })

  it('a page the server could not fill splits, and its items wait for the split', async () => {
    const { client, calls } = scriptedClient((_name, opts) =>
      opts.endCursor === undefined
        ? page([0, 1], { pageStatus: 'SplitRequired', splitCursor: '1' })
        : page(opts.cursor === null ? [0] : [1]))
    const { result } = mountUnder(client, () => useCachedPaginatedQuery(listQuery, {}, { initialNumItems: 2 }))
    await flushPromises()
    expect(result.current.status.value).toBe('LoadingFirstPage')
    expect(result.current.results.value).toEqual([])
    await flushPromises()
    expect(calls.map(c => c.opts)).toContainEqual({ numItems: 2, cursor: null, id: 0, endCursor: '1' })
    void result.current.results.value
    await flushPromises()
    expect(result.current.results.value).toEqual([0, 1])
  })

  it('a new argument resets to the first page, and "skip" loads nothing', async () => {
    const { client, calls } = scriptedClient(() => page([0, 1]))
    const args = ref<Record<string, string> | 'skip'>({ tag: 'a' })
    const { result } = mountUnder(client, () => usePaginatedQuery(listQuery, args as never, { initialNumItems: 2 }))
    await flushPromises()
    result.current.loadMore(2)
    await flushPromises()

    args.value = 'skip'
    await flushPromises()
    expect(result.current.status.value).toBe('LoadingFirstPage')
    expect(result.current.results.value).toEqual([])
    const before = calls.length

    args.value = { tag: 'b' }
    await flushPromises()
    void result.current.results.value
    expect(new Set(calls.slice(before).map(c => JSON.stringify(c.opts)))).toEqual(new Set([JSON.stringify({ numItems: 2, cursor: null })]))
  })
})

describe('the query cache, case by case', () => {
  // Upstream's provider builds a new registry when an option changes.
  it('new options build a new cache, and the composables move to it', async () => {
    vi.useFakeTimers()
    const { client, watchQuery, unsubscribe } = setup('found')
    const options = ref({ expiration: 1000, maxIdleEntries: 5 })
    const { result } = mountUnder(client, () => useQuery(query, { id: 'one' }), options)
    expect(result.current.value).toBe('found')
    const opened = watchQuery.mock.calls.length

    options.value = { expiration: 2000, maxIdleEntries: 5 }
    await flushPromises()

    // A new cached subscription on the new cache; the old one idles out.
    expect(watchQuery.mock.calls.length).toBeGreaterThan(opened)
    unsubscribe.mockClear()
    await vi.advanceTimersByTimeAsync(1000)
    expect(unsubscribe).toHaveBeenCalled()
  })

  it('keeps at most maxIdleEntries idle subscriptions', async () => {
    vi.useFakeTimers()
    const { client, unsubscribed } = scriptedClient(() => 'found')
    const first = makeFunctionReference<'query', { id: string }, string>('test:first')
    const second = makeFunctionReference<'query', { id: string }, string>('test:second')
    const { visible } = mountUnder(client, () => ({ a: useQuery(first, { id: 'a' }), b: useQuery(second, { id: 'b' }) }), { maxIdleEntries: 1, expiration: 10_000 })

    visible.value = false
    await flushPromises()
    // One idles for the expiration; the other goes at once. Each query also
    // has the composable's own subscription, which ends with it.
    const cached = (name: string) => unsubscribed.filter(n => n === name).length
    expect(cached('test:first') + cached('test:second')).toBe(3)

    await vi.advanceTimersByTimeAsync(10_000)
    expect(cached('test:first') + cached('test:second')).toBe(4)
  })
})
