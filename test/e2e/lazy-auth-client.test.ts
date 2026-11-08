// PARITY: D-18
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'
import { startConvexStub } from './helpers/convex-stub'

// Upstream's provider takes a client the app built at import, so every page
// carries Better Auth. Here the client loads on first use: a visitor the
// server found no session for downloads it only once something calls it, and
// a signed-in visitor gets it at startup, off the entry chunk.

const stub = await startConvexStub()
afterAll(() => stub.close())

await setup({
  rootDir: fileURLToPath(new URL('../fixtures/lazy-auth', import.meta.url)),
  server: true,
  browser: true,
  nuxtConfig: {
    convex: {
      url: stub.url,
      siteUrl: stub.url,
    },
  },
})

// Better Auth's client: the session signal its store refetches on.
const BETTER_AUTH = /\$sessionSignal/

/** A page that records which of the scripts it loaded carry Better Auth, and any page error. */
async function open(options: { signedIn?: boolean } = {}) {
  const page = await createPage()
  const reads: Promise<void>[] = []
  const betterAuthChunks: string[] = []
  const errors: string[] = []
  page.on('response', (response) => {
    const address = response.url()
    if (!address.includes('/_nuxt/') || !address.endsWith('.js')) return
    reads.push(response.text().then((body) => {
      if (BETTER_AUTH.test(body)) betterAuthChunks.push(address)
    }, () => {}))
  })
  page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })
  if (options.signedIn) await page.context().addCookies([{ name: 'stub-session', value: 'abc', url: url('/') }])
  const settled = async () => {
    await page.waitForLoadState('networkidle')
    await Promise.all(reads)
  }
  return { page, betterAuthChunks, errors, settled }
}

describe('the Better Auth client, loaded on first use', () => {
  it('stays out of a signed-out visit that never calls it, which still settles signed out', async () => {
    const { page, betterAuthChunks, errors, settled } = await open()

    await page.goto(url('/'), { waitUntil: 'hydration' })
    await page.locator('[data-test="auth"]', { hasText: 'signed-out' }).waitFor()
    await settled()

    expect(betterAuthChunks).toEqual([])
    expect(errors).toEqual([])
  })

  it('loads on the first call through useBetterAuth().client', async () => {
    const { page, betterAuthChunks, settled } = await open()
    await page.goto(url('/account'), { waitUntil: 'hydration' })
    await settled()
    expect(betterAuthChunks).toEqual([])

    const signOut = page.waitForRequest(request => request.url().endsWith('/api/auth/sign-out'))
    await page.getByRole('button', { name: 'Sign out' }).click()
    await signOut
    await settled()

    expect(betterAuthChunks).toHaveLength(1)
  })

  it('loads at startup for a signed-in visitor, off the entry chunk', async () => {
    const { page, betterAuthChunks, errors, settled } = await open({ signedIn: true })

    await page.goto(url('/'), { waitUntil: 'hydration' })
    await settled()

    expect(await page.locator('[data-test="auth"]').textContent()).toContain('signed-in')
    expect(betterAuthChunks).toHaveLength(1)
    const entry = await page.locator('script[type="module"][src*="/_nuxt/"]').first().getAttribute('src')
    expect(betterAuthChunks[0]).not.toContain(entry)
    // The stub answers every transition at identity version 0; a client that
    // authenticated expects 1. That mismatch is the stub's, not the page's.
    expect(errors.filter(error => !error.includes('Invalid start version'))).toEqual([])
  })
})
