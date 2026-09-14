import { describe, expect, it, vi } from 'vitest'

// The ordinary SSR request: a visitor, so the Better Auth server plugin
// prefetches the Convex JWT into the initial-token state the client plugin
// reads. The prerender flavour, where it must NOT, lives in
// test/unit-server/prerender-auth-prefetch.test.ts — `import.meta.prerender`
// is compile-time, and only that project compiles it truthy.

const getToken = vi.fn(async () => 'jwt')
const convexAuth = vi.fn(() => ({ getToken }))
vi.mock('../../../../src/runtime/better-auth/nuxt/server', () => ({ convexAuth }))

const state = { value: null as string | null }
const setHeader = vi.fn()
const event = { node: { res: { setHeader } } }
vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: { setup: unknown }) => plugin.setup,
  useRuntimeConfig: () => ({ public: { convex: { url: 'https://example.convex.cloud' } } }),
  useState: () => state,
  useRequestEvent: () => event,
}))
vi.mock('h3', () => ({ setResponseHeader: (_event: unknown, name: string, value: string) => setHeader(name, value) }))

const setup = (await import('../../../../src/runtime/better-auth/vue/plugin.server')).default as unknown as
  (nuxtApp: { vueApp: { provide: (key: unknown, value: unknown) => void } }) => Promise<unknown>

describe('better-auth server plugin on an ordinary SSR request', () => {
  it('provides the client and the auth stub, prefetches the token and forbids caching the response', async () => {
    const provide = vi.fn()
    await setup({ vueApp: { provide } })
    expect(provide).toHaveBeenCalledTimes(2)
    expect(convexAuth).toHaveBeenCalledWith(event)
    expect(state.value).toBe('jwt')
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
  })
})
