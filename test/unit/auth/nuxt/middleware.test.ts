// PARITY: A-12
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const {
  mockNavigateTo,
  mockUseRequestEvent,
  mockUseNuxtApp,
  mockUseRuntimeConfig,
  mockIsAuthenticated,
  mockUseAuth,
  mockLoadAuthClient,
  mockClientSessionSettled,
  mockLoadedAuthClient,
} = vi.hoisted(() => ({
  mockNavigateTo: vi.fn((to: unknown) => ({ redirectedTo: to })),
  mockUseRequestEvent: vi.fn(),
  mockUseNuxtApp: vi.fn(() => ({ runWithContext: (fn: () => unknown) => fn() })),
  mockUseRuntimeConfig: vi.fn(() => ({ public: { convex: { loginPath: '/login' } } })),
  mockIsAuthenticated: vi.fn(),
  mockUseAuth: vi.fn(),
  mockLoadAuthClient: vi.fn(async () => ({})),
  mockClientSessionSettled: vi.fn(async () => {}),
  mockLoadedAuthClient: vi.fn((): unknown => ({})),
}))

vi.mock('#app', () => ({
  defineNuxtRouteMiddleware: (fn: unknown) => fn,
  navigateTo: mockNavigateTo,
  useNuxtApp: mockUseNuxtApp,
  useRequestEvent: mockUseRequestEvent,
  useRuntimeConfig: mockUseRuntimeConfig,
}))

vi.mock('../../../../src/runtime/better-auth/vue/use-better-auth', () => ({
  useBetterAuth: mockUseAuth,
  clientSessionSettled: mockClientSessionSettled,
}))

vi.mock('../../../../src/runtime/better-auth/vue/auth-client-loader', () => ({
  loadAuthClient: mockLoadAuthClient,
  loadedAuthClient: mockLoadedAuthClient,
}))

vi.mock('../../../../src/runtime/better-auth/nuxt/server', () => ({
  convexBetterAuthNuxt: vi.fn(() => ({ isAuthenticated: mockIsAuthenticated })),
}))

type RouteMiddleware = (to: { path: string, fullPath: string }) => Promise<unknown>

function route(path: string) {
  return { path, fullPath: path }
}

async function loadMiddleware() {
  const mod = await import('../../../../src/runtime/better-auth/nuxt/middleware')
  const guard = await import('../../../../src/runtime/better-auth/nuxt/server-guard')
  return { middleware: mod.default as RouteMiddleware, serverGuard: guard.serverGuard }
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

    it('fails closed without a request event: redirects, and never lets the page render', async () => {
      mockUseRequestEvent.mockReturnValue(undefined)
      const { serverGuard } = await loadMiddleware()

      await serverGuard(route('/profile'), '/login')
      expect(mockIsAuthenticated).not.toHaveBeenCalled()
      expect(mockNavigateTo).toHaveBeenCalledWith({ path: '/login', query: { redirect: '/profile' } })
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

    // PARITY: D-18 — a session settled signed out without the client (the
    // server saw no cookie) may be stale: a sign-in in another tab or through
    // a static import. The guard waits for the client's own answer.
    it('lets a visitor the server\'s token covers through when the client cannot load', async () => {
      mockLoadedAuthClient.mockReturnValueOnce(undefined)
      mockUseAuth.mockReturnValue({ session: ref({ isPending: true, data: null }), isAuthenticated: ref(true) })
      const { middleware } = await loadMiddleware()

      await expect(middleware(route('/profile'))).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })

    it('sends a visitor nothing covers to sign in when the client cannot load', async () => {
      mockLoadedAuthClient.mockReturnValueOnce(undefined)
      mockUseAuth.mockReturnValue({ session: ref({ isPending: false, data: null }), isAuthenticated: ref(false) })
      const { middleware } = await loadMiddleware()

      await expect(middleware(route('/profile'))).resolves.toEqual({
        redirectedTo: { path: '/login', query: { redirect: '/profile' } },
      })
    })

    it('decides on the client\'s answer, not on a session settled without it', async () => {
      const session = ref<{ isPending: boolean, data: { user: string } | null }>({ isPending: false, data: null })
      mockUseAuth.mockReturnValue({ session })
      let answer!: () => void
      mockClientSessionSettled.mockImplementationOnce(() => new Promise<void>((resolve) => {
        answer = () => {
          session.value = { isPending: false, data: { user: 'u1' } }
          resolve()
        }
      }))
      const { middleware } = await loadMiddleware()

      const decided = middleware(route('/profile'))
      await Promise.resolve()
      expect(mockNavigateTo).not.toHaveBeenCalled()
      answer()
      await expect(decided).resolves.toBeUndefined()
      expect(mockNavigateTo).not.toHaveBeenCalled()
    })
  })
})
