// Unit coverage for the generic Vue auth wiring that doesn't need a mounted
// component tree: the missing-provider guard of `useConvexAuth` and the
// scoped variant `createScopedConvexAuthState` (used when installing auth
// state at the Nuxt app level). Component-tree behavior lives in
// test/nuxt/vue/convex-auth-state.test.ts.
import { describe, expect, it, vi } from 'vitest'
import { createApp, nextTick, ref } from 'vue'
import type { AuthTokenFetcher } from 'convex/browser'
import {
  createScopedConvexAuthState,
  useConvexAuth,
  type IConvexVueClient,
} from '../../../src/runtime/vue/auth'

describe('useConvexAuth', () => {
  it('throws when no auth provider is above in the tree', () => {
    // Silence Vue's own "injection not found" warning for the missing key.
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const app = createApp({ render: () => null })
    expect(() => app.runWithContext(() => useConvexAuth())).toThrow(
      'Could not find Convex auth context',
    )

    warnSpy.mockRestore()
  })
})

describe('createScopedConvexAuthState', () => {
  it('returns reactive auth state and a scope that disposes the watchers', async () => {
    const isLoading = ref(false)
    const isAuthenticated = ref(true)
    const fetchAccessToken: AuthTokenFetcher = vi.fn(async () => 'token')

    let onAuthChange: ((isAuthenticated: boolean) => void) | undefined
    const client: IConvexVueClient = {
      setAuth: vi.fn((_fetchToken, callback) => {
        onAuthChange = callback
      }),
      clearAuth: vi.fn(),
    }

    const { state, scope } = createScopedConvexAuthState({
      client,
      useAuth: () => ({ isLoading, isAuthenticated, fetchAccessToken }),
    })

    // The watchers registered inside the scope: setAuth ran immediately, and
    // the state is loading until the backend confirms the token.
    expect(client.setAuth).toHaveBeenCalledTimes(1)
    expect(state.isLoading.value).toBe(true)
    expect(state.isAuthenticated.value).toBe(false)

    // Backend confirms the token → the state reacts.
    onAuthChange?.(true)
    await nextTick()
    expect(state.isLoading.value).toBe(false)
    expect(state.isAuthenticated.value).toBe(true)

    // Stopping the scope runs the setAuth cleanup (clearAuth + reset to
    // loading)…
    scope.stop()
    expect(client.clearAuth).toHaveBeenCalledTimes(1)
    expect(state.isLoading.value).toBe(true)

    // …and disposes the watchers: a provider sign-out that live watchers
    // would settle to unauthenticated (isLoading false) is now ignored.
    isAuthenticated.value = false
    await nextTick()
    expect(state.isLoading.value).toBe(true)
    expect(client.setAuth).toHaveBeenCalledTimes(1)
  })
})
