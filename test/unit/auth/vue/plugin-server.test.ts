import { beforeEach, describe, expect, it, vi } from 'vitest'

// The ordinary SSR request: a visitor, so the Better Auth server plugin
// prefetches the Convex JWT into the initial-token state the client plugin
// reads. The prerender flavour, where it must NOT, lives in
// test/unit-server/prerender-auth-prefetch.test.ts — `import.meta.prerender`
// is compile-time, and only that project compiles it truthy.

const getToken = vi.fn(async (): Promise<string | null> => 'jwt')
const convexAuth = vi.fn(() => ({ getToken }))
vi.mock('../../../../src/runtime/better-auth/nuxt/server', () => ({ convexAuth }))

// The plugin runs on every server render, so it must not load the app's auth
// client: one with browser-only top-level code would fail every page.
vi.mock('#convex/auth-client', () => {
  throw new Error('the server plugin imported #convex/auth-client')
})

const state = { value: null as string | null }
const noSession = { value: false }
const requestHeaders: { cookie?: string } = {}
const event = { path: '/' }
const cacheControl = { value: undefined as unknown }
let routeRules: Record<string, unknown> = {}
vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: { setup: unknown }) => plugin.setup,
  useRuntimeConfig: () => ({ public: { convex: { url: 'https://example.convex.cloud' } } }),
  useState: (key: string) => key === 'convex:betterAuth:noSession' ? noSession : state,
  useRequestEvent: () => event,
  useRequestHeaders: () => requestHeaders,
  useResponseHeader: () => cacheControl,
  getRouteRules: () => routeRules,
}))

const setup = (await import('../../../../src/runtime/better-auth/vue/plugin.server')).default as unknown as
  (nuxtApp: { vueApp: { provide: (key: unknown, value: unknown) => void }, hook: (name: string, fn: () => void) => void }) => Promise<unknown>

describe('better-auth server plugin on an ordinary SSR request', () => {
  beforeEach(() => {
    state.value = null
    noSession.value = false
    delete requestHeaders.cookie
    vi.clearAllMocks()
  })

  it('provides the client and the auth stub, prefetches the token and forbids caching the response', async () => {
    const provide = vi.fn()
    await setup({ vueApp: { provide }, hook: vi.fn() })
    expect(provide).toHaveBeenCalledTimes(3)
    expect(convexAuth).toHaveBeenCalledWith(event)
    expect(state.value).toBe('jwt')
    expect(cacheControl.value).toBe('private, no-store')
  })

  it('hands the prefetched token to the token store of this request', async () => {
    const provide = vi.fn()
    await setup({ vueApp: { provide }, hook: vi.fn() })
    expect(getToken).toHaveBeenCalledTimes(1)
    const { BetterAuthTokenStoreKey } = await import('../../../../src/runtime/better-auth/vue/token-store')
    const store = provide.mock.calls.find(([key]) => key === BetterAuthTokenStoreKey)?.[1]
    expect(store.cachedToken.value).toBe('jwt')
    expect(store.initialTokenUsed).toBe(true)
  })
})

// PARITY: D-18
describe('the no-session flag the browser waits on', () => {
  beforeEach(() => {
    state.value = null
    noSession.value = false
    delete requestHeaders.cookie
    routeRules = {}
    cacheControl.value = undefined
  })

  const run = () => setup({ vueApp: { provide: vi.fn() }, hook: vi.fn() })

  it('is set for a request with no session cookie that got no token', async () => {
    getToken.mockResolvedValueOnce(null)
    requestHeaders.cookie = 'theme=dark'
    await run()
    expect(noSession.value).toBe(true)
  })

  it('stays off for a request that carries a session cookie, under any prefix', async () => {
    getToken.mockResolvedValueOnce(null)
    requestHeaders.cookie = 'theme=dark; __Secure-my-app.session_token=abc'
    await run()
    expect(noSession.value).toBe(false)
  })

  it('stays off for a signed-in request', async () => {
    await run()
    expect(noSession.value).toBe(false)
  })

  // PARITY: D-18 — Nitro's cached handler renders with no cookie, so every
  // cached render looks signed out; its payload is served to everyone.
  it.each([
    ['swr', { swr: true }],
    ['isr', { isr: 60 }],
    ['cache', { cache: { maxAge: 60 } }],
    ['prerender', { prerender: true }],
  ])('stays off on a render a %s route rule may serve to others', async (_name, rules) => {
    getToken.mockResolvedValueOnce(null)
    routeRules = rules
    await run()
    expect(noSession.value).toBe(false)
  })

  it('stays off on a render whose Cache-Control lets a shared cache keep it', async () => {
    getToken.mockResolvedValueOnce(null)
    cacheControl.value = 'public, s-maxage=600'
    await run()
    expect(noSession.value).toBe(false)
  })

  it('stays off when the prefetch failed: the server could not tell', async () => {
    getToken.mockRejectedValueOnce(new Error('deployment down'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await run()
    expect(noSession.value).toBe(false)
    warn.mockRestore()
  })
})

describe('isSharedRender', () => {
  it('reads route rules and the shared-cache directives, and nothing else', async () => {
    const { isSharedRender } = await import('../../../../src/runtime/better-auth/vue/plugin.server')
    expect(isSharedRender({}, undefined)).toBe(false)
    expect(isSharedRender({ cache: false }, 'private, no-store')).toBe(false)
    expect(isSharedRender({ ssr: true }, 'max-age=60')).toBe(false)
    expect(isSharedRender({ swr: 60 }, undefined)).toBe(true)
    expect(isSharedRender({}, 'S-MAXAGE=60')).toBe(true)
    expect(isSharedRender({}, ['public', 'max-age=60'])).toBe(true)
  })
})
