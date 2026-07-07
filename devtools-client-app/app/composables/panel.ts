import { reactive } from 'vue'
import { onDevtoolsClientConnected, useDevtoolsClient } from '@nuxt/devtools-kit/iframe-client'
import { RPC_NAMESPACE } from '../../../src/devtools/rpc-types'
import type { ClientFunctions, DevtoolsServerInfo, ServerFunctions } from '../../../src/devtools/rpc-types'
import type {
  ConvexDevtoolsBridge,
  DevtoolsAuthSnapshot,
  DevtoolsConnectionSnapshot,
  DevtoolsLogEntry,
  DevtoolsQuerySnapshot,
} from '../../../src/runtime/devtools/types'

const MAX_LOG_ENTRIES = 300

// How long to keep polling for the in-page bridge before declaring it absent —
// the app plugin may attach it as late as `app:mounted`.
const BRIDGE_RETRY_INTERVAL = 300
const BRIDGE_RETRY_LIMIT = 10

export interface PanelState {
  /** DevTools iframe handshake completed. */
  connected: boolean
  /** null = still looking for the in-page bridge. */
  bridgeAvailable: boolean | null
  info: DevtoolsServerInfo | null
  connection: DevtoolsConnectionSnapshot
  queries: DevtoolsQuerySnapshot[]
  auth: DevtoolsAuthSnapshot
  logs: DevtoolsLogEntry[]
}

const state = reactive<PanelState>({
  connected: false,
  bridgeAvailable: null,
  info: null,
  connection: { status: 'idle' },
  queries: [],
  auth: { available: false },
  logs: [],
})

type PanelRpc = {
  getInfo: () => Promise<DevtoolsServerInfo>
  resolveFunctionSource: (udfPath: string) => Promise<{ filepath?: string }>
}

let rpc: PanelRpc | null = null
let openInEditor: ((filepath: string) => unknown) | null = null
let initialized = false

function lookupBridge(hostNuxt: unknown): ConvexDevtoolsBridge | undefined {
  const fromNuxt = (hostNuxt as { $convexDevtools?: ConvexDevtoolsBridge } | undefined)?.$convexDevtools
  if (fromNuxt) return fromNuxt
  // Same-origin fallback: the inspected app's window is the iframe's parent.
  try {
    return (window.parent as unknown as { __NUXT_CONVEX_DEVTOOLS__?: ConvexDevtoolsBridge }).__NUXT_CONVEX_DEVTOOLS__
  }
  catch {
    return undefined
  }
}

function attachBridge(bridge: ConvexDevtoolsBridge): void {
  state.bridgeAvailable = true
  const snapshot = bridge.getSnapshot()
  state.connection = snapshot.connection
  state.queries = snapshot.queries
  state.auth = snapshot.auth
  state.logs = [...snapshot.logs]
  bridge.on('connection', connection => state.connection = connection)
  bridge.on('queries', queries => state.queries = queries)
  bridge.on('auth', auth => state.auth = auth)
  bridge.on('log', (entry) => {
    state.logs.push(entry)
    if (state.logs.length > MAX_LOG_ENTRIES) state.logs.splice(0, state.logs.length - MAX_LOG_ENTRIES)
  })
}

/** Panel-wide reactive state, connecting to the host app on first use. */
export function usePanelState(): PanelState {
  if (initialized) return state
  initialized = true

  // Initializes the kit's internal clientRef — without this, the
  // `window.__NUXT_DEVTOOLS__` getter it installs throws on access.
  useDevtoolsClient()

  onDevtoolsClientConnected((client) => {
    state.connected = true
    openInEditor = filepath => client.devtools.rpc.openInEditor(filepath)
    rpc = client.devtools.extendClientRpc<ServerFunctions, ClientFunctions>(
      RPC_NAMESPACE,
      {} as ClientFunctions,
    ) as unknown as PanelRpc

    // The RPC rides the Vite HMR WebSocket, which can lag behind the iframe —
    // keep trying until the server answers rather than showing stale defaults.
    const fetchInfo = (attempt = 0) => {
      Promise.race([
        rpc!.getInfo(),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 4000)),
      ])
        .then(info => state.info = info)
        .catch(() => {
          if (attempt < 5) setTimeout(() => fetchInfo(attempt + 1), 2000)
        })
    }
    fetchInfo()

    // The app plugin may attach the bridge only after `app:mounted` — poll
    // briefly before reporting it missing.
    let attempts = 0
    const tryAttach = () => {
      const bridge = lookupBridge(client.host.nuxt)
      if (bridge) {
        attachBridge(bridge)
        return
      }
      attempts += 1
      if (attempts >= BRIDGE_RETRY_LIMIT) {
        state.bridgeAvailable = false
        return
      }
      setTimeout(tryAttach, BRIDGE_RETRY_INTERVAL)
    }
    tryAttach()
  })

  return state
}

/** Open the source file of a Convex function in the user's editor. */
export async function openFunctionInEditor(udfPath: string): Promise<void> {
  if (!rpc || !openInEditor) return
  const { filepath } = await rpc.resolveFunctionSource(udfPath)
  if (filepath) await openInEditor(filepath)
}
