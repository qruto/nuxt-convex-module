// PARITY: A-15
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { request, createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createApp, toNodeListener, type EventHandler } from 'h3'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { DevtoolsServerInfo } from '../../src/devtools/rpc-types'
import { DEVTOOLS_UI_ROUTE, RPC_NAMESPACE } from '../../src/devtools/rpc-types'
import { setupDevtools } from '../../src/devtools/index'

const base = mkdtempSync(join(tmpdir(), 'convex-devtools-'))
afterAll(() => rmSync(base, { recursive: true, force: true }))

function fakeEnv(resolverBase: string) {
  const hooks = new Map<string, (arg?: unknown) => unknown>()
  const nuxt = {
    hook: vi.fn((name: string, fn: (arg?: unknown) => unknown) => hooks.set(name, fn)),
    options: { devServerHandlers: [] as Array<{ route: string, handler: EventHandler }> },
    devtools: { extendServerRpc: vi.fn() },
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

/** GET a raw path (no URL normalisation, so `..` reaches the server as sent). */
function get(server: Server, path: string) {
  const { port } = server.address() as AddressInfo
  return new Promise<{ status: number, type?: string, body: string }>((resolve, reject) => {
    request({ port, path }, (res) => {
      let body = ''
      res.on('data', (chunk) => {
        body += chunk
      })
      res.on('end', () => resolve({ status: res.statusCode!, type: res.headers['content-type'], body }))
    }).on('error', reject).end()
  })
}

describe('setupDevtools', () => {
  it('serves the prebuilt panel from dist/devtools-client', async () => {
    const withClient = join(base, 'with-client')
    mkdirSync(join(withClient, 'devtools-client', '_nuxt'), { recursive: true })
    writeFileSync(join(withClient, 'devtools-client', 'index.html'), '<!doctype html><title>panel</title>')
    writeFileSync(join(withClient, 'devtools-client', '_nuxt', 'entry.js'), 'export {}')
    writeFileSync(join(withClient, 'secret.txt'), 'outside the panel')
    const { nuxt, resolver } = fakeEnv(withClient)

    setupDevtools(resolver as never, nuxt as never, info)

    expect(nuxt.options.devServerHandlers).toHaveLength(1)
    const { route, handler } = nuxt.options.devServerHandlers[0]!
    expect(route).toBe(DEVTOOLS_UI_ROUTE)

    // Mounted the way Nitro's dev server mounts `devServerHandlers`.
    const server = createServer(toNodeListener(createApp().use(route, handler)))
    await new Promise<void>(resolve => server.listen(0, resolve))
    try {
      const page = await get(server, `${DEVTOOLS_UI_ROUTE}/`)
      expect(page).toMatchObject({ status: 200, type: 'text/html; charset=utf-8' })
      expect(page.body).toContain('<title>panel</title>')
      expect(await get(server, `${DEVTOOLS_UI_ROUTE}/_nuxt/entry.js`))
        .toMatchObject({ status: 200, type: 'text/javascript; charset=utf-8' })
      expect((await get(server, `${DEVTOOLS_UI_ROUTE}/missing.js`)).status).toBe(404)
      // A path that climbs out of the panel folder is refused, not read.
      const escape = await get(server, `${DEVTOOLS_UI_ROUTE}/../secret.txt`)
      expect(escape.status).toBe(404)
      expect(escape.body).not.toContain('outside the panel')
    }
    finally {
      server.close()
    }
  })

  it('proxies the panel to the local dev server when the built client is absent', () => {
    const { hooks, nuxt, resolver } = fakeEnv(join(base, 'stub-build'))

    setupDevtools(resolver as never, nuxt as never, info)

    expect(nuxt.options.devServerHandlers).toHaveLength(0)
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
    hooks.get('devtools:initialized')!()

    const rpc = nuxt.devtools.extendServerRpc.mock.calls[0]![1] as {
      resolveFunctionSource: (udfPath: string) => { filepath?: string }
    }
    expect(rpc.resolveFunctionSource('messages:list'))
      .toEqual({ filepath: join(projectRoot, 'convex', 'messages.ts') })
    expect(rpc.resolveFunctionSource('missing:list')).toEqual({})
  })

  it('registers the iframe tab and the server RPC', () => {
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
    hooks.get('devtools:initialized')!()
    expect(nuxt.devtools.extendServerRpc).toHaveBeenCalledWith(RPC_NAMESPACE, expect.objectContaining({
      getInfo: expect.any(Function),
      resolveFunctionSource: expect.any(Function),
    }))
    expect(nuxt.devtools.extendServerRpc.mock.calls[0]![1].getInfo()).toBe(info)
  })
})
