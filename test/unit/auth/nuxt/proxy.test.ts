import { beforeEach, describe, expect, it, vi } from 'vitest'

// The proxy is three lines; both matter. It must hand the site URL to
// convexAuth's own resolution (private key → public key → env) instead of
// reading one key itself, and it must refuse methods outside the Better Auth
// surface on its own, with or without nuxt-security's route rule in front.

const handler = vi.fn(async () => new Response('ok'))
const convexAuth = vi.fn(() => ({ handler }))
vi.mock('../../../../src/runtime/better-auth/nuxt/server', () => ({ convexAuth }))

const proxy = (await import('../../../../src/runtime/better-auth/nuxt/proxy')).default

const event = (method: string) => ({ method, node: { req: { method } }, context: {} }) as never

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
})
