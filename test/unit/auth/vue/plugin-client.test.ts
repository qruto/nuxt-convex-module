import { afterEach, describe, expect, it, vi } from 'vitest'

// Drive the Better Auth client plugin's setup directly with a stubbed `#app`
// (the pattern from base-client-plugin.test.ts): the plugin creates + provides
// the Convex client and the scoped auth state, consuming the cross-domain
// one-time token first.

const runtimeConfig = { public: { convex: { url: 'https://example.convex.cloud', crossDomainCallbackRoute: '' } } }
const initialTokenState = { value: null as string | null }

vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: unknown) =>
    typeof plugin === 'function' ? plugin : (plugin as { setup: unknown }).setup,
  useRuntimeConfig: () => runtimeConfig,
  useState: (_key: string, init?: () => unknown) => {
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

const useAuth = vi.fn()
vi.mock('../../../../src/runtime/better-auth/vue/use-auth', () => ({
  useAuth: (...args: unknown[]) => useAuth(...args),
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
}) => Promise<{ provide: Record<string, unknown> }>

function fakeNuxtApp() {
  const provided = new Map<unknown, unknown>()
  return {
    provided,
    app: { vueApp: { provide: (k: unknown, v: unknown) => provided.set(k, v) } },
  }
}

afterEach(() => {
  vi.clearAllMocks()
  runtimeConfig.public.convex.url = 'https://example.convex.cloud'
  runtimeConfig.public.convex.crossDomainCallbackRoute = ''
})

describe('better-auth client plugin', () => {
  it('provides the client and scoped auth state, consuming the cross-domain token first', async () => {
    const { provided, app } = fakeNuxtApp()
    const result = await runPlugin(app)

    expect(provided.get(ConvexClientKey)).toBeInstanceOf(ConvexVueClient)
    expect(provided.get(ConvexAuthStateKey)).toEqual({ fake: 'auth-state' })
    expect(result.provide.convex).toBe(provided.get(ConvexClientKey))

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

    expect(result).toEqual({ provide: {} })
    expect(provided.size).toBe(0)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('No Convex URL configured'))
    warn.mockRestore()
  })
})
