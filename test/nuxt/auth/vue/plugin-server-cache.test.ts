import { beforeEach, describe, expect, it, vi } from 'vitest'

// `prefetchAuthToken` writes the SSR-prefetched Convex JWT into the Nuxt
// payload, so it must also stamp `Cache-Control: private, no-store` on the
// response to keep that per-user secret out of shared/browser caches. This
// suite exercises exactly that header contract. It runs in the `nuxt`
// environment (the default for test/nuxt) because the module under test
// imports `#app`.

const { mockGetToken } = vi.hoisted(() => ({
  mockGetToken: vi.fn(),
}))

vi.mock('../../../../src/runtime/better-auth/nuxt/server', () => ({
  backendAuth: () => ({ getToken: mockGetToken }),
}))

async function loadPrefetch() {
  const mod = await import('../../../../src/runtime/better-auth/vue/plugin.server')
  return mod.prefetchAuthToken
}

function fakeEvent() {
  const setHeader = vi.fn()
  return { event: { node: { res: { setHeader } } } as never, setHeader }
}

describe('auth/vue/plugin.server prefetchAuthToken', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stashes the token and forbids caching when authenticated', async () => {
    const prefetchAuthToken = await loadPrefetch()
    mockGetToken.mockResolvedValue('jwt-1')
    const { event, setHeader } = fakeEvent()
    const initialToken = { value: null as string | null } as never

    await prefetchAuthToken(event, initialToken)

    expect((initialToken as { value: string | null }).value).toBe('jwt-1')
    expect(setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
  })

  it('leaves caching untouched for an anonymous request', async () => {
    const prefetchAuthToken = await loadPrefetch()
    mockGetToken.mockResolvedValue(null)
    const { event, setHeader } = fakeEvent()
    const initialToken = { value: null as string | null } as never

    await prefetchAuthToken(event, initialToken)

    expect((initialToken as { value: string | null }).value).toBeNull()
    expect(setHeader).not.toHaveBeenCalled()
  })

  it('never sets the header (and never throws) when the token fetch fails', async () => {
    const prefetchAuthToken = await loadPrefetch()
    mockGetToken.mockRejectedValue(new Error('boom'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { event, setHeader } = fakeEvent()
    const initialToken = { value: null as string | null } as never

    await expect(prefetchAuthToken(event, initialToken)).resolves.toBeUndefined()

    expect((initialToken as { value: string | null }).value).toBeNull()
    expect(setHeader).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalled()
    warn.mockRestore()
  })
})
