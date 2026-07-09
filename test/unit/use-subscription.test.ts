// Client-side behavior of the subscription primitive backing the live query
// composables. The SSR (never-subscribe) branch is covered separately in
// test/unit-server/ssr-subscription-guard.test.ts, where `import.meta.server`
// is compiled truthy.
import { describe, expect, it, vi } from 'vitest'
import { effectScope, nextTick, watch } from 'vue'
import { useSubscription } from '../../src/runtime/vue/composables/use-subscription'

// Instantiates useSubscription inside an effect scope (the composable's
// watchEffect needs an owner for teardown) with a controllable subscribe fn:
// `fire()` invokes the callback the composable registered, `setValue` changes
// what the next `getCurrentValue()` read returns.
function setup(initial = 1) {
  let value = initial
  let notify: (() => void) | undefined
  const unsubscribe = vi.fn()
  const subscribe = vi.fn((callback: () => void) => {
    notify = callback
    return unsubscribe
  })

  const scope = effectScope()
  const state = scope.run(() =>
    useSubscription({ getCurrentValue: () => value, subscribe }),
  )!

  return {
    state,
    scope,
    subscribe,
    unsubscribe,
    setValue: (next: number) => {
      value = next
    },
    fire: () => notify!(),
  }
}

describe('useSubscription', () => {
  it('updates the ref when the callback fires after the value changed', () => {
    const { state, scope, subscribe, setValue, fire } = setup(1)

    expect(subscribe).toHaveBeenCalledTimes(1)
    expect(state.value).toBe(1)

    setValue(2)
    fire()
    expect(state.value).toBe(2)

    scope.stop()
  })

  it('does not trigger a spurious update when the value is unchanged', async () => {
    // Some subscriptions auto-invoke the handler even when nothing changed;
    // the composable bails out before writing so watchers never re-fire.
    const { state, scope, fire } = setup(1)
    const watcherSpy = vi.fn()
    scope.run(() => {
      watch(state, watcherSpy)
    })

    fire()
    await nextTick()

    expect(state.value).toBe(1)
    expect(watcherSpy).not.toHaveBeenCalled()

    scope.stop()
  })

  it('unsubscribes when the owning scope stops', () => {
    const { scope, unsubscribe } = setup(1)

    expect(unsubscribe).not.toHaveBeenCalled()
    scope.stop()
    expect(unsubscribe).toHaveBeenCalledTimes(1)
  })

  it('ignores callbacks fired after teardown', () => {
    // A subscription event can still invoke the handler as it is being removed;
    // the torn-down callback must not write a stale value into the ref.
    const { state, scope, setValue, fire } = setup(1)

    scope.stop()
    setValue(99)
    fire()

    expect(state.value).toBe(1)
  })
})
