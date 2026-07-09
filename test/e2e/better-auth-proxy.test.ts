import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'
import { startConvexStub } from './helpers/convex-stub'

// Full build + serve of the `better-auth` fixture: the `/api/auth/**`
// same-origin proxy (runtime/better-auth/nuxt/proxy.ts) forwarding requests
// to the Convex site URL and relaying responses back.

const stub = await startConvexStub()
afterAll(() => stub.close())

await setup({
  rootDir: fileURLToPath(new URL('../fixtures/better-auth', import.meta.url)),
  server: true,
  nuxtConfig: {
    convex: {
      url: stub.url,
      siteUrl: stub.url,
    },
  },
})

describe('better-auth proxy', () => {
  it('forwards a GET to the site URL with forwarding headers and relays the response', async () => {
    stub.requests.length = 0
    const response = await fetch('/api/auth/get-session', {
      headers: { cookie: 'session=xyz' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ echoed: '/api/auth/get-session' })
    // Upstream Set-Cookie (auth session) is relayed to the browser.
    expect(response.headers.get('set-cookie')).toContain('stub-session=abc')

    const forwarded = stub.requests.find(r => r.url === '/api/auth/get-session')
    expect(forwarded).toBeDefined()
    expect(forwarded!.method).toBe('GET')
    // Auth cookies ride through; Better Auth forwarding headers are stamped.
    expect(forwarded!.headers.cookie).toBe('session=xyz')
    expect(forwarded!.headers['x-better-auth-forwarded-proto']).toBe('http')
    expect(forwarded!.headers['x-forwarded-host']).toBeTruthy()
  })

  it('forwards a POST body verbatim', async () => {
    stub.requests.length = 0
    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    })

    expect(response.status).toBe(200)
    const forwarded = stub.requests.find(r => r.url === '/api/auth/sign-in/email')
    expect(forwarded).toBeDefined()
    expect(forwarded!.method).toBe('POST')
    expect(JSON.parse(forwarded!.body)).toEqual({ email: 'test@example.com' })
  })
})
