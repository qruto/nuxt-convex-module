import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

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
  close: () => Promise<void>
}

/**
 * A minimal Convex deployment stand-in for e2e tests. Answers the HTTP client's
 * `POST /api/query` with a canned successful result and echoes everything
 * else as JSON, recording each request for assertions.
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

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolve({
        url: `http://127.0.0.1:${port}`,
        requests,
        close: () => new Promise((done, fail) =>
          server.close(error => (error ? fail(error) : done())),
        ),
      })
    })
  })
}
