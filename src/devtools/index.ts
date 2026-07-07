import { existsSync } from 'node:fs'
import type { Nuxt } from '@nuxt/schema'
import type { Resolver } from '@nuxt/kit'
import { addCustomTab, extendServerRpc, onDevToolsInitialized } from '@nuxt/devtools-kit'
import {
  DEVTOOLS_UI_LOCAL_PORT,
  DEVTOOLS_UI_ROUTE,
  RPC_NAMESPACE,
  type ClientFunctions,
  type DevtoolsServerInfo,
  type ServerFunctions,
} from './rpc-types'
import { resolveFunctionSource } from './resolve-function-source'

/**
 * Wire the Convex panel into Nuxt DevTools (dev-only; lazily imported so
 * `@nuxt/devtools-kit` never loads in production builds):
 *
 * - serve the panel app — from `dist/devtools-client` via sirv in the
 *   published package, or proxied to the `pnpm dev:devtools-client` dev server
 *   while developing this module (the `./devtools-client` dir doesn't exist
 *   next to the stub);
 * - register the iframe tab;
 * - expose the server-side RPC (build-time info + function-source lookup —
 *   live client state reaches the panel through the in-page bridge instead).
 */
export function setupDevtools(resolver: Resolver, nuxt: Nuxt, info: DevtoolsServerInfo): void {
  const devtoolsClientPath = resolver.resolve('./devtools-client')

  if (existsSync(devtoolsClientPath)) {
    nuxt.hook('vite:serverCreated', async (server) => {
      const sirv = (await import('sirv')).default
      server.middlewares.use(DEVTOOLS_UI_ROUTE, sirv(devtoolsClientPath, { dev: true, single: true }))
    })
  }
  else {
    nuxt.hook('vite:extendConfig', (config) => {
      // `server` is typed readonly on the resolved Vite config, but mutating it
      // in this hook is the established pattern (nuxt/fonts does the same).
      const mutable = config as { server?: { proxy?: Record<string, unknown> } }
      mutable.server ||= {}
      mutable.server.proxy ||= {}
      mutable.server.proxy[DEVTOOLS_UI_ROUTE] = {
        target: `http://localhost:${DEVTOOLS_UI_LOCAL_PORT}${DEVTOOLS_UI_ROUTE}`,
        changeOrigin: true,
        followRedirects: true,
        rewrite: (path: string) => path.replace(DEVTOOLS_UI_ROUTE, ''),
      }
    })
  }

  onDevToolsInitialized(() => {
    extendServerRpc<ClientFunctions, ServerFunctions>(RPC_NAMESPACE, {
      getInfo: () => info,
      resolveFunctionSource: udfPath => resolveFunctionSource(info.rootDir, info.functionsDir, udfPath),
    })
  })

  addCustomTab({
    name: 'nuxt-convex-kit',
    title: 'Convex',
    icon: `${DEVTOOLS_UI_ROUTE}/icon.svg`,
    view: {
      type: 'iframe',
      src: DEVTOOLS_UI_ROUTE,
    },
  })
}
