import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const {
  mockNavigateTo,
  mockUseRequestEvent,
  mockUseNuxtApp,
  mockIsAuthenticated,
  mockUseAuth,
} = vi.hoisted(() => ({
  mockNavigateTo: vi.fn((to: string) => ({ redirectedTo: to })),
  mockUseRequestEvent: vi.fn(),
  mockUseNuxtApp: vi.fn(() => ({ runWithContext: (fn: () => unknown) => fn() })),
  mockIsAuthenticated: vi.fn(),
  mockUseAuth: vi.fn(),
}))

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  navigateTo: mockNavigateTo,
  useNuxtApp: mockUseNuxtApp,
  useRequestEvent: mockUseRequestEvent,
}))

vi.mock('../../../../src/runtime/better-auth/vue/use-auth', () => ({
  useAuth: mockUseAuth,
}))

vi.mock('../../../../src/runtime/better-auth/nuxt/server', () => ({
  convexAuth: vi.fn(() => ({ isAuthenticated: mockIsAuthenticated })),
}))

type RouteMiddleware = (to: { path: string }) => Promise<unknown>

async function loadMiddleware() {
  const mod = await import('../../../../src/runtime/better-auth/nuxt/middleware')
  return { middleware: mod.default as RouteMiddleware, serverGuard: mod.serverGuard }
}

describe('auth route middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseNuxtApp.mockReturnValue({ runWithContext: (fn: () => unknown) => fn() })
  })

  // `import.meta.server` is compile-time (always false in the unit project),
  // so the server branch is exercised via the exported serverGuard directly.
  describe('server guard', () => {
    beforeEach(() => {
      mockUseRequestEvent.mockReturnValue({ context: {} })
    })

    it('redirects unauthenticated requests to /login', async () => {
      mockIsAuthenticated.mockResolvedValue(false)
      const { serverGuard } = await loadMiddleware()

      await expect(serverGuard('/profile')).resolves.toEqual({ redirectedTo: '/login' })
      expect(mockNavigateTo).toHaveBeenCalledWith('/login')
    })

    it('lets authenticated requests through', async () => {
      mockIsAuthenticated.mockResolvedValue(true)
      const { serverGuard } = await loadMiddleware()

      await expect(serverGuard('/profile')).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('does not self-redirect on /login', async () => {
      mockIsAuthenticated.mockResolvedValue(false)
      const { serverGuard } = await loadMiddleware()

      await expect(serverGuard('/login')).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('is a no-op without a request event', async () => {
      mockUseRequestEvent.mockReturnValue(undefined)
      const { serverGuard } = await loadMiddleware()

      await expect(serverGuard('/profile')).resolves.toBeUndefined()
      expect(mockIsAuthenticated).not.toHaveBeenCalled()
    })
  })

  describe('client branch (middleware default export)', () => {
    it('redirects when the resolved session is empty', async () => {
      mockUseAuth.mockReturnValue({ session: ref({ isPending: false, data: null }) })
      const { middleware } = await loadMiddleware()

      await expect(middleware({ path: '/profile' })).resolves.toEqual({ redirectedTo: '/login' })
    })

    it('does not self-redirect on /login (same guard as the server branch)', async () => {
      mockUseAuth.mockReturnValue({ session: ref({ isPending: false, data: null }) })
      const { middleware } = await loadMiddleware()

      await expect(middleware({ path: '/login' })).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('waits for a pending session before deciding', async () => {
      const session = ref<{ isPending: boolean, data: { user: string } | null }>({
        isPending: true,
        data: null,
      })
      mockUseAuth.mockReturnValue({ session })
      const { middleware } = await loadMiddleware()

      const pending = middleware({ path: '/profile' })
      // Session resolves as signed-in — no redirect.
      session.value = { isPending: false, data: { user: 'u1' } }
      await expect(pending).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })
})
