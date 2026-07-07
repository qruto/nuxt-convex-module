// Vue-only addition (no upstream counterpart): the contract between the
// dev-only devtools plugin running inside the inspected app and the Nuxt
// DevTools iframe panel. Everything crossing the frame boundary is plain JSON
// data — Vue reactivity does not cross frames, so the panel keeps its own
// state and refreshes it from these snapshots/events.

/** Serialized `ConnectionState` (Date → epoch ms) plus the client lifecycle. */
export interface DevtoolsConnectionSnapshot {
  /**
   * `idle` — the underlying sync client (and its WebSocket) has not been
   * created yet; `active` — it exists; `closed` — the client was closed.
   */
  status: 'idle' | 'active' | 'closed'
  state?: {
    isWebSocketConnected: boolean
    hasInflightRequests: boolean
    hasEverConnected: boolean
    connectionCount: number
    connectionRetries: number
    inflightMutations: number
    inflightActions: number
    timeOfOldestInflightRequest: number | null
  }
}

/** One active query subscription on the client. */
export interface DevtoolsQuerySnapshot {
  /** The client's internal query token (stable identity for the panel). */
  token: string
  udfPath: string
  /** Query args, JSON-serialized (`convexToJson` shape). */
  args: unknown
  /** Whether this is a paginated-query page subscription. */
  paginated: boolean
  /** Number of Vue-layer listeners sharing this subscription. */
  listenerCount: number
  /** Server transitions observed for this token since the bridge attached. */
  updates: number
  /** Epoch ms of the last observed transition, if any. */
  lastUpdatedAt: number | null
  /** Current local result, JSON-serialized — absent while loading. */
  result?: unknown
  /** Set instead of `result` when the query errored. */
  errorMessage?: string
  /** Server-side log lines from this query's execution, if any. */
  logs?: string[]
}

export interface DevtoolsAuthSnapshot {
  /** False when no app-level auth state is observable (e.g. Clerk/Auth0). */
  available: boolean
  isLoading?: boolean
  isAuthenticated?: boolean
  isRefreshing?: boolean
}

export interface DevtoolsLogEntry {
  level: 'verbose' | 'log' | 'warn' | 'error'
  /** Log arguments, each rendered to a string. */
  args: string[]
  /** Epoch ms. */
  timestamp: number
}

export interface DevtoolsSnapshot {
  connection: DevtoolsConnectionSnapshot
  queries: DevtoolsQuerySnapshot[]
  auth: DevtoolsAuthSnapshot
  logs: DevtoolsLogEntry[]
}

export interface BridgeEvents {
  connection: (connection: DevtoolsConnectionSnapshot) => void
  queries: (queries: DevtoolsQuerySnapshot[]) => void
  auth: (auth: DevtoolsAuthSnapshot) => void
  log: (entry: DevtoolsLogEntry) => void
}

/** The surface the DevTools iframe consumes via `$convexDevtools`. */
export interface ConvexDevtoolsBridge {
  version: 1
  getSnapshot(): DevtoolsSnapshot
  /** Subscribe to an event; returns an unsubscribe function. */
  on<E extends keyof BridgeEvents>(event: E, callback: BridgeEvents[E]): () => void
}

/** Host-side extras the plugin uses; not part of the iframe contract. */
export interface ConvexDevtoolsBridgeHost extends ConvexDevtoolsBridge {
  /** Push the app-level auth state into the bridge (plugin-side). */
  setAuth(auth: DevtoolsAuthSnapshot): void
}
