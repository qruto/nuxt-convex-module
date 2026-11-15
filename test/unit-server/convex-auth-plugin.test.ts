// PARITY: A-19
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { silentConnectLogger } from '../helpers/silent-logger'

// The cookie-session plugin during a server render (`import.meta.server` is
// true in this project). It moves what the proxy middleware left on the
// request into the payload, where upstream's server provider passes props.

const states = new Map<string, { value: unknown }>()
const cacheControl = { value: undefined as unknown }
let event: { context: Record<string, unknown> } | undefined
vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: { setup: unknown }) => plugin.setup,
  useState: (key: string, init?: () => unknown) => {
    if (!states.has(key)) states.set(key, { value: init?.() ?? null })
    return states.get(key)
  },
  useRequestEvent: () => event,
  useResponseHeader: () => cacheControl,
}))

const { useAuthActions, useAuthToken } = await import('../../src/runtime/convex-auth/vue/index')
const { useConvexAuth } = await import('../../src/runtime/vue/auth/index')
const { ConvexClientKey, ConvexVueClient } = await import('../../src/runtime/vue/client')
const plugin = (await import('../../src/runtime/convex-auth/nuxt/plugin')).default as unknown as (nuxtApp: unknown) => void

function render(convexAuth?: { token: string | null, isAuthenticatedFunctionName: string }) {
  event = { context: convexAuth ? { convexAuth } : {} }
  const vueApp = createApp({ render: () => null })
  vueApp.provide(ConvexClientKey, new ConvexVueClient('https://happy-animal-123.convex.cloud', { logger: silentConnectLogger }))
  const hook = vi.fn()
  vueApp.runWithContext(() => plugin({ vueApp, hook }))
  return { hook, use: <T>(composable: () => T) => vueApp.runWithContext(composable) }
}

afterEach(() => {
  states.clear()
  cacheControl.value = undefined
})

describe('convex-auth cookie-session plugin on the server', () => {
  it('puts the session\'s token and the query\'s name in the payload, and forbids caching', () => {
    render({ token: 'jwt-1', isAuthenticatedFunctionName: 'auth:isAuthenticated' })
    expect(states.get('convex:initialToken')?.value).toBe('jwt-1')
    expect(states.get('convex:auth:isAuthenticated')?.value).toBe('auth:isAuthenticated')
    // The page carries this visitor's token.
    expect(cacheControl.value).toBe('private, no-store')
  })

  it('leaves caching alone for a visitor with no session', () => {
    render({ token: null, isAuthenticatedFunctionName: 'auth:isAuthenticated' })
    expect(states.get('convex:initialToken')?.value).toBeNull()
    expect(states.get('convex:auth:isAuthenticated')?.value).toBe('auth:isAuthenticated')
    expect(cacheControl.value).toBeUndefined()
  })

  it('renders the loading state, as upstream\'s server snapshot does', () => {
    const { use, hook } = render({ token: 'jwt-1', isAuthenticatedFunctionName: 'auth:isAuthenticated' })
    const auth = use(() => useConvexAuth())
    expect([auth.isLoading.value, auth.isAuthenticated.value, auth.isRefreshing.value]).toEqual([true, false, false])
    expect(use(() => useAuthToken()).value).toBeNull()
    expect(use(() => useAuthActions())).toBeDefined()
    // The session is never loaded on the server.
    expect(hook).not.toHaveBeenCalled()
  })
})
