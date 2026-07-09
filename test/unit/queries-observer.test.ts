import { anyApi, type FunctionReference } from 'convex/server'
import type { Value } from 'convex/values'
import { afterEach, beforeEach, expect, test, vi, type MockedFunction } from 'vitest'
import type { RequestForQueries } from '../../src/runtime/vue/composables/use-queries'
import { QueriesObserver } from '../../src/runtime/vue/queries-observer'
import FakeWatch from '../fake-watch'

let queriesObserver: QueriesObserver
let createWatch: MockedFunction<(
  query: FunctionReference<'query'>,
  args: Record<string, Value>,
  options?: { journal?: unknown, paginationOptions?: unknown },
) => FakeWatch<Value>>
let listener: MockedFunction<() => void>

beforeEach(() => {
  createWatch = vi.fn(() => new FakeWatch<Value>()) as MockedFunction<(
    query: FunctionReference<'query'>,
    args: Record<string, Value>,
    options?: { journal?: unknown, paginationOptions?: unknown },
  ) => FakeWatch<Value>>
  queriesObserver = new QueriesObserver(createWatch)
  listener = vi.fn() as MockedFunction<() => void>
  queriesObserver.subscribe(listener)
})

afterEach(() => {
  queriesObserver.destroy()
})

test('getLocalResults', () => {
  const queries: RequestForQueries = {
    query: {
      query: anyApi.myQuery!.default!,
      args: {},
    },
  }

  queriesObserver.setQueries(queries)

  expect(queriesObserver.getLocalResults(queries)).toStrictEqual({
    query: undefined,
  })

  // The listener isn't notified for our own changes.
  expect(listener.mock.calls.length).toBe(0)

  // If we update the value of the query, the listener is notified and the
  // local results include the update.
  createWatch.mock.results[0]!.value.setValue('query value')
  expect(listener.mock.calls.length).toBe(1)

  createWatch.mockImplementation(() => {
    const watch = new FakeWatch<Value>()
    watch.value = 'query value'
    return watch
  })

  expect(queriesObserver.getLocalResults(queries)).toStrictEqual({
    query: 'query value',
  })
})

test('getLocalResults stores a thrown Error as the result value', () => {
  // Callers distinguish errors from normal results by the value being an
  // `Error` instance, so a throwing `localQueryResult` is collected, not thrown.
  const error = new Error('query failed')
  createWatch.mockImplementation(() => {
    const watch = new FakeWatch<Value>()
    watch.localQueryResult = () => {
      throw error
    }
    return watch
  })

  const queries: RequestForQueries = {
    query: {
      query: anyApi.myQuery!.default!,
      args: {},
    },
  }

  const results = queriesObserver.getLocalResults(queries)
  expect(results.query).toBe(error)
})

test('getLocalResults re-throws non-Error values', () => {
  const nonError = { reason: 'not an Error instance' }
  createWatch.mockImplementation(() => {
    const watch = new FakeWatch<Value>()
    watch.localQueryResult = () => {
      throw nonError
    }
    return watch
  })

  const queries: RequestForQueries = {
    query: {
      query: anyApi.myQuery!.default!,
      args: {},
    },
  }

  let thrown: unknown
  try {
    queriesObserver.getLocalResults(queries)
  }
  catch (e) {
    thrown = e
  }
  expect(thrown).toBe(nonError)
})

test('if the query changes, only stay subscribed to the second query', () => {
  queriesObserver.setQueries({
    query: {
      query: anyApi.myQuery!.default!,
      args: {},
    },
  })

  queriesObserver.setQueries({
    query: {
      query: anyApi.myQuery2!.default!,
      args: {},
    },
  })

  // The listener isn't notified for our own changes.
  expect(listener.mock.calls.length).toBe(0)

  // There were 2 watches created. We should be subscribed to only the second.
  expect(createWatch.mock.calls.length).toBe(2)
  expect(createWatch.mock.results[0]!.value.numCallbacks()).toBe(0)
  expect(createWatch.mock.results[1]!.value.numCallbacks()).toBe(1)
})

test('if the query args change, only stay subscribed to the second args', () => {
  queriesObserver.setQueries({
    query: {
      query: anyApi.myQuery!.default!,
      args: { arg: 'first arg' },
    },
  })

  queriesObserver.setQueries({
    query: {
      query: anyApi.myQuery!.default!,
      args: { arg: 'new arg' },
    },
  })

  // The listener isn't notified for our own changes.
  expect(listener.mock.calls.length).toBe(0)

  // There were 2 watches created. We should be subscribed to only the second.
  expect(createWatch.mock.calls.length).toBe(2)
  expect(createWatch.mock.results[0]!.value.numCallbacks()).toBe(0)
  expect(createWatch.mock.results[1]!.value.numCallbacks()).toBe(1)
})

test('if the query does not change, we only have one subscription', () => {
  queriesObserver.setQueries({
    query: {
      query: anyApi.myQuery!.default!,
      args: { arg1: 'arg1', arg2: 1, arg3: {} },
    },
  })

  expect(createWatch.mock.calls.length).toBe(1)
  expect(createWatch.mock.results[0]!.value.numCallbacks()).toBe(1)

  // Re-adding the same query doesn't create a new watch.
  queriesObserver.setQueries({
    query: {
      query: anyApi.myQuery!.default!,
      args: { arg1: 'arg1', arg2: 1, arg3: {} },
    },
  })

  expect(createWatch.mock.calls.length).toBe(1)
  expect(createWatch.mock.results[0]!.value.numCallbacks()).toBe(1)
})

test('destroy unsubscribes from all queries', () => {
  queriesObserver.setQueries({
    query: {
      query: anyApi.myQuery!.default!,
      args: {},
    },
  })

  queriesObserver.destroy()

  // No subscriptions to the watch now.
  expect(createWatch.mock.calls.length).toBe(1)
  expect(createWatch.mock.results[0]!.value.numCallbacks()).toBe(0)
})

test('swapping createWatch recreates subscriptions', () => {
  queriesObserver.setQueries({
    query: {
      query: anyApi.myQuery!.default!,
      args: {},
    },
  })

  // We should have a listener for the query.
  expect(createWatch.mock.calls.length).toBe(1)
  expect(createWatch.mock.results[0]!.value.numCallbacks()).toBe(1)

  // Pretend that the server sent us a query journal.
  createWatch.mock.results[0]!.value.setJournal('query journal')

  // Swap out the `createWatch` function.
  const createWatch2 = vi.fn(() => new FakeWatch<Value>()) as MockedFunction<(
    query: FunctionReference<'query'>,
    args: Record<string, Value>,
  ) => FakeWatch<Value>>

  queriesObserver.setCreateWatch(createWatch2)

  // No subscriptions left for the original watch.
  expect(createWatch.mock.calls.length).toBe(1)
  expect(createWatch.mock.results[0]!.value.numCallbacks()).toBe(0)

  // Now there is a sub using the new createWatch function and the
  // journal was passed through!
  expect(createWatch2.mock.calls.length).toBe(1)
  expect(createWatch2.mock.results[0]!.value.numCallbacks()).toBe(1)
  expect(createWatch2.mock.calls[0]).toEqual([
    anyApi.myQuery!.default!,
    {},
    { journal: 'query journal' },
  ])
})
