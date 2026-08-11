import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const {
  mockNavigateTo,
  mockUseRequestEvent,
  mockUseNuxtApp,
  mockUseRuntimeConfig,
  mockIsAuthenticated,
  mockUseAuth,
} = vi.hoisted(() => ({
  mockNavigateTo: vi.fn((to: unknown) => ({ redirectedTo: to })),
  mockUseRequestEvent: vi.fn(),
  mockUseNuxtApp: vi.fn(() => ({ runWithContext: (fn: () => unknown) => fn() })),
  mockUseRuntimeConfig: vi.fn(() => ({ public: { convex: { loginPath: '/login' } } })),
  mockIsAuthenticated: vi.fn(),
  mockUseAuth: vi.fn(),
}))

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  navigateTo: mockNavigateTo,
  useNuxtApp: mockUseNuxtApp,
  useRequestEvent: mockUseRequestEvent,
  useRuntimeConfig: mockUseRuntimeConfig,
}))

vi.mock('../../../../src/runtime/better-auth/vue/use-auth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('../../../../src/runtime/better-auth/nuxt/server', () => ({
  convexAuth: vi.fn(() => ({ isAuthenticated: mockIsAuthenticated })),
}))

type RouteMiddleware = (to: { path: string, fullPath: string }) => Promise<unknown>

function route(path: string) {
  return { path, fullPath: path }
}

async function loadMiddleware() {
  const mod = await import('../../../../src/runtime/better-auth/nuxt/middleware')
  return { middleware: mod.default as RouteMiddleware, serverGuard: mod.serverGuard }
}

describe('auth route middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseNuxtApp.mockReturnValue({ runWithContext: (fn: () => unknown) => fn() })
    mockUseRuntimeConfig.mockReturnValue({ public: { convex: { loginPath: '/login' } } })
  })

  // `import.meta.server` is compile-time (always false in the unit project),
  // so the server branch is exercised via the exported serverGuard directly.
  describe('server guard', () => {
    beforeEach(() => {
      mockUseRequestEvent.mockReturnValue({ context: {} })
    })

    it('redirects unauthenticated requests to the login path with a redirect query', async () => {
      mockIsAuthenticated.mockResolvedValue(false)
      const { serverGuard } = await loadMiddleware()

      const target = { path: '/login', query: { redirect: '/profile' } }
      await expect(serverGuard(route('/profile'), '/login')).resolves.toEqual({ redirectedTo: target })
      expect(mockNavigateTo).toHaveBeenCalledWith(target)
    })

    it('honors a custom login path', async () => {
      mockIsAuthenticated.mockResolvedValue(false)
      const { serverGuard } = await loadMiddleware()

      await expect(serverGuard(route('/profile'), '/sign-in')).resolves.toEqual({
        redirectedTo: { path: '/sign-in', query: { redirect: '/profile' } },
      })
    })

    it('lets authenticated requests through', async () => {
      mockIsAuthenticated.mockResolvedValue(true)
      const { serverGuard } = await loadMiddleware()

      await expect(serverGuard(route('/profile'), '/login')).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('does not self-redirect on the login path', async () => {
      mockIsAuthenticated.mockResolvedValue(false)
      const { serverGuard } = await loadMiddleware()

      await expect(serverGuard(route('/login'), '/login')).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('is a no-op without a request event', async () => {
      mockUseRequestEvent.mockReturnValue(undefined)
      const { serverGuard } = await loadMiddleware()

      await expect(serverGuard(route('/profile'), '/login')).resolves.toBeUndefined()
      expect(mockIsAuthenticated).not.toHaveBeenCalled()
    })
  })

  describe('client branch (middleware default export)', () => {
    it('redirects when the resolved session is empty', async () => {
      mockUseAuth.mockReturnValue({ session: ref({ isPending: false, data: null }) })
      const { middleware } = await loadMiddleware()

      await expect(middleware(route('/profile'))).resolves.toEqual({
        redirectedTo: { path: '/login', query: { redirect: '/profile' } },
      })
    })

    it('reads the login path from runtime config', async () => {
      mockUseRuntimeConfig.mockReturnValue({ public: { convex: { loginPath: '/sign-in' } } })
      mockUseAuth.mockReturnValue({ session: ref({ isPending: false, data: null }) })
      const { middleware } = await loadMiddleware()

      await expect(middleware(route('/profile'))).resolves.toEqual({
        redirectedTo: { path: '/sign-in', query: { redirect: '/profile' } },
      })
    })

    it('falls back to /login when runtime config carries no login path', async () => {
      mockUseRuntimeConfig.mockReturnValue({ public: { convex: { loginPath: '' } } })
      mockUseAuth.mockReturnValue({ session: ref({ isPending: false, data: null }) })
      const { middleware } = await loadMiddleware()

      await expect(middleware(route('/profile'))).resolves.toEqual({
        redirectedTo: { path: '/login', query: { redirect: '/profile' } },
      })
    })

    it('does not self-redirect on the login path (same guard as the server branch)', async () => {
      mockUseAuth.mockReturnValue({ session: ref({ isPending: false, data: null }) })
      const { middleware } = await loadMiddleware()

      await expect(middleware(route('/login'))).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('waits for a pending session before deciding', async () => {
      const session = ref<{ isPending: boolean, data: { user: string } | null }>({
        isPending: true,
        data: null,
      })
      mockUseAuth.mockReturnValue({ session })
      const { middleware } = await loadMiddleware()

      const pending = middleware(route('/profile'))
      // Session resolves as signed-in — no redirect.
      session.value = { isPending: false, data: { user: 'u1' } }
      await expect(pending).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })
})
