import { shallowRef, watchEffect, type ShallowRef } from 'vue'

/*
This code is taken from https://gist.github.com/bvaughn/e25397f70e8c65b0ae0d7c90b731b189
because correct subscriptions in async React is complex!

It could probably be replaced with `useSyncExternalStore()`.

The MIT License (MIT)
Copyright © 2023 Brian Vaughn

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the “Software”), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
 * Composable used for safely managing subscriptions in concurrent mode.
 *
 * In order to avoid removing and re-adding subscriptions each time this composable is called,
 * the parameters passed to this composable should be memoized in some way–
 * either by wrapping the entire params object with useMemo()
 * or by wrapping the individual callbacks with useCallback().
 *
 * @internal
 */
export function useSubscription<Value>({
  // (Synchronously) returns the current value of our subscription.
  getCurrentValue,

  // This function is passed an event handler to attach to the subscription.
  // It should return an unsubscribe function that removes the handler.
  subscribe,
}: {
  getCurrentValue: () => Value
  subscribe: (callback: () => void) => () => void
}): ShallowRef<Value> {
  // Read the current value from our subscription.
  // When this value changes, we'll trigger an update with Vue.
  // A composable runs once per setup — the params can never change between
  // renders — so upstream's staleness bookkeeping (storing the params in
  // state and reconciling on change) has no Vue analog and is dropped.
  const state = shallowRef(getCurrentValue())

  // Upstream defers subscribing to a passive effect (useEffect) to avoid
  // subscribing while rendering under React's concurrent mode; Vue has no
  // render/commit split, so a scope-bound `watchEffect` (torn down via
  // `onCleanup`/unmount) is the sanctioned analog.
  watchEffect((onCleanup) => {
    let didUnsubscribe = false

    const checkForUpdates = () => {
      // It's possible that this callback will be invoked even after being unsubscribed,
      // if it's removed as a result of a subscription event/update.
      // Ignoring it here keeps a torn-down subscription from writing a stale value.
      if (didUnsubscribe) {
        return
      }

      // Some subscriptions will auto-invoke the handler, even if the value hasn't changed.
      // If the value hasn't changed, no update is needed.
      // Bail out so Vue can avoid an unnecessary trigger.
      const value = getCurrentValue()
      if (state.value === value) {
        return
      }

      state.value = value
    }
    const unsubscribe = subscribe(checkForUpdates)

    // Because we're subscribing in a passive effect,
    // it's possible that an update has occurred between the initial read and our effect handler.
    // Check for this and schedule an update if work has occurred.
    checkForUpdates()

    onCleanup(() => {
      didUnsubscribe = true
      unsubscribe()
    })
  })

  // Return the current value for our caller to use while rendering.
  return state
}
