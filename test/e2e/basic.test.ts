import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { setup, $fetch, fetch } from '@nuxt/test-utils/e2e'
import { startConvexStub } from './helpers/convex-stub'

// Full build + serve of the `basic` fixture (base client path, no auth
// integration): module setup(), auto-imports, SSR behavior of useQuery vs
// useAsyncQuery, Nitro server auto-imports, and the Convex-aware CSP.

const stub = await startConvexStub({ queryValue: 'hello-from-convex' })
afterAll(() => stub.close())

await setup({
  rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
  server: true,
  nuxtConfig: {
    convex: {
      url: stub.url,
      betterAuth: false,
    },
  },
})

describe('basic fixture', () => {
  it('builds and server-renders a page through the module', async () => {
    const html = await $fetch('/')
    expect(html).toContain('<h1>basic</h1>')
  })

  it('auto-imports resolve: useQuery renders its SSR loading state', async () => {
    const html = await $fetch('/')
    // Plain `useQuery` must render undefined during SSR (no server WebSocket,
    // no data) — the client subscribes after hydration.
    expect(html).toContain('live-loading')
  })

  it('useAsyncQuery embeds server-fetched data in the SSR HTML', async () => {
    stub.requests.length = 0
    const html = await $fetch('/')
    expect(html).toContain('hello-from-convex')
    expect(html).toContain('success')
    // The data came over HTTP from the (stub) deployment during SSR.
    const queryCalls = stub.requests.filter(r => r.url === '/api/query')
    expect(queryCalls.length).toBeGreaterThan(0)
    expect(queryCalls[0]!.body).toContain('greetings')
  })

  it('serves the Nitro auto-imported fetchQuery from a server route', async () => {
    const result = await $fetch<{ value: string }>('/api/greeting')
    expect(result.value).toBe('hello-from-convex')
  })

  it('applies the Convex-aware CSP in production', async () => {
    const response = await fetch('/')
    const csp = response.headers.get('content-security-policy')
    expect(csp).toBeTruthy()
    const host = new URL(stub.url).host
    // connect-src carries the deployment origin plus its WebSocket form.
    expect(csp).toContain(`http://${host}`)
    expect(csp).toContain(`ws://${host}`)
  })
})
