// PARITY: A-14
import { beforeEach, describe, expect, it, vi } from 'vitest'

// The proxy is three lines; both matter. It must hand the site URL to
// convexAuth's own resolution (private key → public key → env) instead of
// reading one key itself, and it must refuse methods outside the Better Auth
// surface on its own, with or without nuxt-security's route rule in front.

const handler = vi.fn(async () => new Response('ok'))
const convexAuth = vi.fn(() => ({ handler }))
vi.mock('../../../../src/runtime/better-auth/nuxt/server', () => ({ convexAuth }))

const proxy = (await import('../../../../src/runtime/better-auth/nuxt/proxy')).default

// The `nuxt/server` event: a web Request, which normalises its URL, and the
// router's `**` match, which Nitro 2 takes from the raw path.
const event = (method: string, path = '/api/auth/get-session') => ({
  req: new Request(`https://app.test${path}`, { method }),
  context: { params: { _: path.replace(/^\/api\/auth\//, '').split('?')[0] } },
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
    await expect(proxy(event(method))).rejects.toMatchObject({ status: 405 })
    expect(convexAuth).not.toHaveBeenCalled()
  })

  // Nitro 2 routes the raw path and the handler forwards the normalised one, so a
  // dot-segment path that matches /api/auth/** would be sent to the site
  // origin as /secret — any HTTP action on the deployment, through this app.
  it.each(['/api/auth/../../secret', '/api/auth/%2e%2e/%2e%2e/secret', '/api/auth/..%5c..%5csecret', '/api/auth/./get-session'])('%s is refused with 400', async (path) => {
    await expect(proxy(event('GET', path))).rejects.toMatchObject({ status: 400 })
    expect(convexAuth).not.toHaveBeenCalled()
  })

  it('forwards a path that normalisation leaves alone, query included', async () => {
    await proxy(event('GET', '/api/auth/callback/github?code=abc&state=x%2Fy'))
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
