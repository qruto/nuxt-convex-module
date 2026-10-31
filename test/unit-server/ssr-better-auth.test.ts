// PARITY: D-13
// Runs in the `unit-server` project, where `import.meta.server` is compiled
// truthy like Nuxt's server bundle. One Nitro process renders every visitor's
// request with the same module, so `useBetterAuth()` must read a store of the
// request's own and never subscribe to Better Auth's one session store.
import { describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'

const useSession = vi.fn()
vi.mock('#convex/auth-client', () => ({
  authClient: { useSession, convex: { token: vi.fn() } },
}))

const { useBetterAuth } = await import('../../src/runtime/better-auth/vue/use-better-auth')
const { BetterAuthTokenStoreKey, createBetterAuthTokenStore, seedInitialToken } = await import('../../src/runtime/better-auth/vue/token-store')

/** `useBetterAuth()` inside an app that provides `store`, as a request's server plugin does. */
function inRequest(store: ReturnType<typeof createBetterAuthTokenStore>) {
  const app = createApp({})
  app.provide(BetterAuthTokenStoreKey, store)
  return app.runWithContext(() => useBetterAuth())
}

describe('useBetterAuth during SSR', () => {
  it('reads a signed-in request as signed in from its prefetched token', () => {
    const store = createBetterAuthTokenStore()
    seedInitialToken(store, 'jwt-ada')

    const auth = inRequest(store)

    expect(auth.isAuthenticated.value).toBe(true)
    expect(auth.isLoading.value).toBe(false)
    // The session itself is the browser's to load: pending, as it hydrates.
    expect(auth.session.value.isPending).toBe(true)
    expect(auth.user.value).toBeNull()
  })

  it('keeps each request to its own token', () => {
    const signedIn = createBetterAuthTokenStore()
    seedInitialToken(signedIn, 'jwt-ada')

    expect(inRequest(signedIn).isAuthenticated.value).toBe(true)
    expect(inRequest(createBetterAuthTokenStore()).isAuthenticated.value).toBe(false)
    // A call outside any app gets a store of its own, never a visitor's.
    expect(useBetterAuth().isAuthenticated.value).toBe(false)
  })

  it('never subscribes to the session store every request shares', () => {
    inRequest(createBetterAuthTokenStore())
    useBetterAuth()
    expect(useSession).not.toHaveBeenCalled()
  })
})
