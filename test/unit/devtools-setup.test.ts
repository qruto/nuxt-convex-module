// PARITY: A-15
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DevtoolsServerInfo } from '../../src/devtools/rpc-types'
import { DEVTOOLS_DOCK_PARAM, DEVTOOLS_UI_ROUTE, RPC_NAMESPACE } from '../../src/devtools/rpc-types'

type PanelHandler = { route: string, handler: { nuxt: (event: { req: Request }) => Promise<Response> } }
const addDevServerHandler = vi.fn<(input: PanelHandler) => void>()
vi.mock('@nuxt/kit', () => ({
  addDevServerHandler,
  runWithNuxtContext: (_nuxt: unknown, fn: () => unknown) => fn(),
}))

const { setupDevtools } = await import('../../src/devtools/index')

const base = mkdtempSync(join(tmpdir(), 'convex-devtools-'))
afterAll(() => rmSync(base, { recursive: true, force: true }))
// The stub build carries the runtime as `.ts`; the dock imports it by file name.
const dockClient = join(base, 'stub-build', 'runtime', 'devtools', 'dock-client.ts')
mkdirSync(join(dockClient, '..'), { recursive: true })
writeFileSync(dockClient, 'export default () => {}')
beforeEach(() => addDevServerHandler.mockClear())

function fakeEnv(resolverBase: string, baseURL = '/') {
  const hooks = new Map<string, (arg?: unknown) => unknown>()
  const nuxt = {
    hook: vi.fn((name: string, fn: (arg?: unknown) => unknown) => hooks.set(name, fn)),
    devtools: { extendServerRpc: vi.fn() },
    options: { app: { baseURL, buildAssetsDir: '/_nuxt/' } },
  }
  const resolver = { resolve: (path: string) => join(resolverBase, path) }
  return { hooks, nuxt, resolver }
}

// Placeholder info object — nothing connects to it; the test only asserts it
// flows through `getInfo()` by identity. `example.convex.cloud` is a reserved
// example host (RFC 2606), not a real deployment.
const info: DevtoolsServerInfo = {
  url: 'https://example.convex.cloud',
  siteUrl: '',
  rootDir: base,
  functionsDir: 'convex',
  integrations: { betterAuth: false, clerk: false, auth0: false, polar: false, security: false },
}

const v3 = { version: '3.4.4', packagePath: '' }

describe('setupDevtools', () => {
  it('serves the prebuilt panel from dist/devtools-client', async () => {
    const withClient = join(base, 'with-client')
    mkdirSync(join(withClient, 'devtools-client', '_nuxt'), { recursive: true })
    writeFileSync(join(withClient, 'devtools-client', 'index.html'), '<!doctype html><title>panel</title>')
    writeFileSync(join(withClient, 'devtools-client', '_nuxt', 'entry.js'), 'export {}')
    writeFileSync(join(withClient, 'secret.txt'), 'outside the panel')
    const { nuxt, resolver } = fakeEnv(withClient)

    setupDevtools(resolver as never, nuxt as never, info)

    expect(addDevServerHandler).toHaveBeenCalledTimes(1)
    const { route, handler } = addDevServerHandler.mock.calls[0]![0]
    expect(route).toBe(`${DEVTOOLS_UI_ROUTE}/**`)
    const get = (path: string, method = 'GET') =>
      handler.nuxt({ req: new Request(`http://localhost:3000${path}`, { method }) })

    const page = await get(`${DEVTOOLS_UI_ROUTE}/`)
    expect(page.status).toBe(200)
    expect(page.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(page.headers.get('cache-control')).toBe('no-store')
    expect(await page.text()).toContain('<title>panel</title>')
    const asset = await get(`${DEVTOOLS_UI_ROUTE}/_nuxt/entry.js`)
    expect([asset.status, asset.headers.get('content-type')]).toEqual([200, 'text/javascript; charset=utf-8'])
    expect((await get(`${DEVTOOLS_UI_ROUTE}/missing.js`)).status).toBe(404)
    expect((await get(`${DEVTOOLS_UI_ROUTE}/`, 'POST')).status).toBe(405)
    // A path that climbs out of the panel folder is refused, not read. The URL
    // parser folds a plain `..`, so it arrives with an encoded slash.
    const escape = await get(`${DEVTOOLS_UI_ROUTE}/..%2fsecret.txt`)
    expect(escape.status).toBe(404)
    expect(await escape.text()).not.toContain('outside the panel')
  })

  it('proxies the panel to the local dev server when the built client is absent', () => {
    const { hooks, nuxt, resolver } = fakeEnv(join(base, 'stub-build'))

    setupDevtools(resolver as never, nuxt as never, info)

    expect(addDevServerHandler).not.toHaveBeenCalled()
    expect(hooks.has('vite:extendConfig')).toBe(true)
    const viteConfig: { server?: { proxy?: Record<string, unknown> } } = {}
    hooks.get('vite:extendConfig')!(viteConfig)
    expect(viteConfig.server?.proxy?.[DEVTOOLS_UI_ROUTE]).toMatchObject({
      changeOrigin: true,
    })
  })

  it('strips the devtools route prefix in the proxy rewrite', () => {
    const { hooks, nuxt, resolver } = fakeEnv(join(base, 'stub-build'))

    setupDevtools(resolver as never, nuxt as never, info)

    const viteConfig: {
      server?: { proxy?: Record<string, { rewrite?: (path: string) => string }> }
    } = {}
    hooks.get('vite:extendConfig')!(viteConfig)

    const rewrite = viteConfig.server!.proxy![DEVTOOLS_UI_ROUTE]!.rewrite!
    expect(rewrite(`${DEVTOOLS_UI_ROUTE}/foo`)).toBe('/foo')
  })

  it('delegates the resolveFunctionSource RPC to the functions-dir lookup', () => {
    const projectRoot = join(base, 'rpc-project')
    mkdirSync(join(projectRoot, 'convex'), { recursive: true })
    writeFileSync(join(projectRoot, 'convex', 'messages.ts'), '')
    const { hooks, nuxt, resolver } = fakeEnv(join(base, 'stub-build'))

    setupDevtools(resolver as never, nuxt as never, { ...info, rootDir: projectRoot })
    hooks.get('devtools:initialized')!(v3)

    const rpc = nuxt.devtools.extendServerRpc.mock.calls[0]![1] as {
      resolveFunctionSource: (udfPath: string) => { filepath?: string }
    }
    expect(rpc.resolveFunctionSource('messages:list'))
      .toEqual({ filepath: join(projectRoot, 'convex', 'messages.ts') })
    expect(rpc.resolveFunctionSource('missing:list')).toEqual({})
  })

  it('registers the iframe tab and the server RPC on DevTools 3', () => {
    const { hooks, nuxt, resolver } = fakeEnv(join(base, 'stub-build'))

    setupDevtools(resolver as never, nuxt as never, info)

    const tabs: unknown[] = []
    hooks.get('devtools:customTabs')!(tabs)
    expect(tabs).toEqual([expect.objectContaining({
      name: 'nuxt-convex-module',
      view: { type: 'iframe', src: DEVTOOLS_UI_ROUTE },
    })])

    // The RPC is registered once DevTools initializes.
    expect(nuxt.devtools.extendServerRpc).not.toHaveBeenCalled()
    hooks.get('devtools:initialized')!(v3)
    expect(nuxt.devtools.extendServerRpc).toHaveBeenCalledWith(RPC_NAMESPACE, expect.objectContaining({
      getInfo: expect.any(Function),
      resolveFunctionSource: expect.any(Function),
    }))
    expect(nuxt.devtools.extendServerRpc.mock.calls[0]![1].getInfo()).toBe(info)
  })

  it('registers a Vite DevTools dock and scoped RPC on DevTools 4, not the v3 tab', () => {
    const { hooks, nuxt, resolver } = fakeEnv(join(base, 'stub-build'))

    setupDevtools(resolver as never, nuxt as never, info)
    hooks.get('devtools:initialized')!({ version: '4.0.0-beta.7', packagePath: '' })

    // The v3 APIs would only reach v4 through its deprecation shims.
    expect(nuxt.devtools.extendServerRpc).not.toHaveBeenCalled()
    const tabs: unknown[] = []
    hooks.get('devtools:customTabs')!(tabs)
    expect(tabs).toEqual([])

    const register = vi.fn()
    const scope = vi.fn(() => ({ rpc: { register } }))
    const docks = { register: vi.fn() }
    hooks.get('devtools:ready')!({ docks, scope })

    expect(docks.register).toHaveBeenCalledWith(expect.objectContaining({
      id: 'nuxt-convex-module',
      type: 'iframe',
      url: `${DEVTOOLS_UI_ROUTE}/?${DEVTOOLS_DOCK_PARAM}`,
      groupId: 'nuxt',
      // Imported through Nuxt's Vite dev server, which serves under `/_nuxt/`.
      clientScript: { importFrom: `/_nuxt/@fs${dockClient}`, eager: true },
    }))
    expect(scope).toHaveBeenCalledWith(RPC_NAMESPACE)
    const handlers = Object.fromEntries(register.mock.calls.map(([fn]) => [fn.name, fn.handler]))
    expect(Object.keys(handlers)).toEqual(['getInfo', 'resolveFunctionSource'])
    expect(handlers.getInfo()).toBe(info)
  })

  it('serves the dock client script under the app base URL', () => {
    const { hooks, nuxt, resolver } = fakeEnv(join(base, 'stub-build'), '/app/')

    setupDevtools(resolver as never, nuxt as never, info)
    const docks = { register: vi.fn() }
    hooks.get('devtools:ready')!({ docks, scope: () => ({ rpc: { register: vi.fn() } }) })

    expect(docks.register.mock.calls[0]![0].clientScript.importFrom)
      .toBe(`/app/_nuxt/@fs${dockClient}`)
  })
})
