import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest'
import type { DevtoolsServerInfo } from '../../src/devtools/rpc-types'
import { DEVTOOLS_UI_ROUTE, RPC_NAMESPACE } from '../../src/devtools/rpc-types'

const addCustomTab = vi.fn()
const extendServerRpc = vi.fn()
const onDevToolsInitialized = vi.fn()

vi.mock('@nuxt/devtools-kit', () => ({
  addCustomTab: (...args: unknown[]) => addCustomTab(...args),
  extendServerRpc: (...args: unknown[]) => extendServerRpc(...args),
  onDevToolsInitialized: (...args: unknown[]) => onDevToolsInitialized(...args),
}))

const { setupDevtools } = await import('../../src/devtools/index')

const base = mkdtempSync(join(tmpdir(), 'convex-devtools-'))
afterAll(() => rmSync(base, { recursive: true, force: true }))

function fakeEnv(resolverBase: string) {
  const hooks = new Map<string, (arg: unknown) => unknown>()
  const nuxt = { hook: vi.fn((name: string, fn: (arg: unknown) => unknown) => hooks.set(name, fn)) }
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
  integrations: { betterAuth: false, clerk: false, auth0: false, polar: false },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('setupDevtools', () => {
  it('serves the prebuilt panel via sirv when dist/devtools-client exists', async () => {
    const withClient = join(base, 'with-client')
    mkdirSync(join(withClient, 'devtools-client'), { recursive: true })
    const { hooks, nuxt, resolver } = fakeEnv(withClient)

    setupDevtools(resolver as never, nuxt as never, info)

    expect(hooks.has('vite:serverCreated')).toBe(true)
    const middlewares = { use: vi.fn() }
    await hooks.get('vite:serverCreated')!({ middlewares })
    expect(middlewares.use).toHaveBeenCalledWith(DEVTOOLS_UI_ROUTE, expect.any(Function))
  })

  it('proxies the panel to the local dev server when the built client is absent', () => {
    const { hooks, nuxt, resolver } = fakeEnv(join(base, 'stub-build'))

    setupDevtools(resolver as never, nuxt as never, info)

    expect(hooks.has('vite:extendConfig')).toBe(true)
    const viteConfig: { server?: { proxy?: Record<string, unknown> } } = {}
    hooks.get('vite:extendConfig')!(viteConfig)
    expect(viteConfig.server?.proxy?.[DEVTOOLS_UI_ROUTE]).toMatchObject({
      changeOrigin: true,
    })
  })

  it('registers the iframe tab and the server RPC', () => {
    const { nuxt, resolver } = fakeEnv(join(base, 'stub-build'))

    setupDevtools(resolver as never, nuxt as never, info)

    expect(addCustomTab).toHaveBeenCalledWith(expect.objectContaining({
      name: 'nuxt-convex-module',
      view: { type: 'iframe', src: DEVTOOLS_UI_ROUTE },
    }))

    // The RPC is registered once DevTools initializes.
    expect(onDevToolsInitialized).toHaveBeenCalledTimes(1)
    onDevToolsInitialized.mock.calls[0]![0]()
    expect(extendServerRpc).toHaveBeenCalledWith(RPC_NAMESPACE, expect.objectContaining({
      getInfo: expect.any(Function),
      resolveFunctionSource: expect.any(Function),
    }))
    expect(extendServerRpc.mock.calls[0]![1].getInfo()).toBe(info)
  })
})
