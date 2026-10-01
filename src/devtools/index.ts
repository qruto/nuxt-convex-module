import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { extname, join } from 'node:path'
import type { Nuxt } from '@nuxt/schema'
import type { Resolver } from '@nuxt/kit'
import type { ModuleCustomTab, NuxtDevtoolsServerContext } from '@nuxt/devtools-kit/types'
import { defineEventHandler, serveStatic } from 'h3'
import {
  DEVTOOLS_UI_LOCAL_PORT,
  DEVTOOLS_UI_ROUTE,
  RPC_NAMESPACE,
  type ClientFunctions,
  type DevtoolsServerInfo,
  type ServerFunctions,
} from './rpc-types'
import { resolveFunctionSource } from './resolve-function-source'

// The panel is one page plus its assets.
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
}

/**
 * Wire the Convex panel into Nuxt DevTools (dev-only, and lazily imported):
 *
 * - serve the panel app — from `dist/devtools-client` in the published
 *   package, or proxied to the `pnpm dev:devtools-client` dev server while
 *   developing this module (the `./devtools-client` dir doesn't exist next to
 *   the stub);
 * - register the iframe tab;
 * - expose the server-side RPC (build-time info + function-source lookup —
 *   live client state reaches the panel through the in-page bridge instead).
 *
 * It talks to DevTools through the hooks `@nuxt/devtools` calls, the same
 * hooks `@nuxt/devtools-kit`'s helpers register, so the kit is a type-only
 * dependency.
 */
export function setupDevtools(resolver: Resolver, nuxt: Nuxt, info: DevtoolsServerInfo): void {
  const devtoolsClientPath = resolver.resolve('./devtools-client')

  if (existsSync(devtoolsClientPath)) {
    // What kit's `addDevServerHandler` does, on the `nuxt` this receives. A
    // dev-server handler is mounted at its own route, so the panel is reachable
    // whatever the app's `baseURL`. `serveStatic` turns away any path with a
    // `..` segment before it reaches the file system.
    nuxt.options.devServerHandlers.push({
      route: DEVTOOLS_UI_ROUTE,
      handler: defineEventHandler(event => serveStatic(event, {
        getContents: id => readFile(join(devtoolsClientPath, id)),
        getMeta: async (id) => {
          const stats = await stat(join(devtoolsClientPath, id)).catch(() => undefined)
          if (stats?.isFile()) {
            return { type: CONTENT_TYPES[extname(id)], size: stats.size, mtime: stats.mtimeMs }
          }
        },
      })),
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

  // DevTools sets `nuxt.devtools` before it calls this hook.
  nuxt.hook('devtools:initialized', () => {
    const devtools = (nuxt as Nuxt & { devtools?: NuxtDevtoolsServerContext }).devtools
    devtools?.extendServerRpc<ClientFunctions, ServerFunctions>(RPC_NAMESPACE, {
      getInfo: () => info,
      resolveFunctionSource: udfPath => resolveFunctionSource(info.rootDir, info.functionsDir, udfPath),
    })
  })

  nuxt.hook('devtools:customTabs', (tabs: ModuleCustomTab[]) => {
    tabs.push({
      name: 'nuxt-convex-module',
      title: 'Convex',
      icon: `${DEVTOOLS_UI_ROUTE}/icon.svg`,
      view: {
        type: 'iframe',
        src: DEVTOOLS_UI_ROUTE,
      },
    })
  })
}
