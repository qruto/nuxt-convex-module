// PARITY: A-13
// PARITY: A-08
// PARITY: A-07
import { afterEach, describe, expect, it, vi } from 'vitest'

// Drive the Better Auth client plugin's setup directly with a stubbed `#app`
// (the pattern from base-client-plugin.test.ts): the plugin creates + provides
// the Convex client and the scoped auth state, consuming the cross-domain
// one-time token first.

const runtimeConfig = { public: { convex: { url: 'https://example.convex.cloud', crossDomainCallbackRoute: '' } } }
const initialTokenState = { value: null as string | null }
const noSessionState = { value: false }

vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: unknown) =>
    typeof plugin === 'function' ? plugin : (plugin as { setup: unknown }).setup,
  useRuntimeConfig: () => runtimeConfig,
  useState: (key: string, init?: () => unknown) => {
    if (key === 'convex:betterAuth:noSession') return noSessionState
    if (initialTokenState.value === null && init) {
      initialTokenState.value = init() as string | null
    }
    return initialTokenState
  },
}))

const consumeCrossDomainOneTimeToken = vi.fn(async (..._args: unknown[]) => {})
vi.mock('../../../../src/runtime/better-auth/vue/cross-domain', () => ({
  consumeCrossDomainOneTimeToken: (...args: unknown[]) => consumeCrossDomainOneTimeToken(...args),
}))

const useBetterAuth = vi.fn()
const settleSessionWithoutClient = vi.fn()
vi.mock('../../../../src/runtime/better-auth/vue/use-better-auth', () => ({
  useBetterAuth: (...args: unknown[]) => useBetterAuth(...args),
  settleSessionWithoutClient: () => settleSessionWithoutClient(),
}))

const deferAuthClient = vi.fn()
vi.mock('../../../../src/runtime/better-auth/vue/auth-client-loader', () => ({
  deferAuthClient: () => deferAuthClient(),
}))

const createScopedConvexAuthState = vi.fn(() => ({
  state: { fake: 'auth-state' },
  scope: { stop: vi.fn() },
}))
vi.mock('../../../../src/runtime/vue/auth/index', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../../src/runtime/vue/auth/index')>()
  return {
    ...actual,
    createScopedConvexAuthState: (...args: unknown[]) => createScopedConvexAuthState(...args as []),
  }
})

const { ConvexVueClient, ConvexClientKey } = await import('../../../../src/runtime/vue/client')
const { ConvexAuthStateKey } = await import('../../../../src/runtime/vue/auth/index')
const pluginMod = await import('../../../../src/runtime/better-auth/vue/plugin.client')
const runPlugin = pluginMod.default as unknown as (app: {
  vueApp: { provide: (key: unknown, value: unknown) => void }
  hook?: (name: string, fn: () => void) => void
}) => Promise<void>

function fakeNuxtApp() {
  const provided = new Map<unknown, unknown>()
  const hooks = new Map<string, () => void>()
  return {
    provided,
    hooks,
    app: {
      vueApp: { provide: (k: unknown, v: unknown) => provided.set(k, v) },
      hook: (name: string, fn: () => void) => hooks.set(name, fn),
    },
  }
}

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
  noSessionState.value = false
  runtimeConfig.public.convex.url = 'https://example.convex.cloud'
  runtimeConfig.public.convex.crossDomainCallbackRoute = ''
})

describe('better-auth client plugin', () => {
  it('provides the client and scoped auth state, consuming the cross-domain token first', async () => {
    const { provided, app } = fakeNuxtApp()
    const result = await runPlugin(app)

    expect(provided.get(ConvexClientKey)).toBeInstanceOf(ConvexVueClient)
    expect(provided.get(ConvexAuthStateKey)).toEqual({ fake: 'auth-state' })
    // The client is reached through `useConvex()` only — nothing on `$convex`.
    expect(result).toBeUndefined()

    expect(consumeCrossDomainOneTimeToken).toHaveBeenCalledTimes(1)
    // Unset in runtime config → no route restriction (upstream parity).
    expect(consumeCrossDomainOneTimeToken).toHaveBeenCalledWith({ callbackRoute: undefined })
    expect(consumeCrossDomainOneTimeToken.mock.invocationCallOrder[0]!)
      .toBeLessThan(createScopedConvexAuthState.mock.invocationCallOrder[0]!)
  })

  it('forwards the configured cross-domain callback route to the token consumer', async () => {
    runtimeConfig.public.convex.crossDomainCallbackRoute = '/auth/callback'
    const { app } = fakeNuxtApp()

    await runPlugin(app)

    expect(consumeCrossDomainOneTimeToken).toHaveBeenCalledWith({ callbackRoute: '/auth/callback' })
  })

  it('warns and provides nothing when no Convex URL is configured', async () => {
    runtimeConfig.public.convex.url = ''
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { provided, app } = fakeNuxtApp()

    const result = await runPlugin(app)

    expect(result).toBeUndefined()
    expect(provided.size).toBe(0)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('NUXT_PUBLIC_CONVEX_URL'))
    warn.mockRestore()
  })
})

// PARITY: D-18
describe('better-auth client plugin, with no session on the request', () => {
  /** A storage holding `stored`. */
  function storage(stored: Record<string, string>) {
    const keys = Object.keys(stored)
    return {
      get length() {
        return keys.length
      },
      key: (index: number) => keys[index] ?? null,
      getItem: (key: string) => stored[key] ?? null,
    }
  }

  /** A browser at `href` whose local storage holds `stored` (and session storage `session`). */
  function browser(href: string, stored: Record<string, string> = {}, session: Record<string, string> = {}) {
    vi.stubGlobal('window', { location: { href } })
    vi.stubGlobal('localStorage', storage(stored))
    vi.stubGlobal('sessionStorage', storage(session))
  }

  it('holds the client back, and settles the session once the page has hydrated', async () => {
    noSessionState.value = true
    browser('https://app.example/')
    const { app, hooks } = fakeNuxtApp()

    await runPlugin(app)

    expect(deferAuthClient).toHaveBeenCalledTimes(1)
    expect(settleSessionWithoutClient).not.toHaveBeenCalled()
    hooks.get('app:suspense:resolve')?.()
    expect(settleSessionWithoutClient).toHaveBeenCalledTimes(1)
  })

  it('loads it at startup for a one-time token, which needs it now', async () => {
    noSessionState.value = true
    browser('https://app.example/auth/callback?ott=token')
    const { app, hooks } = fakeNuxtApp()

    await runPlugin(app)

    expect(deferAuthClient).not.toHaveBeenCalled()
    expect(hooks.has('app:suspense:resolve')).toBe(false)
  })

  it('loads it at startup for a session the cross-domain plugin saved in storage', async () => {
    noSessionState.value = true
    browser('https://app.example/', { 'better-auth_cookie': '{"better-auth.session_token":{"value":"abc"}}' })
    const { app } = fakeNuxtApp()

    await runPlugin(app)

    expect(deferAuthClient).not.toHaveBeenCalled()
  })

  it('loads it at startup for a cross-domain session kept in sessionStorage', async () => {
    noSessionState.value = true
    browser('https://app.example/', {}, { 'my-app_cookie': '{"my-app.session_token":{"value":"abc"}}' })
    const { app } = fakeNuxtApp()

    await runPlugin(app)

    expect(deferAuthClient).not.toHaveBeenCalled()
  })

  it('loads it at startup when the server could not tell', async () => {
    browser('https://app.example/')
    const { app } = fakeNuxtApp()

    await runPlugin(app)

    expect(deferAuthClient).not.toHaveBeenCalled()
  })
})
