import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'
import { startConvexStub } from './helpers/convex-stub'

// The headline claim — server-rendered data that stays live — executed in a
// real browser. basic.test.ts reads the SSR HTML and stops at the loading
// state; nothing else in the suite boots the client bundle. This does: the
// page hydrates without a single error, the sync WebSocket opens, and a
// value pushed from the deployment replaces the server-rendered one in the
// DOM with no navigation.

const stub = await startConvexStub({ queryValue: 'hello-from-convex' })
afterAll(() => stub.close())

await setup({
  rootDir: fileURLToPath(new URL('../fixtures/basic', import.meta.url)),
  server: true,
  browser: true,
  nuxtConfig: {
    convex: {
      url: stub.url,
      betterAuth: false,
    },
  },
})

describe('hydration', () => {
  it('boots the client without errors, subscribes, and takes a live update', async () => {
    const page = await createPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
    })
    const socketOpened = new Promise<string>(resolve => page.once('websocket', ws => resolve(ws.url())))

    await page.goto(url('/'), { waitUntil: 'hydration' })

    // The sync client connects to the stub's `/api/<version>/sync`.
    expect(await socketOpened).toMatch(/\/api\/[^/]+\/sync$/)

    // Both queries subscribe; the stub answers each Add with the seeded value —
    // so `useQuery` leaves its SSR loading state, and `useAsyncQuery` keeps
    // showing the value it rendered on the server.
    await expect.poll(() => page.locator('[data-test="live"]').textContent()).toContain('live-ready')
    expect(await page.locator('[data-test="async-data"]').textContent()).toContain('hello-from-convex')
    expect(stub.subscriptions.map(s => s.udfPath).sort()).toEqual(['greetings:get', 'tasks:list'])

    // A later push reaches the DOM without a navigation.
    stub.push('pushed-from-convex')
    await expect.poll(() => page.locator('[data-test="async-data"]').textContent()).toContain('pushed-from-convex')
    expect(await page.locator('[data-test="async-status"]').textContent()).toContain('success')

    expect(errors).toEqual([])
  })
})
