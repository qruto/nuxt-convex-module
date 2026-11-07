// PARITY: A-04
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'
import { startConvexStub } from './helpers/convex-stub'

// What hydration.test.ts cannot show: the server read fails, so the failure
// travels in the Nuxt payload and hydration keeps it without fetching again.
// The browser's subscription then succeeds, and the failure has to go with the
// loading state. Only a real render puts it in the payload that way, which
// use-async-query.test.ts has to set up by hand.

const stub = await startConvexStub({ queryValue: 'hello-from-convex', httpQueryError: 'server read failed' })
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

describe('hydration after a failed server read', () => {
  it('renders the failure on the server', async () => {
    const html = await $fetch<string>('/')
    expect(html).toContain('no-data')
    expect(html).toContain('server read failed')
  })

  it('stops reporting the failure once the live query answers', async () => {
    const page = await createPage()
    await page.goto(url('/'), { waitUntil: 'hydration' })

    await expect.poll(() => page.locator('[data-test="async-data"]').textContent()).toContain('hello-from-convex')
    expect(await page.locator('[data-test="async-status"]').textContent()).toContain('success')
    expect(await page.locator('[data-test="async-error"]').textContent()).toContain('no-error')
  })
})
