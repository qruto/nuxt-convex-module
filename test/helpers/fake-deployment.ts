import { encodeU64LE, type ClientMessage, type InMemoryWebSocketTest } from './in_memory_web_socket'

type Socket = Parameters<InMemoryWebSocketTest>[0]
type Subscription = { queryId: number, udfPath: string }

/** The `sub` claim of an unsigned test token. */
const subjectOf = (token: string): string =>
  JSON.parse(Buffer.from(token.split('.')[1]!, 'base64url').toString()).sub

/**
 * The part of a deployment auth depends on, behind {@link withInMemoryWebSocket}:
 * every `Authenticate` re-runs the subscribed queries as the new identity, and
 * a query with no identity fails, as a query that needs a user does.
 *
 * `frames` is what reached the server, in order: `Authenticate(user-1)`,
 * `Authenticate(None)`, `+path` and `-path`. `runs` is every query execution,
 * and `tokens` every token received.
 */
export function serveQueries({ receive, send, close }: Socket) {
  const frames: string[] = []
  const runs: Array<{ path: string, as: string | null }> = []
  const tokens: string[] = []
  const queries = new Map<number, Subscription>()
  let version = { querySet: 0, identity: 0, ts: 0 }
  let identity: string | null = null
  let connections = 0

  const wire = (state: typeof version) => ({ ...state, ts: encodeU64LE(state.ts) })
  const run = ({ queryId, udfPath }: Subscription) => {
    runs.push({ path: udfPath, as: identity })
    return identity === null
      ? { type: 'QueryFailed', queryId, errorMessage: `${udfPath}: sign in first.`, logLines: [], journal: null }
      : { type: 'QueryUpdated', queryId, value: null, logLines: [], journal: null }
  }

  function handle(message: ClientMessage) {
    const next = { ...version, ts: version.ts + 1 }
    const modifications: unknown[] = []
    if (message.type === 'Connect') {
      connections++
      queries.clear()
      version = { querySet: 0, identity: 0, ts: 0 }
      identity = null
      return
    }
    if (message.type === 'Authenticate') {
      const { value, baseVersion } = message as { value?: string, baseVersion: number }
      identity = value ? subjectOf(value) : null
      if (value) tokens.push(value)
      next.identity = baseVersion + 1
      frames.push(`Authenticate(${identity ?? 'None'})`)
      modifications.push(...[...queries.values()].map(run))
    }
    else if (message.type === 'ModifyQuerySet') {
      const { newVersion, modifications: changes } = message as Extract<ClientMessage, { type: 'ModifyQuerySet' }>
      next.querySet = newVersion
      for (const { type, queryId, udfPath } of changes) {
        if (type === 'Add') {
          const query = { queryId, udfPath: udfPath! }
          queries.set(queryId, query)
          frames.push(`+${query.udfPath}`)
          modifications.push(run(query))
        }
        else {
          frames.push(`-${queries.get(queryId)?.udfPath}`)
          queries.delete(queryId)
          modifications.push({ type: 'QueryRemoved', queryId })
        }
      }
    }
    else {
      return
    }
    send({ type: 'Transition', startVersion: wire(version), endVersion: wire(next), modifications })
    version = next
  }

  void (async () => {
    for (;;) handle(await receive())
  })()

  return {
    frames,
    runs,
    tokens,
    /** The queries that ran with nobody signed in. */
    signedOutRuns: () => runs.filter(entry => entry.as === null),
    connections: () => connections,
    identity: () => identity,
    subscribed: () => queries.size,
    /** Reject the current token and hang up, as a deployment does at its expiry. */
    expireToken() {
      send({ type: 'AuthError', error: 'token expired', baseVersion: version.identity, authUpdateAttempted: false })
      close()
    },
  }
}
