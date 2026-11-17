// PARITY: A-12
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The `convex-auth` route middleware for Convex Auth's cookie sessions during
// a server render (`import.meta.server` is true in this project). It decides
// by the check the proxy middleware left on the request.

const { navigateTo, useRequestEvent, useAuth } = vi.hoisted(() => ({
  navigateTo: vi.fn((to: unknown) => ({ redirectedTo: to })),
  useRequestEvent: vi.fn(),
  useAuth: vi.fn(),
}))

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  navigateTo,
  useNuxtApp: () => ({ runWithContext: (fn: () => unknown) => fn() }),
  useRequestEvent,
  useRuntimeConfig: () => ({ public: { convex: { loginPath: '/login' } } }),
}))
vi.mock('../../src/runtime/convex-auth/vue/client', () => ({ useAuth }))

const middleware = (await import('../../src/runtime/convex-auth/nuxt/middleware')).default as unknown as
  (to: { path: string, fullPath: string }) => Promise<unknown>

const guest = (await import('../../src/runtime/convex-auth/nuxt/guest-middleware')).default as unknown as
  (to: { path: string, fullPath: string, query: Record<string, unknown> }) => Promise<unknown>

const route = (path: string) => ({ path, fullPath: path })
const session = (authed: boolean) => {
  const isAuthenticated = vi.fn(async () => authed)
  useRequestEvent.mockReturnValue({ context: { convexAuth: { token: authed ? 'jwt' : null, isAuthenticatedFunctionName: 'auth:isAuthenticated', isAuthenticated } } })
  return isAuthenticated
}

beforeEach(() => vi.clearAllMocks())

describe('convex-auth route middleware, during a server render', () => {
  it('renders the page for a session the deployment accepts', async () => {
    const isAuthenticated = session(true)
    expect(await middleware(route('/dashboard'))).toBeUndefined()
    expect(isAuthenticated).toHaveBeenCalledTimes(1)
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('redirects a visitor with no session, or one the deployment rejects', async () => {
    session(false)
    expect(await middleware(route('/dashboard'))).toEqual({ redirectedTo: { path: '/login', query: { redirect: '/dashboard' } } })
  })

  // Fails closed: without the proxy's check there is nothing to trust.
  it.each([
    ['no request event', undefined],
    ['a request the proxy did not run for', { context: {} }],
  ])('redirects with %s', async (_case, event) => {
    useRequestEvent.mockReturnValue(event)
    expect(await middleware(route('/dashboard'))).toEqual({ redirectedTo: { path: '/login', query: { redirect: '/dashboard' } } })
  })

  it('never redirects the login page to itself', async () => {
    session(false)
    expect(await middleware(route('/login'))).toBeUndefined()
  })

  it('does not read the browser\'s auth state', async () => {
    session(true)
    await middleware(route('/dashboard'))
    expect(useAuth).not.toHaveBeenCalled()
  })
})

describe('convex-auth-guest route middleware, during a server render', () => {
  it('sends a session the deployment accepts to the page in ?redirect=', async () => {
    session(true)
    expect(await guest({ ...route('/login'), query: { redirect: '/dashboard' } })).toEqual({ redirectedTo: '/dashboard' })
  })

  it('renders the page for a visitor with no session, or with no proxy check', async () => {
    session(false)
    expect(await guest({ ...route('/login'), query: {} })).toBeUndefined()
    useRequestEvent.mockReturnValue(undefined)
    expect(await guest({ ...route('/login'), query: {} })).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })
})
