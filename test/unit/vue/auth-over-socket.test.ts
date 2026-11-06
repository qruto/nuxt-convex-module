// PARITY: D-15
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeFunctionReference } from 'convex/server'
import { createRenderer, shallowRef, watch } from 'vue'
import { nodeWebSocket, withInMemoryWebSocket, type InMemoryWebSocketTest } from '../../helpers/in_memory_web_socket'
import { serveQueries } from '../../helpers/fake-deployment'
import { silentConnectLogger } from '../../helpers/silent-logger'

// The real client, auth state, Better Auth service and query composable against
// a socket, with components gating their queries on `isAuthenticated`: what the
// server sees is what these tests pin. A signed-in reader's queries must never
// run signed out, whatever auth does underneath them.

const pendingSession = { data: null, error: null, isPending: true, isRefetching: false }
const signedIn = (session: string, user: string) => ({ ...pendingSession, data: { session: { id: session }, user: { id: user } }, isPending: false })
const signedOut = { ...pendingSession, isPending: false }

const session = shallowRef<unknown>(pendingSession)
const tokenMock = vi.fn()

vi.mock('#convex/auth-client', () => ({
  authClient: {
    useSession: () => session,
    get convex() {
      return { token: tokenMock }
    },
  },
}))

/** An unsigned JWT, different on every call: a refresh always brings a new token. */
let minted = 0
function token(sub: string, lifetime = 900): string {
  const now = Math.floor(Date.now() / 1000)
  const part = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
  return `${part({ alg: 'none' })}.${part({ sub, iat: now, exp: now + lifetime, jti: ++minted })}.signature`
}

const QUERIES = ['notifications:getUnreadCount', 'notifications:listNotifications', 'comics/read:mine']

const renderer = createRenderer<object, object>({
  patchProp: () => {},
  insert: () => {},
  remove: () => {},
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  setText: () => {},
  setElementText: () => {},
  parentNode: () => null,
  nextSibling: () => null,
})

/** A page hydrated with a server token and a pending session: three components' worth of gated queries. */
async function hydrate(address: string, options: { lifetime?: number, leeway?: number } = {}) {
  const { useBetterAuth, __resetUseBetterAuthForTests } = await import('../../../src/runtime/better-auth/vue/use-better-auth')
  const { ConvexClientKey, ConvexVueClient } = await import('../../../src/runtime/vue/client')
  const { ConvexAuthStateKey, createScopedConvexAuthState } = await import('../../../src/runtime/vue/auth')
  const { useQuery_experimental } = await import('../../../src/runtime/vue/composables/use-query')
  __resetUseBetterAuthForTests()

  const client = new ConvexVueClient(address, {
    webSocketConstructor: nodeWebSocket,
    unsavedChangesWarning: false,
    logger: silentConnectLogger,
    authRefreshTokenLeewaySeconds: options.leeway,
  })
  const initialToken = token('user-1', options.lifetime)
  const { state, scope } = createScopedConvexAuthState({ client, useAuth: () => useBetterAuth(initialToken) })
  const gateChanges: boolean[] = []
  const stopWatching = watch(state.isAuthenticated, value => gateChanges.push(value), { flush: 'sync' })

  const app = renderer.createApp({
    setup() {
      for (const query of QUERIES) {
        useQuery_experimental({
          query: makeFunctionReference<'query'>(query),
          args: () => (state.isAuthenticated.value ? {} : 'skip'),
        })
      }
      return () => null
    },
  })
  app.provide(ConvexClientKey, client)
  app.provide(ConvexAuthStateKey, state)
  app.mount({})

  return {
    state,
    gateChanges,
    async close() {
      stopWatching()
      app.unmount()
      scope.stop()
      await client.close()
    },
  }
}

const withDeployment = (test: (socket: Parameters<InMemoryWebSocketTest>[0], deployment: ReturnType<typeof serveQueries>) => Promise<void>) =>
  withInMemoryWebSocket(socket => test(socket, serveQueries(socket)))

/** Long enough for anything a transition set off to have reached the server. */
const quiet = () => new Promise(resolve => setTimeout(resolve, 60))

describe('auth over a socket with live queries', () => {
  beforeEach(() => {
    session.value = pendingSession
    tokenMock.mockReset()
    tokenMock.mockImplementation(async () => ({ data: { token: token('user-1') } }))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('runs no query signed out while a page loads', async () => {
    await withDeployment(async ({ address }, deployment) => {
      const page = await hydrate(address)
      await vi.waitFor(() => expect(deployment.subscribed()).toBe(QUERIES.length))

      session.value = signedIn('session-1', 'user-1')
      await quiet()

      expect(deployment.signedOutRuns()).toEqual([])
      expect(deployment.frames).not.toContain('Authenticate(None)')
      expect(page.gateChanges).toEqual([true])
      expect(tokenMock).toHaveBeenCalledTimes(1)
      await page.close()
    })
  })

  it('refreshes the token under live queries', async () => {
    await withDeployment(async ({ address }, deployment) => {
      tokenMock.mockImplementation(async () => ({ data: { token: token('user-1', 3) } }))
      const page = await hydrate(address, { lifetime: 3, leeway: 2.8 })
      session.value = signedIn('session-1', 'user-1')
      await vi.waitFor(() => expect(tokenMock.mock.calls.length).toBeGreaterThan(1), { timeout: 2000 })
      await quiet()

      const refreshed = await tokenMock.mock.results.at(-1)!.value
      expect(deployment.tokens).toContain(refreshed.data.token)
      expect(deployment.subscribed()).toBe(QUERIES.length)
      expect(deployment.signedOutRuns()).toEqual([])
      expect(page.gateChanges).toEqual([true])
      await page.close()
    })
  })

  it('takes the gated queries off the socket before it clears auth', async () => {
    await withDeployment(async ({ address }, deployment) => {
      const page = await hydrate(address)
      session.value = signedIn('session-1', 'user-1')
      await vi.waitFor(() => expect(deployment.subscribed()).toBe(QUERIES.length))
      await quiet()

      session.value = signedOut
      await vi.waitFor(() => expect(deployment.identity()).toBeNull())

      expect(deployment.frames.slice(-4)).toEqual([...QUERIES.map(query => `-${query}`), 'Authenticate(None)'])
      expect(deployment.signedOutRuns()).toEqual([])
      await page.close()
    })
  })

  it('moves to another session with no query running signed out', async () => {
    await withDeployment(async ({ address }, deployment) => {
      const page = await hydrate(address)
      session.value = signedIn('session-1', 'user-1')
      await vi.waitFor(() => expect(deployment.subscribed()).toBe(QUERIES.length))
      await quiet()

      tokenMock.mockImplementation(async () => ({ data: { token: token('user-2') } }))
      session.value = signedIn('session-2', 'user-2')
      await vi.waitFor(() => expect(deployment.identity()).toBe('user-2'))
      await vi.waitFor(() => expect(page.state.isAuthenticated.value).toBe(true))
      await vi.waitFor(() => expect(deployment.subscribed()).toBe(QUERIES.length))

      expect(deployment.signedOutRuns()).toEqual([])
      await page.close()
    })
  })

  it('leaves no identity on the server when the new session gets no token', async () => {
    await withDeployment(async ({ address }, deployment) => {
      const page = await hydrate(address)
      session.value = signedIn('session-1', 'user-1')
      await vi.waitFor(() => expect(deployment.subscribed()).toBe(QUERIES.length))
      await quiet()

      tokenMock.mockImplementation(async () => ({ data: null }))
      session.value = signedIn('session-2', 'user-2')
      await vi.waitFor(() => expect(deployment.identity()).toBeNull())
      await quiet()

      expect(deployment.identity()).toBeNull()
      expect(page.state.isAuthenticated.value).toBe(false)
      expect(deployment.signedOutRuns()).toEqual([])
      await page.close()
    })
  })

  it('ends on the token of the user the session settles to', async () => {
    await withDeployment(async ({ address }, deployment) => {
      tokenMock.mockImplementation(async () => ({ data: { token: token('user-2') } }))
      const page = await hydrate(address)
      await vi.waitFor(() => expect(deployment.subscribed()).toBe(QUERIES.length))

      session.value = signedIn('session-2', 'user-2')
      await vi.waitFor(() => expect(deployment.identity()).toBe('user-2'))
      await quiet()

      expect(deployment.signedOutRuns()).toEqual([])
      await page.close()
    })
  })

  it('comes back after the server rejects an expired token', async () => {
    await withDeployment(async ({ address }, deployment) => {
      const page = await hydrate(address)
      session.value = signedIn('session-1', 'user-1')
      await vi.waitFor(() => expect(deployment.subscribed()).toBe(QUERIES.length))
      await quiet()
      const rejected = deployment.tokens.at(-1)

      deployment.expireToken()

      await vi.waitFor(() => expect(deployment.connections()).toBe(2), { timeout: 2000 })
      await vi.waitFor(() => expect(deployment.subscribed()).toBe(QUERIES.length))
      expect(deployment.identity()).toBe('user-1')
      expect(deployment.tokens.at(-1)).not.toBe(rejected)
      expect(page.state.isAuthenticated.value).toBe(true)
      await page.close()
    })
  })
})
