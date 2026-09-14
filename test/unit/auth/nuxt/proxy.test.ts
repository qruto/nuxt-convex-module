// PARITY: A-14
import { Readable } from 'node:stream'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The proxy is three lines; both matter. It must hand the site URL to
// convexAuth's own resolution (private key → public key → env) instead of
// reading one key itself, and it must refuse methods outside the Better Auth
// surface on its own, with or without nuxt-security's route rule in front.

const handler = vi.fn(async () => new Response('ok'))
const convexAuth = vi.fn(() => ({ handler }))
vi.mock('../../../../src/runtime/better-auth/nuxt/server', () => ({ convexAuth }))

const proxy = (await import('../../../../src/runtime/better-auth/nuxt/proxy')).default

// Enough of an H3Event for assertMethod, event.path, and toWebRequest (which
// reads the body as a stream for anything but GET/HEAD).
const event = (method: string, path = '/api/auth/get-session') => ({
  method,
  path,
  context: {},
  headers: new Headers({ host: 'app.test' }),
  node: {
    req: Object.assign(Readable.from([]), { method, url: path, headers: { host: 'app.test' } }),
    res: {},
  },
}) as never

describe('auth proxy handler', () => {
  beforeEach(() => {
    convexAuth.mockClear()
    handler.mockClear()
  })

  it.each(['GET', 'HEAD', 'POST', 'OPTIONS'])('%s is forwarded through convexAuth with no site-URL override', async (method) => {
    await proxy(event(method))
    expect(convexAuth).toHaveBeenCalledTimes(1)
    expect(convexAuth.mock.calls[0]).toEqual([expect.anything()])
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it.each(['PUT', 'DELETE', 'PATCH'])('%s is refused with 405 before reaching the deployment', async (method) => {
    await expect(proxy(event(method))).rejects.toMatchObject({ statusCode: 405 })
    expect(convexAuth).not.toHaveBeenCalled()
  })

  // h3 routes the raw path and the handler forwards the normalised one, so a
  // dot-segment path that matches /api/auth/** would be sent to the site
  // origin as /secret — any HTTP action on the deployment, through this app.
  it.each(['/api/auth/../../secret', '/api/auth/%2e%2e/%2e%2e/secret', '/api/auth/./get-session'])('%s is refused with 400', async (path) => {
    await expect(proxy(event('GET', path))).rejects.toMatchObject({ statusCode: 400 })
    expect(convexAuth).not.toHaveBeenCalled()
  })

  it('forwards a path that normalisation leaves alone, query included', async () => {
    await proxy(event('GET', '/api/auth/callback/github?code=abc&state=x%2Fy'))
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
