// PARITY: D-13
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { $fetch, createPage, setup, url } from '@nuxt/test-utils/e2e'
import { startConvexStub } from './helpers/convex-stub'

// Upstream's `ConvexBetterAuthProvider` keeps the prefetched `initialToken` in
// per-render React state, so a signed-in visitor's server render already reads
// authenticated. The server render here must do the same, for that visitor
// alone, and the browser must hydrate it without a mismatch.

const stub = await startConvexStub()
afterAll(() => stub.close())

await setup({
  rootDir: fileURLToPath(new URL('../fixtures/better-auth', import.meta.url)),
  server: true,
  browser: true,
  nuxtConfig: {
    convex: {
      url: stub.url,
      siteUrl: stub.url,
    },
  },
})

const SIGNED_IN = { cookie: 'stub-session=abc' }

/** The auth line of a server render. */
async function renderedAuth(headers: Record<string, string> = {}): Promise<string> {
  const html = await $fetch<string>('/', { headers })
  return html.match(/data-test="auth"[^>]*>\s*([\w-]+)\s*</)?.[1] ?? 'missing'
}

describe('server-rendered auth state', () => {
  it('renders a signed-in visitor as signed in', async () => {
    expect(await renderedAuth(SIGNED_IN)).toBe('signed-in')
  })

  it('keeps each request to its own visitor', async () => {
    // Interleaved, then at once: no visitor's state reaches another's render.
    expect(await renderedAuth()).toBe('loading')
    expect(await renderedAuth(SIGNED_IN)).toBe('signed-in')
    expect(await renderedAuth()).toBe('loading')
    const together = await Promise.all([
      renderedAuth(SIGNED_IN),
      renderedAuth(),
      renderedAuth(SIGNED_IN),
      renderedAuth(),
    ])
    expect(together).toEqual(['signed-in', 'loading', 'signed-in', 'loading'])
  })

  it('hydrates a signed-in render without a mismatch', async () => {
    const page = await createPage()
    const errors: string[] = []
    page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
    })
    await page.context().addCookies([{ name: 'stub-session', value: 'abc', url: url('/') }])

    await page.goto(url('/'), { waitUntil: 'hydration' })

    expect(await page.locator('[data-test="auth"]').textContent()).toContain('signed-in')
    expect(errors).toEqual([])
  })
})
