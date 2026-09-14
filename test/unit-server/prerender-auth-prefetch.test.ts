import { describe, expect, it, vi } from 'vitest'

// `nuxt generate` renders every route through the server plugin. There is no
// visitor and no cookie, so the Better Auth token prefetch would be one network
// round-trip per page — and one "Failed to prefetch" warning per page when the
// site URL is unset. Under `import.meta.prerender` the plugin must not call it.

const convexAuth = vi.fn()
vi.mock('../../src/runtime/better-auth/nuxt/server', () => ({ convexAuth }))

const state = { value: null as string | null }
vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: { setup: unknown }) => plugin.setup,
  useRuntimeConfig: () => ({ public: { convex: { url: 'https://example.convex.cloud' } } }),
  useState: () => state,
  useRequestEvent: () => ({ node: { res: { setHeader: vi.fn() } } }),
}))

const setup = (await import('../../src/runtime/better-auth/vue/plugin.server')).default as unknown as
  (nuxtApp: { vueApp: { provide: (key: unknown, value: unknown) => void } }) => Promise<unknown>

describe('better-auth server plugin while prerendering', () => {
  it('provides the client and the auth stub but never prefetches a token', async () => {
    const provide = vi.fn()
    await setup({ vueApp: { provide } })
    expect(provide).toHaveBeenCalledTimes(2)
    expect(convexAuth).not.toHaveBeenCalled()
    expect(state.value).toBeNull()
  })
})
