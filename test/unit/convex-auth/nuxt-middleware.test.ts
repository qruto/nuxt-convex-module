// PARITY: A-12
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'

// The `convex-auth` route middleware for Convex Auth's cookie sessions, in the
// browser (`import.meta.server` is undefined in this project). The server half
// is in test/unit-server/convex-auth-middleware.test.ts.

const { navigateTo, useNuxtApp, useRuntimeConfig, useAuth } = vi.hoisted(() => ({
  navigateTo: vi.fn((to: unknown) => ({ redirectedTo: to })),
  useNuxtApp: vi.fn(),
  useRuntimeConfig: vi.fn(),
  useAuth: vi.fn(),
}))

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  navigateTo,
  useNuxtApp,
  useRequestEvent: () => undefined,
  useRuntimeConfig,
}))
vi.mock('../../../src/runtime/convex-auth/vue/client', () => ({ useAuth }))

const middleware = (await import('../../../src/runtime/convex-auth/nuxt/middleware')).default as unknown as
  (to: { path: string, fullPath: string }) => Promise<unknown>
const guest = (await import('../../../src/runtime/convex-auth/nuxt/guest-middleware')).default as unknown as
  (to: { path: string, fullPath: string, query: Record<string, unknown> }) => Promise<unknown>

const route = (path: string) => ({ path: path.split('?')[0]!, fullPath: path })
const login = (redirect: string) => ({ redirectedTo: { path: '/login', query: { redirect } } })

function app({ hydrating = false, serverRendered = false } = {}) {
  useNuxtApp.mockReturnValue({ isHydrating: hydrating, payload: { serverRendered }, runWithContext: (fn: () => unknown) => fn() })
}
function auth(state: { isLoading: boolean, isAuthenticated: boolean }) {
  const isLoading = ref(state.isLoading)
  const isAuthenticated = ref(state.isAuthenticated)
  useAuth.mockReturnValue({ isLoading: () => isLoading.value, isAuthenticated: () => isAuthenticated.value })
  return { isLoading, isAuthenticated }
}

beforeEach(() => {
  vi.clearAllMocks()
  useRuntimeConfig.mockReturnValue({ public: { convex: { loginPath: '/login' } } })
  app()
})

describe('convex-auth route middleware, in the browser', () => {
  it('lets a signed-in visitor through', async () => {
    auth({ isLoading: false, isAuthenticated: true })
    expect(await middleware(route('/dashboard'))).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('sends a signed-out visitor to the login page, with the page they asked for', async () => {
    auth({ isLoading: false, isAuthenticated: false })
    expect(await middleware(route('/dashboard?tab=2'))).toEqual(login('/dashboard?tab=2'))
  })

  it('waits for the session before deciding', async () => {
    const state = auth({ isLoading: true, isAuthenticated: false })
    let settled = false
    const result = middleware(route('/dashboard')).then((value) => {
      settled = true
      return value
    })
    await nextTick()
    expect(settled).toBe(false)

    state.isAuthenticated.value = true
    state.isLoading.value = false
    expect(await result).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  // The server ran the same guard for this render, and the session is not
  // loaded until the page has hydrated: waiting here would never end.
  it('leaves the page the server rendered to the server\'s answer', async () => {
    app({ hydrating: true, serverRendered: true })
    auth({ isLoading: true, isAuthenticated: false })
    expect(await middleware(route('/dashboard'))).toBeUndefined()
    expect(useAuth).not.toHaveBeenCalled()
  })

  it('never redirects the login page to itself', async () => {
    auth({ isLoading: false, isAuthenticated: false })
    expect(await middleware(route('/login'))).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('reads the login path from the runtime config', async () => {
    useRuntimeConfig.mockReturnValue({ public: { convex: { loginPath: '/sign-in' } } })
    auth({ isLoading: false, isAuthenticated: false })
    expect(await middleware(route('/dashboard'))).toEqual({ redirectedTo: { path: '/sign-in', query: { redirect: '/dashboard' } } })
    expect(await middleware(route('/sign-in'))).toBeUndefined()
  })
})

// Upstream's proxy handler redirects with `nextjsProxyRedirect`, as in its
// example that sends a signed-in visitor away from the sign-in page.
describe('convex-auth-guest route middleware, in the browser', () => {
  const page = (path: string, query: Record<string, unknown> = {}) => ({ ...route(path), query })

  it('lets a signed-out visitor through', async () => {
    auth({ isLoading: false, isAuthenticated: false })
    expect(await guest(page('/login'))).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('sends a signed-in visitor to the page in ?redirect=, or home', async () => {
    auth({ isLoading: false, isAuthenticated: true })
    expect(await guest(page('/login', { redirect: '/dashboard?tab=2' }))).toEqual({ redirectedTo: '/dashboard?tab=2' })
    expect(await guest(page('/login'))).toEqual({ redirectedTo: '/' })
  })

  it('stays on a guest-only page that is its own destination', async () => {
    auth({ isLoading: false, isAuthenticated: true })
    expect(await guest(page('/'))).toBeUndefined()
    expect(navigateTo).not.toHaveBeenCalled()
  })

  it('never follows ?redirect= off the site', async () => {
    auth({ isLoading: false, isAuthenticated: true })
    expect(await guest(page('/login', { redirect: '//evil.example' }))).toEqual({ redirectedTo: '/' })
  })

  it('waits for the session before deciding', async () => {
    const state = auth({ isLoading: true, isAuthenticated: false })
    const result = guest(page('/login'))
    await nextTick()
    state.isAuthenticated.value = true
    state.isLoading.value = false
    expect(await result).toEqual({ redirectedTo: '/' })
  })

  it('leaves the page the server rendered to the server\'s answer', async () => {
    app({ hydrating: true, serverRendered: true })
    auth({ isLoading: false, isAuthenticated: true })
    expect(await guest(page('/login'))).toBeUndefined()
  })
})
