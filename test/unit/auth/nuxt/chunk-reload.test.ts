// PARITY: D-19
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The client's chunk, loaded on first use (D-18), can be gone when a deploy
// replaced the app's chunks under an open page. The plugin reloads the page
// for a load Nuxt reported as a chunk error, once the server says it serves
// another build; a dropped request on the same build is left to the loader's
// next try, and a load no use asked for reloads on the next navigation.
// Driven with a stubbed `#app` and loader.

const runtimeConfig = { app: { baseURL: '/', buildAssetsDir: '/_nuxt/', cdnURL: '', buildId: 'build-a' } }
const reloadNuxtApp = vi.fn()
vi.mock('#app', () => ({
  defineNuxtPlugin: (plugin: { setup: unknown }) => plugin.setup,
  reloadNuxtApp: (...args: unknown[]) => reloadNuxtApp(...args),
  useRuntimeConfig: () => runtimeConfig,
}))

type Failure = { error: unknown, used: boolean }
let failureListener: ((failure: Failure) => void) | undefined
vi.mock('../../../../src/runtime/better-auth/vue/auth-client-loader', () => ({
  onAuthClientLoadFailure: (listener: (failure: Failure) => void) => {
    failureListener = listener
    return () => {}
  },
}))

const plugin = (await import('../../../../src/runtime/better-auth/nuxt/chunk-reload.client')).default as unknown as
  (nuxtApp: {
    hook: (name: string, fn: (payload: { error: unknown }) => void) => void
    callHook: (name: string, ...args: unknown[]) => Promise<void>
  }) => void

/**
 * Run the plugin; `chunkError` stands in for Nuxt calling `app:chunkError`,
 * `fail` for a load that failed, by default one a use asked for.
 */
function setup() {
  const hooks: Array<(payload: { error: unknown }) => void> = []
  const callHook = vi.fn(async (_name: string, ..._args: unknown[]) => {})
  plugin({ hook: (name, fn) => name === 'app:chunkError' && hooks.push(fn), callHook })
  return {
    chunkError: (error: unknown) => hooks.forEach(hook => hook({ error })),
    fail: (error: unknown, used = true) => failureListener!({ error, used }),
    callHook,
  }
}

/** Answer `builds/latest.json` with `body`, or fail the request. */
function serveLatest(body: unknown, init: { status?: number } = {}) {
  const fetch = vi.fn(async (_url: string, _init?: RequestInit) =>
    body instanceof Error ? Promise.reject(body) : new Response(JSON.stringify(body), { status: init.status ?? 200 }))
  vi.stubGlobal('fetch', fetch)
  return fetch
}

/** Let the plugin's check finish. */
const settle = () => new Promise(resolve => setTimeout(resolve, 0))

beforeEach(() => {
  runtimeConfig.app = { baseURL: '/', buildAssetsDir: '/_nuxt/', cdnURL: '', buildId: 'build-a' }
  failureListener = undefined
})

afterEach(() => {
  reloadNuxtApp.mockClear()
  vi.unstubAllGlobals()
})

describe('chunk-reload plugin', () => {
  it('reloads once a chunk error meets a build the server replaced', async () => {
    const fetch = serveLatest({ id: 'build-b' })
    const { chunkError, fail } = setup()
    const error = new TypeError('Failed to fetch dynamically imported module')

    chunkError(error)
    fail(error)
    await settle()

    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch.mock.calls[0]![0]).toMatch(/^\/_nuxt\/builds\/latest\.json\?\d+$/)
    expect(fetch.mock.calls[0]![1]).toMatchObject({ cache: 'no-store' })
    // `reloadNuxtApp` keeps the `nuxt:reload` guard: no second reload of the same path.
    expect(reloadNuxtApp).toHaveBeenCalledOnce()
    expect(reloadNuxtApp).toHaveBeenCalledWith()
  })

  it('reloads when Nuxt reports the chunk error after the loader heard of it', async () => {
    serveLatest({ id: 'build-b' })
    const { chunkError, fail } = setup()
    const error = new TypeError('Failed to fetch dynamically imported module')

    // The loader's rejection runs first; `app:chunkError` comes a tick later.
    fail(error)
    chunkError(error)
    await settle()

    expect(reloadNuxtApp).toHaveBeenCalledOnce()
  })

  it('leaves a load no use asked for to reload on the next navigation, as Nuxt does for a newer build', async () => {
    serveLatest({ id: 'build-b', timestamp: 1 })
    const { chunkError, fail, callHook } = setup()
    const error = new TypeError('Failed to fetch dynamically imported module')
    chunkError(error)

    // The tab came back into view: the visitor keeps what they left on the page.
    fail(error, false)
    await settle()
    fail(error, false)
    await settle()
    expect(reloadNuxtApp).not.toHaveBeenCalled()
    expect(callHook).toHaveBeenCalledOnce()
    expect(callHook).toHaveBeenCalledWith('app:manifest:update', { id: 'build-b', timestamp: 1 })

    // A use that fails the same way reloads at once.
    fail(error)
    await settle()
    expect(reloadNuxtApp).toHaveBeenCalledOnce()
  })

  it('stays on a page whose build the server still serves: a dropped request the next load recovers', async () => {
    serveLatest({ id: 'build-a' })
    const { chunkError, fail } = setup()
    const error = new TypeError('Failed to fetch dynamically imported module')

    chunkError(error)
    fail(error)
    await settle()

    expect(reloadNuxtApp).not.toHaveBeenCalled()
  })

  it.each([
    ['the request fails', new TypeError('Failed to fetch')],
    ['the manifest is missing', { status: 404 }],
    ['the manifest names no build', {}],
  ])('stays on the page when %s', async (_case, answer) => {
    if (answer instanceof Error) serveLatest(answer)
    else if ('status' in answer) serveLatest({ id: 'build-b' }, answer)
    else serveLatest(answer)
    const { chunkError, fail } = setup()
    const error = new TypeError('Failed to fetch dynamically imported module')

    chunkError(error)
    fail(error)
    await settle()

    expect(reloadNuxtApp).not.toHaveBeenCalled()
  })

  it('leaves a failed load Nuxt did not report as a chunk error alone', async () => {
    serveLatest({ id: 'build-b' })
    const { chunkError, fail } = setup()

    chunkError(new TypeError('another chunk'))
    // A client module that threw as it ran, say.
    fail(new Error('createAuthClient failed'))
    await settle()

    expect(reloadNuxtApp).not.toHaveBeenCalled()
  })

  it('asks the server once while a check is under way', async () => {
    const fetch = serveLatest({ id: 'build-b' })
    const { chunkError, fail } = setup()
    const first = new TypeError('first')
    const second = new TypeError('second')

    chunkError(first)
    chunkError(second)
    fail(first)
    fail(second)
    await settle()

    expect(fetch).toHaveBeenCalledOnce()
    expect(reloadNuxtApp).toHaveBeenCalledOnce()
  })

  it('asks the CDN, under the base URL\'s build assets dir', async () => {
    const fetch = serveLatest({ id: 'build-a' })
    runtimeConfig.app = { baseURL: '/app/', buildAssetsDir: '/assets/', cdnURL: 'https://cdn.example.com/', buildId: 'build-a' }
    const { fail } = setup()
    fail(new TypeError('Failed to fetch dynamically imported module'))
    await settle()
    expect(fetch.mock.calls[0]![0]).toMatch(/^https:\/\/cdn\.example\.com\/assets\/builds\/latest\.json\?\d+$/)

    runtimeConfig.app.cdnURL = ''
    setup().fail(new TypeError('Failed to fetch dynamically imported module'))
    await settle()
    expect(fetch.mock.calls[1]![0]).toMatch(/^\/app\/assets\/builds\/latest\.json\?\d+$/)
  })
})
