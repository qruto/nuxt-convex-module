import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import type { Nuxt } from '@nuxt/schema'
import { addDevServerHandler, runWithNuxtContext, type Resolver } from '@nuxt/kit'
import type { ModuleCustomTab, NuxtDevtoolsInfo, NuxtDevtoolsServerContext } from '@nuxt/devtools-kit/types'
import type { ViteDevToolsNodeContext } from '@vitejs/devtools-kit'
import {
  DEVTOOLS_DOCK_PARAM,
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
 * Serve one file of the built panel. A dev-server handler is mounted at its own
 * route, so the panel is reachable whatever the app's `baseURL`; `req.url` is
 * the full URL on every server builder. Never cached, as sirv's dev mode did:
 * the panel's asset names can stay the same across module versions while their
 * content changes.
 *
 * Exported for tests.
 * @internal
 */
export async function servePanel(request: Request, root: string): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } })
  }
  let path: string
  try {
    path = decodeURIComponent(new URL(request.url).pathname)
  }
  catch {
    return new Response(null, { status: 400 })
  }
  if (path.startsWith(DEVTOOLS_UI_ROUTE)) path = path.slice(DEVTOOLS_UI_ROUTE.length)
  const file = resolve(root, `.${path === '' || path === '/' ? '/index.html' : path}`)
  // A `..` segment or an absolute path never reaches past the panel's folder.
  const stats = file.startsWith(root + sep) ? await stat(file).catch(() => undefined) : undefined
  if (!stats?.isFile()) return new Response(null, { status: 404 })
  return new Response(request.method === 'HEAD' ? null : await readFile(file), {
    headers: {
      'content-type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
      'content-length': String(stats.size),
      'cache-control': 'no-store',
    },
  })
}

/**
 * Wire the Convex panel into Nuxt DevTools (dev-only, and lazily imported):
 *
 * - serve the panel app — from `dist/devtools-client` in the published
 *   package, or proxied to the `pnpm dev:devtools-client` dev server while
 *   developing this module (the `./devtools-client` dir doesn't exist next to
 *   the stub);
 * - register the panel: a dock in the Nuxt group of Vite DevTools on Nuxt
 *   DevTools 4, an iframe tab on 3;
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
    // On the `nuxt` this receives: the module imported this file after an await.
    runWithNuxtContext(nuxt, () => addDevServerHandler({
      route: `${DEVTOOLS_UI_ROUTE}/**`,
      handler: { nuxt: event => servePanel(event.req, devtoolsClientPath) },
    }))
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

  const functions: ServerFunctions = {
    getInfo: () => info,
    resolveFunctionSource: udfPath => resolveFunctionSource(info.rootDir, info.functionsDir, udfPath),
  }

  // Both majors call this with their version once modules are set up, before
  // any tab is collected. v4 also calls `devtools:ready` once Vite DevTools
  // connects; there the v3 APIs below still work, but only through shims that
  // print deprecation warnings.
  let viteDevtools = false
  nuxt.hook('devtools:initialized', ({ version }: NuxtDevtoolsInfo) => {
    viteDevtools = Number.parseInt(version) >= 4
    if (viteDevtools) return
    // DevTools sets `nuxt.devtools` before it calls this hook.
    const devtools = (nuxt as Nuxt & { devtools?: NuxtDevtoolsServerContext }).devtools
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- DevTools 3's only RPC API; 4 returned above
    devtools?.extendServerRpc<ClientFunctions, ServerFunctions>(RPC_NAMESPACE, functions)
  })

  nuxt.hook('devtools:customTabs', (tabs: ModuleCustomTab[]) => {
    if (viteDevtools) return
    tabs.push({
      name: RPC_NAMESPACE,
      title: 'Convex',
      icon: `${DEVTOOLS_UI_ROUTE}/icon.svg`,
      view: {
        type: 'iframe',
        src: DEVTOOLS_UI_ROUTE,
      },
    })
  })

  nuxt.hook('devtools:ready', (ctx: ViteDevToolsNodeContext) => {
    ctx.docks.register({
      id: RPC_NAMESPACE,
      title: 'Convex',
      icon: `${DEVTOOLS_UI_ROUTE}/icon.svg`,
      type: 'iframe',
      url: `${DEVTOOLS_UI_ROUTE}/?${DEVTOOLS_DOCK_PARAM}`,
      // `NUXT_DEVTOOLS_GROUP_ID`: the kit is a type-only dependency.
      groupId: 'nuxt',
      category: 'modules',
    })
    // Registered as `nuxt-convex-module:<name>`, the names v3 gives them too.
    const { rpc } = ctx.scope(RPC_NAMESPACE)
    rpc.register({ name: 'getInfo', type: 'query', handler: functions.getInfo })
    rpc.register({ name: 'resolveFunctionSource', type: 'query', handler: functions.resolveFunctionSource })
  })
}
