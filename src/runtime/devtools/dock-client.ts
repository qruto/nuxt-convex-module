// PARITY: A-15
// Vue-only addition (no upstream counterpart): the Convex dock's client script
// on Nuxt DevTools 4. Vite DevTools imports it into the app page eagerly, once
// the page is trusted, so the dock shows the client's health while the panel
// is closed. It reads the same in-page bridge the panel does.
import type { ConvexDevtoolsBridge, DevtoolsConnectionSnapshot, DevtoolsQuerySnapshot } from './types'

type Badge = { badge?: string, badgeVariant?: 'danger' | 'warning' }

interface MessageInput {
  id: string
  message: string
  description?: string
  level: 'warn' | 'error' | 'success'
  notify?: boolean
  actions?: { id: string, label: string, kind: 'activate', activate: { dockId: string } }[]
}

/**
 * The part of Vite DevTools' `DockClientScriptContext` this script uses, typed
 * here so the published runtime does not depend on `@vitejs/devtools-kit`.
 */
export interface DockScriptContext<Entry extends { id: string } = { id: string }> {
  current: { entryMeta: Entry }
  docks: { register(entry: Entry & Badge, force?: boolean): { update(patch: Badge): void } }
  messages: { add(input: MessageInput): Promise<unknown>, remove(id: string): Promise<void> }
}

/** Offline only after a first connection: a client still connecting is not down. */
function isOffline(connection: DevtoolsConnectionSnapshot): boolean {
  return connection.status === 'active' && !!connection.state?.hasEverConnected && !connection.state.isWebSocketConnected
}

/** Run `callback` with the bridge now, and again whenever the plugin sets a new one. */
function onBridge(callback: (bridge: ConvexDevtoolsBridge) => void): void {
  let bridge = window.__NUXT_CONVEX_DEVTOOLS__
  Object.defineProperty(window, '__NUXT_CONVEX_DEVTOOLS__', {
    configurable: true,
    get: () => bridge,
    set: (value: ConvexDevtoolsBridge | undefined) => {
      bridge = value
      if (value) callback(value)
    },
  })
  if (bridge) callback(bridge)
}

/**
 * Show the client's health on the Convex dock: a danger "offline" badge while
 * the WebSocket is down, a warning count of failing queries, nothing when
 * healthy — plus one message for the outage and one per failing query.
 *
 * Returns at once: DevTools awaits this before it opens the dock.
 */
export default function setupConvexDock<Entry extends { id: string }>(ctx: DockScriptContext<Entry>): void {
  const dockId = ctx.current.entryMeta.id
  const connectionMessage = `${dockId}:connection`
  const queryMessage = (udfPath: string) => `${dockId}:query:${udfPath}`
  const actions = [{ id: 'open', label: 'Open panel', kind: 'activate' as const, activate: { dockId } }]

  let offline = false
  // udfPath → error message
  let failing = new Map<string, string>()

  // The server registered the dock; a client registration of the same id
  // overrides it in this page only, keeping its group and category.
  let dock: { update(patch: Badge): void } | undefined
  let shown: string | undefined
  const render = () => {
    const badge = offline ? 'offline' : failing.size ? String(failing.size) : undefined
    if (badge === shown) return
    shown = badge
    const patch: Badge = { badge, badgeVariant: offline ? 'danger' : badge ? 'warning' : undefined }
    if (dock) dock.update(patch)
    else dock = ctx.docks.register({ ...ctx.current.entryMeta, ...patch }, true)
  }

  const onConnection = (connection: DevtoolsConnectionSnapshot) => {
    if (isOffline(connection) === offline) return
    offline = !offline
    // One message, its level flipped: the outage reads as resolved, not gone.
    void ctx.messages.add(offline
      ? { id: connectionMessage, level: 'error', message: 'Convex offline', description: 'The WebSocket to the Convex deployment closed. The client keeps reconnecting.', notify: true, actions }
      : { id: connectionMessage, level: 'success', message: 'Convex online', description: 'The WebSocket to the Convex deployment is open again.', notify: true, actions })
    render()
  }

  const onQueries = (queries: DevtoolsQuerySnapshot[]) => {
    const next = new Map<string, string>()
    for (const query of queries) {
      if (query.errorMessage !== undefined) next.set(query.udfPath, query.errorMessage)
    }
    for (const [udfPath, error] of next) {
      if (failing.get(udfPath) !== error) {
        void ctx.messages.add({ id: queryMessage(udfPath), level: 'warn', message: `Query ${udfPath} failed`, description: error, actions })
      }
    }
    for (const udfPath of failing.keys()) {
      if (!next.has(udfPath)) void ctx.messages.remove(queryMessage(udfPath))
    }
    failing = next
    render()
  }

  let unsubscribe: (() => void)[] = []
  onBridge((bridge) => {
    for (const off of unsubscribe) off()
    unsubscribe = [bridge.on('connection', onConnection), bridge.on('queries', onQueries)]
    const snapshot = bridge.getSnapshot()
    onConnection(snapshot.connection)
    onQueries(snapshot.queries)
  })
}
