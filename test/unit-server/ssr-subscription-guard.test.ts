// Runs in the `unit-server` project, where `import.meta.server` is compiled
// truthy like Nuxt's server bundle — exercising the SSR branches of the live
// query composables: during SSR they must read local results only and never
// subscribe (subscribing lazily instantiates the WebSocket client).
import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { anyApi } from 'convex/server'
import type { FunctionReference } from 'convex/server'
import type { QueryJournal } from 'convex/browser'
import type { Value } from 'convex/values'
import { type RequestForQueries, useQueriesHelper } from '../../src/runtime/vue/composables/use-queries'
import { useSubscription } from '../../src/runtime/vue/composables/use-subscription'
import type { CreateWatch } from '../../src/runtime/vue/queries-observer'
import { ConvexVueClient } from '../../src/runtime/vue/client'

const query1Ref = anyApi.query1!.default! as FunctionReference<'query'>

class FakeWatch<T extends Value> {
  value: T | undefined
  private callbacks = new Set<() => void>()

  onUpdate(callback: () => void): () => void {
    this.callbacks.add(callback)
    return () => {
      this.callbacks.delete(callback)
    }
  }

  localQueryResult(): T | undefined {
    return this.value
  }

  localQueryLogs(): string[] | undefined {
    return undefined
  }

  journal(): QueryJournal | undefined {
    return undefined
  }

  numCallbacks(): number {
    return this.callbacks.size
  }
}

describe('useQueriesHelper during SSR', () => {
  it('reads local results without subscribing', () => {
    const watches: Array<FakeWatch<Value>> = []
    const createWatch: CreateWatch = vi.fn((_q?: unknown, _a?: unknown, _o?: unknown) => {
      const watch = new FakeWatch<Value>()
      watches.push(watch)
      return watch
    })

    const queries: RequestForQueries = {
      query1: { query: query1Ref, args: {} },
    }

    const scope = effectScope()
    const result = scope.run(() => useQueriesHelper(queries, createWatch))!

    // Local results are read (no sync client exists server-side → undefined)…
    expect(result.value).toStrictEqual({ query1: undefined })
    // …but no watch ever received an onUpdate subscription.
    expect(watches.length).toBeGreaterThan(0)
    for (const watch of watches) {
      expect(watch.numCallbacks()).toBe(0)
    }

    scope.stop()
  })

  it('never instantiates the WebSocket sync client on a real ConvexVueClient', () => {
    const client = new ConvexVueClient('https://example.convex.cloud')
    const createWatch: CreateWatch = (query, args) => client.watchQuery(query, args, {})

    const queries: RequestForQueries = {
      query1: { query: query1Ref, args: {} },
    }

    const scope = effectScope()
    const result = scope.run(() => useQueriesHelper(queries, createWatch))!

    expect(result.value).toStrictEqual({ query1: undefined })
    // The lazy `sync` getter must not have been triggered during SSR setup.
    expect((client as unknown as { cachedSync?: unknown }).cachedSync).toBeUndefined()

    scope.stop()
  })
})

describe('useSubscription during SSR', () => {
  it('reads the initial value without subscribing', () => {
    const subscribe = vi.fn(() => () => {})

    const scope = effectScope()
    const state = scope.run(() =>
      useSubscription({ getCurrentValue: () => 42, subscribe }),
    )!

    expect(state.value).toBe(42)
    expect(subscribe).not.toHaveBeenCalled()

    scope.stop()
  })
})
