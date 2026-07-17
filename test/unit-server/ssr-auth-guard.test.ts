// Runs in the `unit-server` project, where `import.meta.server` is compiled
// truthy like Nuxt's server bundle — exercising the SSR branch of
// `createConvexAuthState`: an authenticated provider during SSR must never
// wire `setAuth` (which lazily instantiates the WebSocket sync client — one
// leaked server socket per request), while auth state still renders loading.
import { describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { createConvexAuthState } from '../../src/runtime/vue/auth'

describe('createConvexAuthState during SSR', () => {
  it('never calls setAuth/clearAuth even when the provider is authenticated', () => {
    const setAuth = vi.fn()
    const clearAuth = vi.fn()

    const scope = effectScope()
    const state = scope.run(() =>
      createConvexAuthState({
        client: { setAuth, clearAuth },
        useAuth: () => ({
          // A provider hydrating a server-side session (e.g. Clerk under
          // @clerk/nuxt) reports authenticated during server render.
          isLoading: false,
          isAuthenticated: true,
          fetchAccessToken: async () => 'jwt',
        }),
      }),
    )!

    expect(setAuth).not.toHaveBeenCalled()

    // SSR renders the pre-confirmation loading state, matching the Better
    // Auth server plugin's stub auth state.
    expect(state.isLoading.value).toBe(true)
    expect(state.isAuthenticated.value).toBe(false)
    expect(state.isRefreshing.value).toBe(false)

    scope.stop()
    // No auth was registered, so disposal must not clear anything either.
    expect(clearAuth).not.toHaveBeenCalled()
  })
})
