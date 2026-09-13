import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { WebSocketServer, type WebSocket } from 'ws'
import { encodeU64LE, type ClientMessage } from '../../helpers/in_memory_web_socket'

export interface RecordedRequest {
  method: string
  url: string
  headers: IncomingMessage['headers']
  body: string
}

export interface ConvexStub {
  /** Base URL of the stub, e.g. `http://127.0.0.1:52341`. */
  url: string
  /** Every request the stub received, in order. */
  requests: RecordedRequest[]
  /** Every WebSocket subscription the sync client added, in order. */
  subscriptions: Array<{ queryId: number, udfPath: string }>
  /** Push a new value to every live subscription, as a Convex `Transition`. */
  push: (value: unknown) => void
  close: () => Promise<void>
}

/**
 * A minimal Convex deployment stand-in for e2e tests. Answers the HTTP client's
 * `POST /api/query` with a canned successful result and echoes everything
 * else as JSON, recording each request for assertions.
 *
 * It also speaks enough of the sync protocol on `/api/<version>/sync` for a
 * browser to hydrate and go live: every `Add` in a `ModifyQuerySet` is
 * answered with a `Transition` carrying the query value, and `push()` sends
 * a later `Transition` to every subscription. Versions are tracked the way
 * the client checks them — `startVersion` must equal the client's current
 * `{ querySet, identity, ts }` exactly, or `RemoteQuerySet.transition`
 * throws — so `ts` advances by one per transition and `querySet` follows the
 * client's `newVersion`.
 */
export function startConvexStub(options: { queryValue?: unknown } = {}): Promise<ConvexStub> {
  const requests: RecordedRequest[] = []

  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', chunk => chunks.push(chunk))
    req.on('end', () => {
      requests.push({
        method: req.method ?? '',
        url: req.url ?? '',
        headers: req.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      })

      if (req.url === '/api/query') {
        // The shape `ConvexHttpClient` expects: { status, value, logLines }.
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({
          status: 'success',
          value: options.queryValue ?? 'stub-value',
          logLines: [],
        }))
        return
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        // The proxy must relay upstream cookies (auth sessions) verbatim.
        'Set-Cookie': 'stub-session=abc; Path=/; HttpOnly',
      })
      res.end(JSON.stringify({ echoed: req.url }))
    })
  })

  // --- sync protocol ---------------------------------------------------------
  const subscriptions: ConvexStub['subscriptions'] = []
  const sockets = new Set<WebSocket>()
  let querySet = 0
  let ts = 0
  const version = (n: number) => ({ querySet, identity: 0, ts: encodeU64LE(n) })
  const transition = (socket: WebSocket, queries: ConvexStub['subscriptions'], value: unknown, newQuerySet = querySet) => {
    const startVersion = version(ts)
    querySet = newQuerySet
    ts += 1
    socket.send(JSON.stringify({
      type: 'Transition',
      startVersion,
      endVersion: version(ts),
      modifications: queries.map(({ queryId }) => ({ type: 'QueryUpdated', queryId, value, logLines: [], journal: null })),
    }))
  }

  const wss = new WebSocketServer({ noServer: true })
  wss.on('connection', (socket) => {
    sockets.add(socket)
    socket.on('close', () => sockets.delete(socket))
    socket.on('message', (raw) => {
      const message = JSON.parse(raw.toString()) as ClientMessage
      if (message.type !== 'ModifyQuerySet') return
      const modify = message as Extract<ClientMessage, { type: 'ModifyQuerySet' }>
      const added = modify.modifications
        .filter(m => m.type === 'Add')
        .map(m => ({ queryId: m.queryId, udfPath: m.udfPath ?? '' }))
      subscriptions.push(...added)
      transition(socket, added, options.queryValue ?? 'stub-value', modify.newVersion)
    })
  })
  server.on('upgrade', (req, socket, head) => {
    if (!/^\/api\/[^/]+\/sync$/.test(req.url ?? '')) return socket.destroy()
    wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req))
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolve({
        url: `http://127.0.0.1:${port}`,
        requests,
        subscriptions,
        push: (value) => {
          for (const socket of sockets) transition(socket, subscriptions, value)
        },
        close: async () => {
          for (const socket of sockets) socket.terminate()
          wss.close()
          await new Promise<void>((done, fail) => server.close(error => (error ? fail(error) : done())))
        },
      })
    })
  })
}
