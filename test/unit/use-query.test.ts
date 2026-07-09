import { describe, expect, test } from 'vitest'
import { createApp, effectScope } from 'vue'
import { makeFunctionReference } from 'convex/server'
import type { Value } from 'convex/values'
import {
  useQuery as useQueryImpl,
  useQuery_experimental,
  type useQuery as useQueryReal,
} from '../../src/runtime/vue/composables/use-query'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'
import FakeWatch from '../fake-watch'

// Intentional noop, we're only testing types.
const useQuery = (() => {}) as unknown as typeof useQueryReal

const noArgsQuery = makeFunctionReference<'query', Record<string, never>, string>('module:noArgs')
const argsQuery = makeFunctionReference<'query', { _arg: string }, string>('module:args')

describe('useQuery types', () => {
  test('queries with arguments', () => {
    useQuery(argsQuery, { _arg: 'asdf' })

    // @ts-expect-error extra args is an error
    useQuery(argsQuery, { _arg: 'asdf', arg2: 123 })

    // @ts-expect-error wrong arg type is an error
    useQuery(argsQuery, { _arg: 1 })

    // @ts-expect-error eliding args object is an error
    useQuery(argsQuery)
  })

  test('queries without arguments', () => {
    useQuery(noArgsQuery, {})
    useQuery(noArgsQuery)

    // @ts-expect-error adding args is not allowed
    useQuery(noArgsQuery, { _arg: 1 })
  })
})

// ── runtime error branches ───────────────────────────────────────────────────
// Mirroring upstream's render-time throw, the composables' computed getters
// throw (or return `status: 'error'`) when the observer stored an `Error` as
// the query result. `app.runWithContext` stands in for a component tree so
// `inject(ConvexClientKey)` resolves; the fake client's `watchQuery` hands
// back a watch whose `localQueryResult` throws.

function runWithThrowingWatch<T>(error: Error, fn: () => T): { result: T, stop: () => void } {
  const watch = new FakeWatch<Value>()
  watch.localQueryResult = () => {
    throw error
  }

  const app = createApp({ render: () => null })
  app.provide(ConvexClientKey, { watchQuery: () => watch } as unknown as ConvexVueClient)

  const scope = effectScope()
  const result = app.runWithContext(() => scope.run(fn))!
  return { result, stop: () => scope.stop() }
}

describe('useQuery runtime error branches', () => {
  test('useQuery throws the stored Error when the value is read', () => {
    const error = new Error('server rejected the query')
    const { result, stop } = runWithThrowingWatch(error, () =>
      useQueryImpl(argsQuery, { _arg: 'asdf' }))

    expect(() => result.value).toThrow(error)
    stop()
  })

  test('useQuery_experimental with throwOnError throws when the value is read', () => {
    const error = new Error('server rejected the query')
    const { result, stop } = runWithThrowingWatch(error, () =>
      useQuery_experimental({ query: argsQuery, args: { _arg: 'asdf' }, throwOnError: true }))

    expect(() => result.value).toThrow(error)
    stop()
  })

  test('useQuery_experimental returns the error result state by default', () => {
    const error = new Error('server rejected the query')
    const { result, stop } = runWithThrowingWatch(error, () =>
      useQuery_experimental({ query: argsQuery, args: { _arg: 'asdf' } }))

    expect(result.value).toStrictEqual({ error, status: 'error' })
    stop()
  })
})

// Intentionally disabled because we're only testing types.
describe.skip('useQuery typing', () => {
  test('useQuery with no args query', () => {
    useQuery(noArgsQuery, {})
    // @ts-expect-error This should be an error
    useQuery(noArgsQuery, { x: 3 })
    useQuery(noArgsQuery, 'skip')
    const x: number | null = null
    useQuery(noArgsQuery, x === null ? 'skip' : {})
    // This should be an error, but isn't :(, probably a bug in TypeScript
    useQuery(noArgsQuery, x === null ? 'skip' : { x })
    // @ts-expect-error This should be an error
    useQuery(noArgsQuery, x === null ? 'skip' : { x: 3 })
  })

  test('useQuery with query taking args', () => {
    // @ts-expect-error This should be an error
    useQuery(argsQuery)
    // @ts-expect-error This should be an error
    useQuery(argsQuery, { _arg: 1 })
    useQuery(argsQuery, { _arg: 'asdf' })
    useQuery(argsQuery, 'skip')
    const _arg: string | null = null
    useQuery(argsQuery, _arg === null ? 'skip' : { _arg })
    // @ts-expect-error This should be an error
    useQuery(argsQuery, _arg === null ? null : { _arg: 1 })
  })
})
