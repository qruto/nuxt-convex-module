// PARITY: A-19
import { AUTH_JWT_COOKIE, AUTH_REFRESH_COOKIE } from '@convex-dev/auth/ssr'
import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetNuxtRuntimeConfigForTests, setNuxtRuntimeConfigForTests } from '../../helpers/nuxt-imports'

// The Nuxt layer over `@convex-dev/auth/ssr`: reading the access token in
// server code, the up-front refresh upstream's `proxy.ts` does, and the two
// handler files the module mounts. The session, the cookies and the auth
// checker are the package's own, unmocked. Only the calls to the deployment
// are stubbed.

const auth = {
  convexProxyHandler: vi.fn(async (_request: Request) => new Response('signin')),
  refreshHandler: vi.fn(async (_request: Request) => new Response('refresh')),
  signOutHandler: vi.fn(async (_request: Request) => new Response('signout')),
  convexAuthNuxtProxy: vi.fn(async (_event: unknown) => {}),
}
vi.mock('#convex/auth-server', () => ({ default: auth }))

const { setupConvexAuthNuxt } = await import('../../../src/runtime/convex-auth/nuxt/server')
const handler = (await import('../../../src/runtime/convex-auth/nuxt/handler')).default as (event: unknown) => unknown
const proxy = (await import('../../../src/runtime/convex-auth/nuxt/proxy')).default as (event: unknown) => Promise<void>

const CONFIG = {
  refreshSession: makeFunctionReference<'mutation'>('auth:refreshSession'),
  signOut: makeFunctionReference<'mutation'>('auth:signOut'),
  isAuthenticated: makeFunctionReference<'query'>('auth:isAuthenticated'),
  signIn: [makeFunctionReference<'mutation'>('auth:signInWithUsernamePassword')],
} as unknown as Parameters<typeof setupConvexAuthNuxt>[0]

/** An unsigned JWT that expires `seconds` from now. Only the backend checks a signature. */
function jwt(seconds: number, label = 'a'): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${encode({ alg: 'RS256' })}.${encode({ exp: Math.floor(Date.now() / 1000) + seconds, sub: label })}.signature`
}

/** The `nuxt/server` event: a web Request, a response to write cookies to, a context. */
function event(cookies: Record<string, string> = {}, path = '/') {
  const cookie = Object.entries(cookies).map(([name, value]) => `${name}=${value}`).join('; ')
  return {
    req: new Request(`https://app.test${path}`, { headers: cookie ? { cookie } : {} }),
    res: { headers: new Headers() },
    context: {} as { convexAuth?: { token: string | null, isAuthenticatedFunctionName: string, isAuthenticated: () => Promise<boolean> }, params?: Record<string, string> },
  }
}

beforeEach(() => {
  setNuxtRuntimeConfigForTests({ public: { convex: { url: 'https://happy-animal-123.convex.cloud' } } })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
  resetNuxtRuntimeConfigForTests()
})

describe('convexAuthNuxtAccessToken', () => {
  it('returns the cookie\'s token', async () => {
    const token = jwt(600)
    const { convexAuthNuxtAccessToken } = setupConvexAuthNuxt(CONFIG)
    expect(await convexAuthNuxtAccessToken(event({ [AUTH_JWT_COOKIE]: token }))).toBe(token)
  })

  it('returns null for an expired token, and with no cookie', async () => {
    const { convexAuthNuxtAccessToken } = setupConvexAuthNuxt(CONFIG)
    expect(await convexAuthNuxtAccessToken(event({ [AUTH_JWT_COOKIE]: jwt(-60) }))).toBeNull()
    expect(await convexAuthNuxtAccessToken(event())).toBeNull()
  })
})

describe('convexAuthNuxtProxy', () => {
  it('leaves a fresh session alone', async () => {
    const mutation = vi.spyOn(ConvexHttpClient.prototype, 'mutation')
    const token = jwt(600)
    const request = event({ [AUTH_JWT_COOKIE]: token, [AUTH_REFRESH_COOKIE]: 'refresh-1' })

    await setupConvexAuthNuxt(CONFIG).convexAuthNuxtProxy(request)

    expect(mutation).not.toHaveBeenCalled()
    expect(request.res.headers.get('set-cookie')).toBeNull()
    expect(request.context.convexAuth).toMatchObject({ token, isAuthenticatedFunctionName: 'auth:isAuthenticated' })
  })

  it('refreshes a token close to expiry, rewrites the cookies and hands the new token on', async () => {
    const fresh = jwt(600, 'b')
    const mutation = vi.spyOn(ConvexHttpClient.prototype, 'mutation').mockResolvedValue({
      kind: 'rotated',
      tokens: { accessToken: fresh, refreshToken: 'refresh-2', refreshTokenExpiresAt: Date.now() + 86_400_000, userId: 'user-1' },
    } as never)
    const request = event({ [AUTH_JWT_COOKIE]: jwt(5), [AUTH_REFRESH_COOKIE]: 'refresh-1' })
    const { convexAuthNuxtProxy, convexAuthNuxtAccessToken } = setupConvexAuthNuxt(CONFIG)

    await convexAuthNuxtProxy(request)

    expect(mutation).toHaveBeenCalledWith(CONFIG.refreshSession, { refreshToken: 'refresh-1' })
    const written = request.res.headers.getSetCookie()
    expect(written.find(cookie => cookie.startsWith(`${AUTH_JWT_COOKIE}=${fresh}`))).toBeDefined()
    expect(written.find(cookie => cookie.startsWith(`${AUTH_REFRESH_COOKIE}=refresh-2`))).toBeDefined()
    // The request still carries the old cookie. Server code after the proxy
    // has to see the token the proxy just minted.
    expect(await convexAuthNuxtAccessToken(request)).toBe(fresh)
  })

  it('clears the cookies when the deployment says the session is gone', async () => {
    vi.spyOn(ConvexHttpClient.prototype, 'mutation').mockResolvedValue({ kind: 'noSession' } as never)
    const request = event({ [AUTH_JWT_COOKIE]: jwt(-60), [AUTH_REFRESH_COOKIE]: 'refresh-1' })
    const { convexAuthNuxtProxy, convexAuthNuxtAccessToken } = setupConvexAuthNuxt(CONFIG)

    await convexAuthNuxtProxy(request)

    expect(request.res.headers.getSetCookie().filter(cookie => cookie.includes('Max-Age=0'))).toHaveLength(2)
    expect(request.context.convexAuth?.token).toBeNull()
    expect(await convexAuthNuxtAccessToken(request)).toBeNull()
  })

  it('asks nothing of the deployment for a visitor with no session', async () => {
    const mutation = vi.spyOn(ConvexHttpClient.prototype, 'mutation')
    const request = event()

    await setupConvexAuthNuxt(CONFIG).convexAuthNuxtProxy(request)

    expect(mutation).not.toHaveBeenCalled()
    expect(request.context.convexAuth).toMatchObject({ token: null, isAuthenticatedFunctionName: 'auth:isAuthenticated' })
  })

  // What the `convex-auth` route middleware reads during a render.
  it('leaves the session check on the request, asked of the deployment once', async () => {
    const query = vi.spyOn(ConvexHttpClient.prototype, 'query').mockResolvedValue(true as never)
    const request = event({ [AUTH_JWT_COOKIE]: jwt(600) })
    await setupConvexAuthNuxt(CONFIG).convexAuthNuxtProxy(request)
    expect(query).not.toHaveBeenCalled()

    expect(await request.context.convexAuth!.isAuthenticated()).toBe(true)
    expect(await request.context.convexAuth!.isAuthenticated()).toBe(true)
    expect(query).toHaveBeenCalledTimes(1)
  })

  const refresh = async (cookieOptions?: { secure: boolean }) => {
    vi.spyOn(ConvexHttpClient.prototype, 'mutation').mockResolvedValue({
      kind: 'rotated',
      tokens: { accessToken: jwt(600), refreshToken: 'refresh-2', refreshTokenExpiresAt: Date.now() + 86_400_000, userId: 'user-1' },
    } as never)
    const request = event({ [AUTH_REFRESH_COOKIE]: 'refresh-1' })
    await setupConvexAuthNuxt({ ...CONFIG, cookieOptions }).convexAuthNuxtProxy(request)
    return request.res.headers.getSetCookie()
  }

  it('writes HTTPS-only cookies outside `nuxt dev`', async () => {
    expect((await refresh()).every(cookie => cookie.includes('Secure'))).toBe(true)
  })

  it('lets an explicit `secure` win', async () => {
    expect((await refresh({ secure: false })).some(cookie => cookie.includes('Secure'))).toBe(false)
  })
})

describe('isAuthenticatedNuxt', () => {
  it('asks the deployment, with the cookie\'s token', async () => {
    const setAuth = vi.spyOn(ConvexHttpClient.prototype, 'setAuth')
    const query = vi.spyOn(ConvexHttpClient.prototype, 'query').mockResolvedValue(true as never)
    const token = jwt(600)
    const { isAuthenticatedNuxt } = setupConvexAuthNuxt(CONFIG)

    expect(await isAuthenticatedNuxt(event({ [AUTH_JWT_COOKIE]: token }))).toBe(true)
    expect(setAuth).toHaveBeenCalledWith(token)
    expect(query).toHaveBeenCalledWith(CONFIG.isAuthenticated, {})

    // A cookie the deployment does not accept is not a session.
    query.mockResolvedValue(false as never)
    expect(await isAuthenticatedNuxt(event({ [AUTH_JWT_COOKIE]: token }))).toBe(false)
  })

  it('is false with no token, without asking', async () => {
    const query = vi.spyOn(ConvexHttpClient.prototype, 'query')
    expect(await setupConvexAuthNuxt(CONFIG).isAuthenticatedNuxt(event())).toBe(false)
    expect(query).not.toHaveBeenCalled()
  })
})

describe('the auth routes', () => {
  const post = (action: string) => {
    const request = event({}, `/api/_convex/auth/${action}`)
    request.context.params = { action }
    return request
  }

  it.each([
    ['signin', 'convexProxyHandler'],
    ['refresh', 'refreshHandler'],
    ['signout', 'signOutHandler'],
  ] as const)('%s runs %s with the request', async (action, name) => {
    const request = post(action)
    const response = await handler(request) as Response
    expect(await response.text()).toBe(action)
    expect(auth[name]).toHaveBeenCalledWith(request.req)
  })

  it.each(['nope', 'constructor', ''])('"%s" is a 404', (action) => {
    expect(() => handler(post(action))).toThrow(expect.objectContaining({ status: 404 }))
  })
})

describe('the proxy middleware', () => {
  it('refreshes on a page and on a server route', async () => {
    for (const path of ['/', '/dashboard?tab=1', '/api/me']) await proxy(event({}, path))
    expect(auth.convexAuthNuxtProxy).toHaveBeenCalledTimes(3)
  })

  // The auth routes read and rewrite the refresh cookie themselves. A refresh
  // here first would leave them a token the deployment has already rotated.
  it.each(['signin', 'refresh', 'signout'])('leaves /api/_convex/auth/%s alone', async (action) => {
    await proxy(event({}, `/api/_convex/auth/${action}`))
    expect(auth.convexAuthNuxtProxy).not.toHaveBeenCalled()
  })
})
