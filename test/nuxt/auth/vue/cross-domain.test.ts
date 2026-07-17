// This suite exercises a pure browser-side helper (it mocks its only
// dependency and touches only `window`/`URL`), so it runs in a plain happy-dom
// environment rather than the full `nuxt` one. That avoids Nuxt's app entry
// trying — and failing — to auto-mount onto `#__nuxt`, which otherwise emits a
// benign "[Vue warn]: Failed to mount app" line into the test output.
// @vitest-environment happy-dom
// @vitest-environment-options { "url": "https://nuxt-convex-module.localhost/" }
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockGetSession, mockUpdateSession, mockVerify, mockAuthClient } = vi.hoisted(() => {
  const mockGetSession = vi.fn()
  const mockUpdateSession = vi.fn()
  const mockVerify = vi.fn()
  return {
    mockGetSession,
    mockUpdateSession,
    mockVerify,
    // Mutable so tests can uninstall `crossDomain` (the plugin is optional on
    // the aliased client); `beforeEach` restores it.
    mockAuthClient: {
      getSession: mockGetSession,
      // `updateSession` is a top-level action of the cross-domain client plugin
      // (matches `convex/react`'s `authClientWithCrossDomain.updateSession()`).
      updateSession: mockUpdateSession,
      crossDomain: {
        oneTimeToken: {
          verify: mockVerify,
        },
      } as { oneTimeToken: { verify: typeof mockVerify } } | undefined,
    },
  }
})

vi.mock('#convex/auth-client', () => ({
  authClient: mockAuthClient,
}))

async function loadModule() {
  return import('../../../../src/runtime/better-auth/vue/cross-domain')
}

describe('auth/vue/cross-domain', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthClient.crossDomain = { oneTimeToken: { verify: mockVerify } }
    window.history.replaceState({}, '', 'https://nuxt-convex-module.localhost/profile')
  })

  it('exchanges the cross-domain one-time token and refreshes the auth session', async () => {
    const { consumeCrossDomainOneTimeToken } = await loadModule()
    mockVerify.mockResolvedValue({
      data: {
        session: {
          token: 'session-token',
        },
      },
    })
    window.history.replaceState({}, '', 'https://nuxt-convex-module.localhost/profile?ott=one-time-token&next=%2Fdashboard')

    await consumeCrossDomainOneTimeToken()

    expect(mockVerify).toHaveBeenCalledWith({ token: 'one-time-token' })
    expect(mockGetSession).toHaveBeenCalledWith({
      fetchOptions: {
        headers: {
          Authorization: 'Bearer session-token',
        },
      },
    })
    expect(mockUpdateSession).toHaveBeenCalledTimes(1)
    expect(new URL(window.location.href).searchParams.get('ott')).toBeNull()
    expect(new URL(window.location.href).searchParams.get('next')).toBe('/dashboard')
  })

  it('no-ops when the OTT exchange does not return a session token', async () => {
    const { consumeCrossDomainOneTimeToken } = await loadModule()
    mockVerify.mockResolvedValue({ data: { session: null } })
    window.history.replaceState({}, '', 'https://nuxt-convex-module.localhost/profile?ott=missing-token')

    await consumeCrossDomainOneTimeToken()

    expect(mockVerify).toHaveBeenCalledWith({ token: 'missing-token' })
    expect(mockGetSession).not.toHaveBeenCalled()
    expect(mockUpdateSession).not.toHaveBeenCalled()
    expect(new URL(window.location.href).searchParams.get('ott')).toBeNull()
  })

  it('returns early when the cross-domain plugin is not installed on the auth client', async () => {
    const { consumeCrossDomainOneTimeToken } = await loadModule()
    mockAuthClient.crossDomain = undefined
    window.history.replaceState({}, '', 'https://nuxt-convex-module.localhost/profile?ott=orphan-token')

    await consumeCrossDomainOneTimeToken()

    expect(mockVerify).not.toHaveBeenCalled()
    expect(mockGetSession).not.toHaveBeenCalled()
    expect(mockUpdateSession).not.toHaveBeenCalled()
    // The token is still scrubbed from the URL before the plugin guard runs.
    expect(new URL(window.location.href).searchParams.get('ott')).toBeNull()
  })

  it('consumes the token on the configured callback route, ignoring trailing slashes', async () => {
    const { consumeCrossDomainOneTimeToken } = await loadModule()
    mockVerify.mockResolvedValue({ data: { session: { token: 'session-token' } } })
    window.history.replaceState({}, '', 'https://nuxt-convex-module.localhost/auth/callback/?ott=one-time-token')

    await consumeCrossDomainOneTimeToken({ callbackRoute: '/auth/callback' })

    expect(mockVerify).toHaveBeenCalledWith({ token: 'one-time-token' })
    expect(mockUpdateSession).toHaveBeenCalledTimes(1)
    expect(new URL(window.location.href).searchParams.get('ott')).toBeNull()
  })

  it('scrubs but does not exchange the token outside the configured callback route (login-CSRF guard)', async () => {
    const { consumeCrossDomainOneTimeToken } = await loadModule()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    window.history.replaceState({}, '', 'https://nuxt-convex-module.localhost/profile?ott=attacker-token')

    await consumeCrossDomainOneTimeToken({ callbackRoute: '/auth/callback' })

    expect(mockVerify).not.toHaveBeenCalled()
    expect(mockGetSession).not.toHaveBeenCalled()
    expect(mockUpdateSession).not.toHaveBeenCalled()
    // Still scrubbed so the ignored token never lingers in history/referrers.
    expect(new URL(window.location.href).searchParams.get('ott')).toBeNull()
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('restricted to "/auth/callback"'))
    warnSpy.mockRestore()
  })

  it('warns instead of throwing when the OTT exchange fails, so app bootstrap survives', async () => {
    const { consumeCrossDomainOneTimeToken } = await loadModule()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const failure = new Error('verify failed')
    mockVerify.mockRejectedValue(failure)
    window.history.replaceState({}, '', 'https://nuxt-convex-module.localhost/profile?ott=bad-token')

    await expect(consumeCrossDomainOneTimeToken()).resolves.toBeUndefined()

    expect(mockVerify).toHaveBeenCalledWith({ token: 'bad-token' })
    expect(warnSpy).toHaveBeenCalledWith(
      '[nuxt-convex-module] failed to consume cross-domain one-time token',
      failure,
    )
    expect(mockGetSession).not.toHaveBeenCalled()
    expect(mockUpdateSession).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
