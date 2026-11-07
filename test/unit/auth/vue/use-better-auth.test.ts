// PARITY: A-06
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

const sessionRef = ref<{ data: unknown, isPending: boolean }>({
  data: null,
  isPending: true,
})

const tokenMock = vi.fn<
  (opts: { fetchOptions: { throw: boolean } }) => Promise<{ data?: { token?: string | null } | null, error?: { status: number } | null }>
>()

// `useBetterAuth` only consumes the session and the Convex token plugin — auth
// flows (sign-in/out, plugins) live on the exposed `client`, untouched here.
const mockAuthClient = {
  useSession: () => sessionRef,
  get convex() {
    return { token: tokenMock }
  },
}

vi.mock('#convex/auth-client', () => ({
  authClient: mockAuthClient,
}))

async function loadUseAuth() {
  const mod = await import('../../../../src/runtime/better-auth/vue/use-better-auth')
  mod.__resetUseBetterAuthForTests()
  return mod
}

describe('useBetterAuth (Better Auth + Convex)', () => {
  beforeEach(() => {
    sessionRef.value = { data: null, isPending: true }
    tokenMock.mockReset()
  })

  it('reads authVersion as unknown until the session settles', async () => {
    const { useBetterAuth } = await loadUseAuth()
    const { authVersion } = useBetterAuth()
    expect(authVersion.value).toBeUndefined()

    sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: '1' } }, isPending: false }
    expect(authVersion.value).toBe('session-1')

    sessionRef.value = { data: null, isPending: false }
    expect(authVersion.value).toBeNull()
  })

  it('exposes the Better Auth client and session from one service', async () => {
    const { useBetterAuth } = await loadUseAuth()

    const auth = useBetterAuth()

    expect(auth.client).toBe(mockAuthClient)
    expect(auth.session).toBe(sessionRef)
  })

  it('caches tokens across calls and dedups concurrent fetches', async () => {
    const { useBetterAuth } = await loadUseAuth()
    tokenMock.mockResolvedValue({ data: { token: 'jwt-1' } })

    const { fetchAccessToken, isAuthenticated } = useBetterAuth()

    const [a, b] = await Promise.all([
      fetchAccessToken({ forceRefreshToken: false }),
      fetchAccessToken({ forceRefreshToken: false }),
    ])
    expect(a).toBe('jwt-1')
    expect(b).toBe('jwt-1')
    expect(tokenMock).toHaveBeenCalledTimes(1)
    expect(isAuthenticated.value).toBe(true)

    await fetchAccessToken({ forceRefreshToken: false })
    expect(tokenMock).toHaveBeenCalledTimes(1)
  })

  it('refetches when forceRefreshToken is true', async () => {
    const { useBetterAuth } = await loadUseAuth()
    tokenMock.mockResolvedValueOnce({ data: { token: 'jwt-1' } })
    tokenMock.mockResolvedValueOnce({ data: { token: 'jwt-2' } })

    const { fetchAccessToken } = useBetterAuth()

    expect(await fetchAccessToken({ forceRefreshToken: false })).toBe('jwt-1')
    expect(await fetchAccessToken({ forceRefreshToken: true })).toBe('jwt-2')
    expect(tokenMock).toHaveBeenCalledTimes(2)
  })

  it('returns null and resets cache when the token fetch fails', async () => {
    const { useBetterAuth } = await loadUseAuth()
    tokenMock.mockRejectedValue(new Error('boom'))

    const { fetchAccessToken, isAuthenticated } = useBetterAuth()
    expect(await fetchAccessToken({ forceRefreshToken: false })).toBeNull()
    expect(isAuthenticated.value).toBe(false)
  })

  // PARITY: D-16
  it('keeps the token when a refresh fails with the session still standing', async () => {
    const { useBetterAuth } = await loadUseAuth()
    sessionRef.value = { data: { session: { id: 'session-1' } }, isPending: false }
    const { fetchAccessToken } = useBetterAuth()
    tokenMock.mockResolvedValueOnce({ data: { token: 'token-a' } })
    await fetchAccessToken({ forceRefreshToken: false })

    tokenMock.mockResolvedValueOnce({ data: null, error: { status: 502 } })
    await expect(fetchAccessToken({ forceRefreshToken: true })).resolves.toBe('token-a')

    tokenMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    await expect(fetchAccessToken({ forceRefreshToken: true })).resolves.toBe('token-a')

    tokenMock.mockResolvedValueOnce({ data: { token: 'token-b' } })
    await expect(fetchAccessToken({ forceRefreshToken: true })).resolves.toBe('token-b')
  })

  it('keeps a seeded server token through a failed refresh once the session settles', async () => {
    const { useBetterAuth } = await loadUseAuth()
    const { fetchAccessToken } = useBetterAuth('server-token')
    sessionRef.value = { data: { session: { id: 'session-1' } }, isPending: false }

    tokenMock.mockResolvedValueOnce({ data: null, error: { status: 503 } })
    await expect(fetchAccessToken({ forceRefreshToken: true })).resolves.toBe('server-token')
  })

  it('drops the token when the server says the session is gone', async () => {
    const { useBetterAuth } = await loadUseAuth()
    sessionRef.value = { data: { session: { id: 'session-1' } }, isPending: false }
    const { fetchAccessToken } = useBetterAuth()
    tokenMock.mockResolvedValueOnce({ data: { token: 'token-a' } })
    await fetchAccessToken({ forceRefreshToken: false })

    tokenMock.mockResolvedValueOnce({ data: null, error: { status: 401 } })
    await expect(fetchAccessToken({ forceRefreshToken: true })).resolves.toBeNull()
  })

  it('never answers a failed refresh with another session\'s token', async () => {
    const { useBetterAuth } = await loadUseAuth()
    sessionRef.value = { data: { session: { id: 'session-1' } }, isPending: false }
    const { fetchAccessToken } = useBetterAuth()
    tokenMock.mockResolvedValueOnce({ data: { token: 'token-a' } })
    await fetchAccessToken({ forceRefreshToken: false })

    sessionRef.value = { data: { session: { id: 'session-2' } }, isPending: false }
    tokenMock.mockResolvedValueOnce({ data: null, error: { status: 502 } })
    await expect(fetchAccessToken({ forceRefreshToken: true })).resolves.toBeNull()
  })

  it('reflects session state for isAuthenticated / isLoading', async () => {
    const { useBetterAuth } = await loadUseAuth()
    sessionRef.value = { data: { user: { id: '1' } }, isPending: false }

    const { isAuthenticated, isLoading } = useBetterAuth()
    expect(isAuthenticated.value).toBe(true)
    expect(isLoading.value).toBe(false)

    sessionRef.value = { data: null, isPending: true }
    expect(isAuthenticated.value).toBe(false)
    expect(isLoading.value).toBe(true)
  })

  it('accepts an initialToken and uses it exactly once across the app lifetime', async () => {
    const { useBetterAuth } = await loadUseAuth()

    const first = useBetterAuth('preloaded-token')
    expect(first.isAuthenticated.value).toBe(true)
    expect(await first.fetchAccessToken({ forceRefreshToken: false })).toBe('preloaded-token')
    expect(tokenMock).not.toHaveBeenCalled()

    tokenMock.mockResolvedValue({ data: { token: 'fresh' } })
    const second = useBetterAuth('ignored')
    expect(await second.fetchAccessToken({ forceRefreshToken: true })).toBe('fresh')
  })

  it('treats a settled missing session as unauthenticated even with a stale cached token', async () => {
    const { useBetterAuth } = await loadUseAuth()
    sessionRef.value = {
      data: { session: { id: 'session-1' }, user: { id: 'user-1' } },
      isPending: false,
    }
    tokenMock.mockResolvedValue({ data: { token: 'jwt-1' } })

    const { fetchAccessToken, isAuthenticated } = useBetterAuth()

    expect(await fetchAccessToken({ forceRefreshToken: false })).toBe('jwt-1')
    expect(isAuthenticated.value).toBe(true)

    sessionRef.value = { data: null, isPending: false }
    await nextTick()

    expect(isAuthenticated.value).toBe(false)
    expect(await fetchAccessToken({ forceRefreshToken: false })).toBeNull()
    expect(tokenMock).toHaveBeenCalledTimes(1)
  })

  it('reads loading while a token from before the session belongs to another user', async () => {
    const { useBetterAuth } = await loadUseAuth()
    const jwt = (sub: string) => `header.${Buffer.from(JSON.stringify({ sub })).toString('base64url')}.signature`
    const { isLoading, fetchAccessToken } = useBetterAuth(jwt('user-1'))
    expect(isLoading.value).toBe(false)

    sessionRef.value = { data: { session: { id: 'session-2' }, user: { id: 'user-2' } }, isPending: false }
    expect(isLoading.value).toBe(true)

    tokenMock.mockResolvedValue({ data: { token: jwt('user-2') } })
    await expect(fetchAccessToken({ forceRefreshToken: false })).resolves.toBe(jwt('user-2'))
    expect(isLoading.value).toBe(false)
  })

  it('reads the settled session as loaded when the token is that user\'s or unreadable', async () => {
    const { useBetterAuth } = await loadUseAuth()
    const jwt = `header.${Buffer.from(JSON.stringify({ sub: 'user-1' })).toString('base64url')}.signature`
    const { isLoading } = useBetterAuth(jwt)

    sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: 'user-1' } }, isPending: false }
    expect(isLoading.value).toBe(false)

    const { useBetterAuth: again } = await loadUseAuth()
    sessionRef.value = { data: null, isPending: true }
    const opaque = again('opaque-token')
    sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: 'user-1' } }, isPending: false }
    expect(opaque.isLoading.value).toBe(false)
  })

  it('stops reading loading when the fetch brings the same token under a custom subject', async () => {
    const { useBetterAuth } = await loadUseAuth()
    const jwt = `header.${Buffer.from(JSON.stringify({ sub: 'custom-subject' })).toString('base64url')}.signature`
    const { isLoading, fetchAccessToken } = useBetterAuth(jwt)

    sessionRef.value = { data: { session: { id: 'session-1' }, user: { id: 'user-1' } }, isPending: false }
    expect(isLoading.value).toBe(true)

    tokenMock.mockResolvedValue({ data: { token: jwt } })
    await fetchAccessToken({ forceRefreshToken: false })
    expect(isLoading.value).toBe(false)
  })

  it('never answers a failed refresh with a page token that belongs to another user', async () => {
    const { useBetterAuth } = await loadUseAuth()
    const jwt = `header.${Buffer.from(JSON.stringify({ sub: 'user-1' })).toString('base64url')}.signature`
    const { isLoading, fetchAccessToken } = useBetterAuth(jwt)

    sessionRef.value = { data: { session: { id: 'session-2' }, user: { id: 'user-2' } }, isPending: false }
    tokenMock.mockRejectedValue(new Error('offline'))

    await expect(fetchAccessToken({ forceRefreshToken: true })).resolves.toBeNull()
    expect(isLoading.value).toBe(false)
  })

  it('exposes the session user and returns null when signed out', async () => {
    const { useBetterAuth } = await loadUseAuth()
    const sessionUser = { id: 'user-1', email: 'user@example.com', name: 'User One' }
    sessionRef.value = { data: { user: sessionUser }, isPending: false }

    const { user } = useBetterAuth()
    expect(user.value).toEqual(sessionUser)

    sessionRef.value = { data: null, isPending: false }
    expect(user.value).toBeNull()
  })

  it('invalidates the cached token when the Better Auth session changes', async () => {
    const { useBetterAuth } = await loadUseAuth()
    sessionRef.value = {
      data: { session: { id: 'session-1' }, user: { id: 'user-1' } },
      isPending: false,
    }
    tokenMock.mockResolvedValueOnce({ data: { token: 'jwt-1' } })
    tokenMock.mockResolvedValueOnce({ data: { token: 'jwt-2' } })

    const { fetchAccessToken } = useBetterAuth()

    expect(await fetchAccessToken({ forceRefreshToken: false })).toBe('jwt-1')

    sessionRef.value = {
      data: { session: { id: 'session-2' }, user: { id: 'user-2' } },
      isPending: false,
    }
    await nextTick()

    expect(await fetchAccessToken({ forceRefreshToken: false })).toBe('jwt-2')
    expect(tokenMock).toHaveBeenCalledTimes(2)
  })

  it('subscribes to the session store once for the app, however many calls read it', async () => {
    const { useBetterAuth } = await loadUseAuth()
    const useSession = vi.spyOn(mockAuthClient, 'useSession')

    // Calls outside any component, as a route middleware makes on each navigation.
    const first = useBetterAuth()
    const second = useBetterAuth()

    expect(useSession).toHaveBeenCalledTimes(1)
    expect(second.session).toBe(first.session)
    useSession.mockRestore()
  })
})
