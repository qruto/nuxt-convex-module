import { convexToJson } from 'convex/values'
import type { Value } from 'convex/values'
import type { BaseConvexClient, ConnectionState, QueryToken } from 'convex/browser'
import type { ConvexVueClient } from '../vue/client'
import type {
  BridgeEvents,
  ConvexDevtoolsBridgeHost,
  DevtoolsAuthSnapshot,
  DevtoolsConnectionSnapshot,
  DevtoolsLogEntry,
  DevtoolsQuerySnapshot,
  DevtoolsSnapshot,
} from './types'

const MAX_LOG_ENTRIES = 300

// Vue-only addition (documented in PARITY.md): dev-only instrumentation of the
// ported client, kept OUT of `vue/client.ts` so that file stays byte-diffable
// against upstream. TS `private` is erased at runtime, so the fields below are
// reachable from here; the canary test in `test/unit/devtools-bridge.test.ts`
// fails loudly if an upstream sync renames them. Worst case is a broken dev
// panel — this file is never loaded in production.
interface ClientInternals {
  listeners: Map<QueryToken, Set<() => void>>
  cachedSync?: BaseConvexClient
  transition(updatedQueries: QueryToken[]): void
}

// `@internal` members of BaseConvexClient (stripped from published types,
// present at runtime) — same access pattern as `SyncClientWithInternals` in
// `vue/client.ts`. Every access is optional-chained: if an upstream release
// moves them, the panel degrades (no results/logs) instead of throwing.
interface SyncInternals {
  localQueryResultByToken?(token: QueryToken): Value | undefined
  optimisticQueryResults?: {
    queryLogs?(token: QueryToken): string[] | undefined
  }
}

type ParsedToken = { udfPath: string, args: unknown, paginated: boolean }

function parseQueryToken(token: string): ParsedToken {
  try {
    const parsed = JSON.parse(token) as { udfPath?: string, args?: unknown, type?: string }
    return {
      udfPath: parsed.udfPath ?? token,
      args: parsed.args ?? {},
      paginated: parsed.type === 'paginated',
    }
  }
  catch {
    // The token format is explicitly unstable upstream — degrade to showing it raw.
    return { udfPath: token, args: undefined, paginated: false }
  }
}

function toPlainJson(value: Value | undefined): unknown {
  if (value === undefined) return undefined
  try {
    return convexToJson(value)
  }
  catch {
    return String(value)
  }
}

function renderLogArg(arg: unknown): string {
  if (typeof arg === 'string') return arg
  if (arg instanceof Error) return arg.stack ?? String(arg)
  try {
    return JSON.stringify(arg)
  }
  catch {
    return String(arg)
  }
}

function serializeConnectionState(state: ConnectionState): NonNullable<DevtoolsConnectionSnapshot['state']> {
  return {
    isWebSocketConnected: state.isWebSocketConnected,
    hasInflightRequests: state.hasInflightRequests,
    hasEverConnected: state.hasEverConnected,
    connectionCount: state.connectionCount,
    connectionRetries: state.connectionRetries,
    inflightMutations: state.inflightMutations,
    inflightActions: state.inflightActions,
    timeOfOldestInflightRequest: state.timeOfOldestInflightRequest?.getTime() ?? null,
  }
}

/**
 * Attach dev-only DevTools instrumentation to a {@link ConvexVueClient}.
 *
 * Observes the client from the outside — wrapping its subscription map,
 * instance-patching `transition`/`close`, trapping `cachedSync` assignment for
 * lazy connection-state wiring, and tee-ing the logger — and exposes plain-JSON
 * snapshots plus change events for the DevTools iframe. Never touches the
 * `sync` getter (which would open the WebSocket).
 */
export function createConvexDevtoolsBridge(client: ConvexVueClient): ConvexDevtoolsBridgeHost {
  const internals = client as unknown as ClientInternals
  const listeners = internals.listeners

  const handlers = new Map<keyof BridgeEvents, Set<(payload: never) => void>>()
  const emit = <E extends keyof BridgeEvents>(event: E, payload: Parameters<BridgeEvents[E]>[0]) => {
    for (const handler of handlers.get(event) ?? []) {
      (handler as (p: typeof payload) => void)(payload)
    }
  }

  let closed = false
  const queryStats = new Map<string, { updates: number, lastUpdatedAt: number }>()
  const logs: DevtoolsLogEntry[] = []
  let auth: DevtoolsAuthSnapshot = { available: false }

  // ── queries ────────────────────────────────────────────────────────────────
  const computeQueries = (): DevtoolsQuerySnapshot[] => {
    const sync = internals.cachedSync as (BaseConvexClient & SyncInternals) | undefined
    return Array.from(listeners.entries(), ([token, callbacks]) => {
      const { udfPath, args, paginated } = parseQueryToken(token)
      const stats = queryStats.get(token)
      const snapshot: DevtoolsQuerySnapshot = {
        token,
        udfPath,
        args,
        paginated,
        listenerCount: callbacks.size,
        updates: stats?.updates ?? 0,
        lastUpdatedAt: stats?.lastUpdatedAt ?? null,
      }
      try {
        snapshot.result = toPlainJson(sync?.localQueryResultByToken?.(token))
      }
      catch (error) {
        snapshot.errorMessage = error instanceof Error ? error.message : String(error)
      }
      const queryLogs = sync?.optimisticQueryResults?.queryLogs?.(token)
      if (queryLogs?.length) snapshot.logs = queryLogs
      return snapshot
    })
  }

  // Burst-coalesced: one `queries` event per microtask no matter how many
  // subscriptions change in a flush.
  let queriesEmitScheduled = false
  const scheduleQueriesEmit = () => {
    if (queriesEmitScheduled || closed) return
    queriesEmitScheduled = true
    queueMicrotask(() => {
      queriesEmitScheduled = false
      if (!closed) emit('queries', computeQueries())
    })
  }

  const originalSet = listeners.set.bind(listeners)
  listeners.set = (key, value) => {
    const result = originalSet(key, value)
    scheduleQueriesEmit()
    return result
  }
  const originalDelete = listeners.delete.bind(listeners)
  listeners.delete = (key) => {
    const result = originalDelete(key)
    queryStats.delete(key)
    scheduleQueriesEmit()
    return result
  }

  const originalTransition = internals.transition.bind(client)
  internals.transition = (updatedQueries) => {
    originalTransition(updatedQueries)
    const now = Date.now()
    for (const token of updatedQueries) {
      const stats = queryStats.get(token) ?? { updates: 0, lastUpdatedAt: now }
      stats.updates += 1
      stats.lastUpdatedAt = now
      queryStats.set(token, stats)
    }
    scheduleQueriesEmit()
  }

  // ── connection ─────────────────────────────────────────────────────────────
  const computeConnection = (): DevtoolsConnectionSnapshot => {
    if (closed) return { status: 'closed' }
    const sync = internals.cachedSync
    if (!sync) return { status: 'idle' }
    return { status: 'active', state: serializeConnectionState(sync.connectionState()) }
  }

  let unsubscribeConnection: (() => void) | undefined
  const onSyncCreated = (sync: BaseConvexClient) => {
    if (unsubscribeConnection || closed) return
    unsubscribeConnection = sync.subscribeToConnectionState((state) => {
      if (!closed) emit('connection', { status: 'active', state: serializeConnectionState(state) })
    })
    emit('connection', computeConnection())
  }

  // The sync client is created lazily (first subscription/mutation) by the
  // `sync` getter assigning `this.cachedSync`. Trap that assignment instead of
  // polling — and without ever triggering the getter ourselves.
  let cachedSyncValue = internals.cachedSync
  Object.defineProperty(client, 'cachedSync', {
    configurable: true,
    get: () => cachedSyncValue,
    set: (value: BaseConvexClient | undefined) => {
      cachedSyncValue = value
      if (value) onSyncCreated(value)
    },
  })
  if (cachedSyncValue) onSyncCreated(cachedSyncValue)

  const originalClose = client.close.bind(client)
  client.close = async () => {
    closed = true
    unsubscribeConnection?.()
    unsubscribeConnection = undefined
    emit('connection', { status: 'closed' })
    await originalClose()
  }

  // ── logs ───────────────────────────────────────────────────────────────────
  // Tee the shared logger (the same object instance is handed to
  // BaseConvexClient, and both call its methods via property lookup).
  const logger = client.logger
  const levels = [
    ['logVerbose', 'verbose'],
    ['log', 'log'],
    ['warn', 'warn'],
    ['error', 'error'],
  ] as const
  for (const [method, level] of levels) {
    const original = logger[method].bind(logger)
    logger[method] = (...args: unknown[]) => {
      original(...args)
      if (closed) return
      const entry: DevtoolsLogEntry = { level, args: args.map(renderLogArg), timestamp: Date.now() }
      logs.push(entry)
      if (logs.length > MAX_LOG_ENTRIES) logs.splice(0, logs.length - MAX_LOG_ENTRIES)
      emit('log', entry)
    }
  }

  return {
    version: 1,
    getSnapshot(): DevtoolsSnapshot {
      return {
        connection: computeConnection(),
        queries: computeQueries(),
        auth,
        logs: [...logs],
      }
    },
    on(event, callback) {
      let set = handlers.get(event)
      if (!set) {
        set = new Set()
        handlers.set(event, set)
      }
      set.add(callback as (payload: never) => void)
      return () => {
        set.delete(callback as (payload: never) => void)
      }
    },
    setAuth(snapshot) {
      auth = snapshot
      if (!closed) emit('auth', snapshot)
    },
  }
}
