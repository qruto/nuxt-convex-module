import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import ws from 'ws'
import { makeFunctionReference } from 'convex/server'
import { ConvexVueClient } from '../../src/runtime/vue/client'
import { createConvexDevtoolsBridge } from '../../src/runtime/devtools/bridge'
import type { DevtoolsQuerySnapshot } from '../../src/runtime/devtools/types'

const address = 'https://127.0.0.1:3001'

const testQuery = makeFunctionReference<'query'>('myQuery:default')

// A fresh logger per client: the bridge patches the logger's methods in place,
// so sharing an instance across tests would leak instrumentation.
const createSilentLogger = () => ({ logVerbose() {}, log() {}, warn() {}, error() {} })

const createClient = () =>
  new ConvexVueClient(address, {
    webSocketConstructor: ws as unknown as typeof WebSocket,
    logger: createSilentLogger(),
  })

const flushMicrotasks = () => new Promise<void>(resolve => setTimeout(resolve, 0))

// A plausible ConnectionState for the fake sync client below.
const fakeConnectionState = () => ({
  isWebSocketConnected: false,
  hasInflightRequests: false,
  hasEverConnected: false,
  connectionCount: 0,
  connectionRetries: 0,
  inflightMutations: 0,
  inflightActions: 0,
  timeOfOldestInflightRequest: null,
})

/**
 * Install a minimal `BaseConvexClient` stand-in on the private `cachedSync`
 * field so the bridge can read local query results without opening a
 * WebSocket. Must run BEFORE `createConvexDevtoolsBridge` so its property trap
 * adopts the fake on creation.
 */
const installFakeSync = (
  client: ConvexVueClient,
  localQueryResultByToken: (token: string) => unknown,
) => {
  Reflect.set(client, 'cachedSync', {
    connectionState: fakeConnectionState,
    subscribeToConnectionState: () => () => {},
    close: async () => {},
    localQueryResultByToken,
  })
}

/** Register a raw listener token directly on the client's subscription map. */
const addListenerToken = (client: ConvexVueClient, token: string) => {
  const listeners = Reflect.get(client, 'listeners') as Map<string, Set<() => void>>
  listeners.set(token, new Set([() => {}]))
}

describe('devtools bridge', () => {
  let client: ConvexVueClient

  beforeEach(() => {
    client = createClient()
  })

  afterEach(async () => {
    await client?.close()
    client = undefined as unknown as ConvexVueClient
  })

  // ── canary ──────────────────────────────────────────────────────────────────
  // The bridge reaches into ConvexVueClient's TS-private internals at runtime
  // (deliberately, to keep the ported client.ts byte-diffable against
  // upstream). If an upstream sync renames these, this test MUST fail before
  // the panel silently breaks — update bridge.ts's ClientInternals alongside.
  describe('canary: client internals the bridge depends on', () => {
    it('exposes the subscription listeners map', () => {
      expect(Reflect.get(client, 'listeners')).toBeInstanceOf(Map)
    })

    it('exposes an instance-patchable transition method', () => {
      expect(typeof Reflect.get(client, 'transition')).toBe('function')
    })

    it('assigns cachedSync lazily on first sync access', () => {
      expect(Reflect.get(client, 'cachedSync')).toBeUndefined()
      void client.connectionState()
      expect(Reflect.get(client, 'cachedSync')).toBeDefined()
    })
  })

  // ── instrumentation ─────────────────────────────────────────────────────────
  describe('createConvexDevtoolsBridge', () => {
    it('does not instantiate the sync client (and its WebSocket) by itself', () => {
      const bridge = createConvexDevtoolsBridge(client)
      const snapshot = bridge.getSnapshot()

      expect(snapshot.connection.status).toBe('idle')
      expect(Reflect.get(client, 'cachedSync')).toBeUndefined()
    })

    it('enumerates active subscriptions with parsed udfPath and args', () => {
      const bridge = createConvexDevtoolsBridge(client)
      const unsubscribe = client.watchQuery(testQuery, { channel: 'general' }).onUpdate(() => {})

      const [query] = bridge.getSnapshot().queries
      expect(query).toMatchObject({
        udfPath: 'myQuery:default',
        args: { channel: 'general' },
        paginated: false,
        listenerCount: 1,
        updates: 0,
      })

      unsubscribe()
      expect(bridge.getSnapshot().queries).toHaveLength(0)
    })

    it('coalesces a burst of subscription changes into one queries event', async () => {
      const bridge = createConvexDevtoolsBridge(client)
      const events: DevtoolsQuerySnapshot[][] = []
      bridge.on('queries', queries => events.push(queries))

      client.watchQuery(testQuery, { a: 1 }).onUpdate(() => {})
      client.watchQuery(testQuery, { a: 2 }).onUpdate(() => {})
      await flushMicrotasks()

      expect(events).toHaveLength(1)
      expect(events[0]).toHaveLength(2)
    })

    it('counts server transitions per query token', async () => {
      const bridge = createConvexDevtoolsBridge(client)
      client.watchQuery(testQuery, {}).onUpdate(() => {})
      const listeners = Reflect.get(client, 'listeners') as Map<string, Set<() => void>>
      const [token] = listeners.keys()

      const transition = Reflect.get(client, 'transition') as (tokens: string[]) => void
      transition.call(client, [token!])
      transition.call(client, [token!])
      await flushMicrotasks()

      const [query] = bridge.getSnapshot().queries
      expect(query!.updates).toBe(2)
      expect(query!.lastUpdatedAt).not.toBeNull()
    })

    it('still delivers transitions to the client listeners it wraps', () => {
      const bridge = createConvexDevtoolsBridge(client)
      const callback = vi.fn()
      client.watchQuery(testQuery, {}).onUpdate(callback)
      const listeners = Reflect.get(client, 'listeners') as Map<string, Set<() => void>>
      const [token] = listeners.keys()

      const transition = Reflect.get(client, 'transition') as (tokens: string[]) => void
      transition.call(client, [token!])

      expect(callback).toHaveBeenCalledTimes(1)
      void bridge
    })

    it('wires connection-state updates when the sync client appears later', async () => {
      const bridge = createConvexDevtoolsBridge(client)
      expect(bridge.getSnapshot().connection.status).toBe('idle')

      // First real use creates the sync client lazily — the bridge's property
      // trap must notice without having triggered creation itself.
      void client.connectionState()

      const { connection } = bridge.getSnapshot()
      expect(connection.status).toBe('active')
      expect(connection.state).toMatchObject({ isWebSocketConnected: false })
    })

    it('tees logger output into a bounded log stream', () => {
      const bridge = createConvexDevtoolsBridge(client)
      const events: string[] = []
      bridge.on('log', entry => events.push(entry.level))

      client.logger.warn('socket', { code: 1006 })
      client.logger.error(new Error('boom'))

      expect(events).toEqual(['warn', 'error'])
      const logs = bridge.getSnapshot().logs
      expect(logs[0]).toMatchObject({ level: 'warn', args: ['socket', '{"code":1006}'] })
      expect(logs[1]!.args[0]).toContain('boom')
    })

    it('degrades to the raw token when it is not JSON', () => {
      const bridge = createConvexDevtoolsBridge(client)
      addListenerToken(client, 'opaque-token')

      const [query] = bridge.getSnapshot().queries
      expect(query).toMatchObject({
        udfPath: 'opaque-token',
        args: undefined,
        paginated: false,
      })
    })

    it('serializes a defined local query result into the snapshot', () => {
      installFakeSync(client, () => ({ channel: 'general', count: 2 }))
      const bridge = createConvexDevtoolsBridge(client)
      addListenerToken(client, JSON.stringify({ udfPath: 'myQuery:default', args: {} }))

      const [query] = bridge.getSnapshot().queries
      expect(query!.result).toEqual({ channel: 'general', count: 2 })
      expect(query!.errorMessage).toBeUndefined()
    })

    it('falls back to String() for local results convexToJson cannot serialize', () => {
      installFakeSync(client, () => () => {})
      const bridge = createConvexDevtoolsBridge(client)
      addListenerToken(client, JSON.stringify({ udfPath: 'myQuery:default', args: {} }))

      const [query] = bridge.getSnapshot().queries
      expect(typeof query!.result).toBe('string')
      expect(query!.result).toContain('=>')
    })

    it('records an errorMessage when reading the local result throws', () => {
      installFakeSync(client, () => {
        throw new Error('query blew up')
      })
      const bridge = createConvexDevtoolsBridge(client)
      addListenerToken(client, JSON.stringify({ udfPath: 'myQuery:default', args: {} }))

      const [query] = bridge.getSnapshot().queries
      expect(query!.errorMessage).toBe('query blew up')
      expect(query!.result).toBeUndefined()
    })

    it('falls back to String() for log args JSON.stringify cannot handle', () => {
      const bridge = createConvexDevtoolsBridge(client)
      const circular: Record<string, unknown> = {}
      circular.self = circular

      client.logger.log(circular)

      expect(bridge.getSnapshot().logs[0]).toMatchObject({
        level: 'log',
        args: ['[object Object]'],
      })
    })

    it('stops delivering events after the unsubscribe returned by on() is called', () => {
      const bridge = createConvexDevtoolsBridge(client)
      const callback = vi.fn()

      const off = bridge.on('log', callback)
      off()
      client.logger.warn('dropped')

      expect(callback).not.toHaveBeenCalled()
    })

    it('publishes auth snapshots pushed by the plugin', () => {
      const bridge = createConvexDevtoolsBridge(client)
      const events: boolean[] = []
      bridge.on('auth', auth => events.push(auth.isAuthenticated ?? false))

      bridge.setAuth({ available: true, isLoading: false, isAuthenticated: true, isRefreshing: false })

      expect(events).toEqual([true])
      expect(bridge.getSnapshot().auth).toMatchObject({ available: true, isAuthenticated: true })
    })

    it('treats close() as terminal', async () => {
      const bridge = createConvexDevtoolsBridge(client)
      const events: string[] = []
      bridge.on('connection', connection => events.push(connection.status))

      void client.connectionState()
      await client.close()
      client = undefined as unknown as ConvexVueClient

      expect(events.at(-1)).toBe('closed')
      expect(bridge.getSnapshot().connection.status).toBe('closed')
    })
  })
})
