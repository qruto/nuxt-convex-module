// PARITY: D-18
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { createPage, setup, url, useTestContext } from '@nuxt/test-utils/e2e'
import { startConvexStub } from './helpers/convex-stub'

// Upstream's provider takes a client the app built at import, so every page
// carries Better Auth. Here the client loads on first use: a visitor the
// server found no session for downloads it only once something calls it, and
// a signed-in visitor gets it at startup, off the entry chunk.

const stub = await startConvexStub({ sessions: true })
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

// Better Auth's client: the key its session store is kept under. (Not
// `$sessionSignal`, which the loader names too.)
const BETTER_AUTH = /better-auth:session:/

/** Where the build serves its chunks: `app.buildAssetsDir`, `/_nuxt/` unless the fixture moves it. */
const assetsDir = () => useTestContext().nuxt!.options.app.buildAssetsDir

/** A page that records which of the scripts it loaded carry Better Auth, and any page error. */
async function open(options: { signedIn?: boolean } = {}) {
  const page = await createPage()
  const reads: Promise<void>[] = []
  const betterAuthChunks: string[] = []
  const errors: string[] = []
  const sessionRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/api/auth/get-session')) sessionRequests.push(request.url())
  })
  page.on('response', (response) => {
    const address = response.url()
    if (!new URL(address).pathname.startsWith(assetsDir()) || !address.endsWith('.js')) return
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
  return { page, betterAuthChunks, errors, sessionRequests, settled }
}

describe('the Better Auth client, loaded on first use', () => {
  it('stays out of a signed-out visit that never calls it, which still settles signed out', async () => {
    const { page, betterAuthChunks, errors, settled } = await open()

    await page.goto(url('/'), { waitUntil: 'hydration' })
    await page.locator('[data-test="auth"]', { hasText: 'signed-out' }).waitFor()
    await settled()

    expect(betterAuthChunks).toEqual([])
    expect(errors).toEqual([])

    // The same detector, in the same run, sees the chunk once something
    // loads it: the empty list above is an absence, not a blind spot.
    await page.goto(url('/account'), { waitUntil: 'hydration' })
    const signOut = page.waitForRequest(request => request.url().endsWith('/api/auth/sign-out'))
    await page.getByRole('button', { name: 'Sign out' }).click()
    await signOut
    await settled()
    expect(betterAuthChunks).toHaveLength(1)
  })

  // A failed chunk request is asked for again in the same document, with no
  // reload: the browser must not keep the failure for the module.
  it('loads the client after its chunk failed once, in the same document', async () => {
    const { page, betterAuthChunks, settled } = await open()
    let failed = ''
    await page.route(`**${assetsDir()}**/*.js`, async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (!failed && BETTER_AUTH.test(body)) {
        failed = route.request().url()
        return route.abort('failed')
      }
      return route.fulfill({ response, body })
    })
    await page.goto(url('/account'), { waitUntil: 'hydration' })
    await settled()

    // The first use fails: the chunk request is cut.
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect.poll(() => failed).not.toBe('')
    // The next use, same page, loads it and makes the call.
    const signOut = page.waitForRequest(request => request.url().endsWith('/api/auth/sign-out'))
    await page.getByRole('button', { name: 'Sign out' }).click()
    await signOut
    await settled()
    expect(betterAuthChunks).toEqual([failed])
  })

  // PARITY: D-19 — a deploy replaced the chunks under the open page: the
  // client's chunk is a 404 for good, and the server serves another build.
  async function afterDeploy(page: Awaited<ReturnType<typeof open>>['page']) {
    await page.route(`**${assetsDir()}**/*.js`, async (route) => {
      const response = await route.fetch()
      const body = await response.text()
      if (BETTER_AUTH.test(body)) return route.fulfill({ status: 404, body: 'Not Found' })
      return route.fulfill({ response, body })
    })
    await page.route(`**${assetsDir()}builds/latest.json*`, route =>
      route.fulfill({ json: { id: 'the-next-build', timestamp: Date.now() } }))
  }

  it('reloads the page once when a deploy removed the client chunk, and not again', async () => {
    const { page } = await open()
    await afterDeploy(page)
    await page.goto(url('/account'), { waitUntil: 'hydration' })
    const loads: string[] = []
    page.on('load', () => loads.push(page.url()))

    // The first use fails, and the server names another build: the page reloads.
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect.poll(() => loads.length).toBe(1)
    await page.waitForFunction(() => (window as { useNuxtApp?: () => { isHydrating?: boolean } }).useNuxtApp?.().isHydrating === false)
    expect(await page.evaluate(() => sessionStorage.getItem('nuxt:reload'))).toContain('/account')

    // Still a 404 after the reload: Nuxt's `nuxt:reload` guard holds it at one.
    const latest = page.waitForRequest(request => request.url().includes('/builds/latest.json'))
    await page.getByRole('button', { name: 'Sign out' }).click()
    await latest
    await page.waitForTimeout(500)
    expect(loads).toHaveLength(1)
  })

  it('waits for the next navigation to reload when only the tab coming back asked for the client', async () => {
    const { page } = await open()
    await afterDeploy(page)
    // Signed out: the load waits until the tab comes back into view.
    await page.goto(url('/'), { waitUntil: 'hydration' })
    await page.locator('[data-test="auth"]', { hasText: 'signed-out' }).waitFor()
    const loads: string[] = []
    page.on('load', () => loads.push(page.url()))

    // The load fails on a newer build, and the visitor keeps the page.
    const latest = page.waitForRequest(request => request.url().includes('/builds/latest.json'))
    await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange')))
    await latest
    await page.waitForTimeout(500)
    expect(loads).toEqual([])

    // Nuxt reloads on the next navigation, onto the page asked for.
    await page.evaluate(() => (window as { useNuxtApp?: () => { $router: { push: (to: string) => unknown } } }).useNuxtApp!().$router.push('/account'))
    await expect.poll(() => loads).toEqual([url('/account')])
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

  // A sign-in page that imports `authClient` statically: no call goes
  // through the loader, and the session must still follow the client.
  it('follows a statically imported client through a sign-in to a guarded page', async () => {
    const { page, errors } = await open()
    await page.goto(url('/login'), { waitUntil: 'hydration' })
    await page.locator('[data-test="auth"]', { hasText: 'signed-out' }).waitFor()

    await page.getByRole('button', { name: 'Sign in' }).click()
    await page.locator('[data-test="auth"]', { hasText: 'signed-in' }).waitFor()
    await page.getByRole('link', { name: 'Dashboard' }).click()

    await page.getByRole('heading', { name: 'Dashboard' }).waitFor()
    expect(new URL(page.url()).pathname).toBe('/dashboard')
    expect(errors.filter(error => !error.includes('Invalid start version'))).toEqual([])
  })

  // Nuxt folds `swr`/`isr`/`cache` into `payload` in the rules `#app` sees;
  // the server plugin reads Nitro's own, so a render served to everyone never
  // tells a browser there is no session.
  it('loads at startup on an swr page, whose render other visitors are served', async () => {
    const { page, betterAuthChunks, errors, settled } = await open()

    await page.goto(url('/cached'), { waitUntil: 'hydration' })
    await page.locator('[data-test="auth"]', { hasText: 'signed-out' }).waitFor()
    await settled()

    expect(betterAuthChunks).toHaveLength(1)
    expect(errors).toEqual([])
  })

  // A `<NuxtLink>` to a page that imports `authClient` statically prefetches
  // that page's chunk on focus, which runs the client module. The client is
  // kept, not used: no session request until something uses it.
  it('asks nothing of the server when a link prefetches a page that imports the client', async () => {
    const { page, betterAuthChunks, errors, sessionRequests, settled } = await open()

    await page.goto(url('/links'), { waitUntil: 'hydration' })
    await page.locator('[data-test="auth"]', { hasText: 'signed-out' }).waitFor()
    // Focus, not hover: hover waits for the link to hold still across
    // animation frames, and focus needs no frame.
    await page.getByRole('link', { name: 'Sign in' }).focus()
    await expect.poll(async () => {
      await settled()
      return betterAuthChunks.length
    }, { timeout: 15_000 }).toBe(1)

    // The prefetch fetched (and ran) the sign-in page, with Better Auth in it.
    expect(sessionRequests).toEqual([])
    expect(errors).toEqual([])
  })

  it('loads at startup for a signed-in visitor, off the entry chunk', async () => {
    const { page, betterAuthChunks, errors, settled } = await open({ signedIn: true })

    await page.goto(url('/'), { waitUntil: 'hydration' })
    await settled()

    expect(await page.locator('[data-test="auth"]').textContent()).toContain('signed-in')
    expect(betterAuthChunks).toHaveLength(1)
    const entry = await page.locator(`script[type="module"][src*="${assetsDir()}"]`).first().getAttribute('src')
    expect(betterAuthChunks[0]).not.toContain(entry)
    // The stub answers every transition at identity version 0; a client that
    // authenticated expects 1. That mismatch is the stub's, not the page's.
    expect(errors.filter(error => !error.includes('Invalid start version'))).toEqual([])
  })
})
