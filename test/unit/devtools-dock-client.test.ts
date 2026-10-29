// PARITY: A-15
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import type { DockClientScriptContext } from '@vitejs/devtools-kit/client'
import setupConvexDock, { type DockScriptContext } from '../../src/runtime/devtools/dock-client'
import type { BridgeEvents, ConvexDevtoolsBridge, DevtoolsConnectionSnapshot, DevtoolsQuerySnapshot } from '../../src/runtime/devtools/types'

const dockId = 'nuxt-convex-module'
const open = [{ id: 'open', label: 'Open panel', kind: 'activate', activate: { dockId } }]

const connected = (isWebSocketConnected: boolean, hasEverConnected = true): DevtoolsConnectionSnapshot => ({
  status: 'active',
  state: {
    isWebSocketConnected,
    hasEverConnected,
    hasInflightRequests: false,
    connectionCount: 1,
    connectionRetries: 0,
    inflightMutations: 0,
    inflightActions: 0,
    timeOfOldestInflightRequest: null,
  },
})

const query = (udfPath: string, errorMessage?: string): DevtoolsQuerySnapshot => ({
  token: `${udfPath}:${Math.random()}`,
  udfPath,
  args: {},
  paginated: false,
  listenerCount: 1,
  updates: 0,
  lastUpdatedAt: null,
  ...(errorMessage === undefined ? {} : { errorMessage }),
})

function fakeBridge(connection = connected(true), queries: DevtoolsQuerySnapshot[] = []) {
  const handlers = new Map<string, Set<(payload: never) => void>>()
  const bridge: ConvexDevtoolsBridge = {
    version: 1,
    getSnapshot: () => ({ connection, queries, auth: { available: false }, logs: [] }),
    on(event, callback) {
      const set = handlers.get(event) ?? new Set()
      handlers.set(event, set)
      set.add(callback as (payload: never) => void)
      return () => set.delete(callback as (payload: never) => void)
    },
  }
  const emit = <E extends keyof BridgeEvents>(event: E, payload: Parameters<BridgeEvents[E]>[0]) => {
    for (const handler of handlers.get(event) ?? []) (handler as (p: typeof payload) => void)(payload)
  }
  return { bridge, emit }
}

function fakeContext() {
  const update = vi.fn()
  const ctx = {
    current: { entryMeta: { id: dockId, title: 'Convex', groupId: 'nuxt', category: 'modules' } },
    docks: { register: vi.fn(() => ({ update })) },
    messages: { add: vi.fn(async (_input: unknown) => {}), remove: vi.fn(async (_id: string) => {}) },
  }
  return { ctx, update }
}

beforeEach(() => vi.stubGlobal('window', {}))
afterEach(() => vi.unstubAllGlobals())

describe('the Convex dock client script', () => {
  it('fits the context Vite DevTools hands a dock client script', () => {
    expectTypeOf<DockClientScriptContext>().toExtend<DockScriptContext<DockClientScriptContext['current']['entryMeta']>>()
  })

  it('waits for the bridge and leaves a healthy dock alone', () => {
    const { ctx } = fakeContext()
    setupConvexDock(ctx)
    const { bridge } = fakeBridge()
    window.__NUXT_CONVEX_DEVTOOLS__ = bridge

    expect(window.__NUXT_CONVEX_DEVTOOLS__).toBe(bridge)
    expect(ctx.docks.register).not.toHaveBeenCalled()
    expect(ctx.messages.add).not.toHaveBeenCalled()
  })

  it('badges the dock offline and toasts once the WebSocket drops, then turns the message into a success', () => {
    const { ctx, update } = fakeContext()
    const { bridge, emit } = fakeBridge()
    window.__NUXT_CONVEX_DEVTOOLS__ = bridge
    setupConvexDock(ctx)

    emit('connection', connected(false))
    // The client registration keeps the server entry's group and category.
    expect(ctx.docks.register).toHaveBeenCalledWith(
      { ...ctx.current.entryMeta, badge: 'offline', badgeVariant: 'danger' },
      true,
    )
    expect(ctx.messages.add).toHaveBeenLastCalledWith(expect.objectContaining({
      id: `${dockId}:connection`,
      level: 'error',
      notify: true,
      actions: open,
    }))

    // Retries report the same state: nothing new.
    emit('connection', connected(false))
    expect(ctx.messages.add).toHaveBeenCalledTimes(1)

    emit('connection', connected(true))
    expect(update).toHaveBeenCalledWith({ badge: undefined, badgeVariant: undefined })
    expect(ctx.messages.add).toHaveBeenLastCalledWith(expect.objectContaining({
      id: `${dockId}:connection`,
      level: 'success',
    }))
    expect(ctx.docks.register).toHaveBeenCalledTimes(1)
  })

  it('does not call a client that has never connected offline', () => {
    const { ctx } = fakeContext()
    window.__NUXT_CONVEX_DEVTOOLS__ = fakeBridge(connected(false, false)).bridge
    setupConvexDock(ctx)

    expect(ctx.docks.register).not.toHaveBeenCalled()
    expect(ctx.messages.add).not.toHaveBeenCalled()
  })

  it('counts failing queries by function and keeps one message per function', () => {
    const { ctx, update } = fakeContext()
    const { bridge, emit } = fakeBridge(connected(true), [
      query('messages:list', 'boom'),
      query('messages:list', 'boom'),
      query('users:get', 'denied'),
      query('users:me'),
    ])
    window.__NUXT_CONVEX_DEVTOOLS__ = bridge
    setupConvexDock(ctx)

    expect(ctx.docks.register).toHaveBeenCalledWith(expect.objectContaining({ badge: '2', badgeVariant: 'warning' }), true)
    expect(ctx.messages.add.mock.calls.map(([input]) => input)).toEqual([
      { id: `${dockId}:query:messages:list`, level: 'warn', message: 'Query messages:list failed', description: 'boom', actions: open },
      { id: `${dockId}:query:users:get`, level: 'warn', message: 'Query users:get failed', description: 'denied', actions: open },
    ])

    emit('queries', [query('messages:list', 'boom'), query('users:get')])
    expect(ctx.messages.add).toHaveBeenCalledTimes(2)
    expect(ctx.messages.remove).toHaveBeenCalledWith(`${dockId}:query:users:get`)
    expect(update).toHaveBeenLastCalledWith({ badge: '1', badgeVariant: 'warning' })
  })

  it('shows offline over the failing-query count', () => {
    const { ctx, update } = fakeContext()
    const { bridge, emit } = fakeBridge(connected(true), [query('messages:list', 'boom')])
    window.__NUXT_CONVEX_DEVTOOLS__ = bridge
    setupConvexDock(ctx)

    emit('connection', connected(false))
    expect(update).toHaveBeenLastCalledWith({ badge: 'offline', badgeVariant: 'danger' })
    emit('connection', connected(true))
    expect(update).toHaveBeenLastCalledWith({ badge: '1', badgeVariant: 'warning' })
  })

  it('moves to a bridge the plugin sets again', () => {
    const { ctx } = fakeContext()
    const first = fakeBridge()
    window.__NUXT_CONVEX_DEVTOOLS__ = first.bridge
    setupConvexDock(ctx)

    window.__NUXT_CONVEX_DEVTOOLS__ = fakeBridge().bridge
    first.emit('connection', connected(false))
    expect(ctx.docks.register).not.toHaveBeenCalled()
  })
})
