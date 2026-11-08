// PARITY: D-18
import path, { basename } from 'node:path'
import { addVitePlugin, type Resolver } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'

/** A path with `/` separators and no extension, as two spellings of one module compare. */
const moduleKey = (file: string): string => {
  const posixFile = file.replaceAll('\\', '/')
  return posixFile.slice(0, posixFile.length - path.posix.extname(posixFile).length)
}

/**
 * Whether a client-manifest key (or its `src`) names `target`. Keys are
 * posix paths relative to Vite's root, so the comparison happens there: the
 * target made relative to `root`, never the key made absolute, which on
 * Windows would bring a drive letter and backslashes into it. `paths` is the
 * platform's `node:path`; a test hands it `path.win32`. @internal
 */
export function manifestKeyMatches(key: string, root: string, target: string, paths: Pick<typeof path, 'relative'> = path): boolean {
  return moduleKey(key) === moduleKey(paths.relative(root, target))
}

/**
 * The browser code appended to the module behind `#convex/auth-client`: it
 * hands the loader the client as the module evaluates, so a page that imports
 * `authClient` statically has its session follow that client, as one that
 * loads it through `loadAuthClient()` does. The self import reads the
 * module's own `authClient` export however it is declared (a `const`, a
 * renamed or re-exported binding); every binding is set by the time the
 * appended line runs.
 */
export function authClientRegistration(file: string, loader: string): string {
  return [
    '',
    '// nuxt-convex-module (PARITY D-18): tell the loader this client has evaluated.',
    `import { registerAuthClient as __convexRegisterAuthClient } from ${JSON.stringify(loader)}`,
    `import * as __convexAuthClientModule from ${JSON.stringify(`./${basename(file)}`)}`,
    '__convexRegisterAuthClient(__convexAuthClientModule.authClient)',
    '',
  ].join('\n')
}

/**
 * Append {@link authClientRegistration} to the auth client module in the
 * browser build. The runtime reaches the module through `import()`, but an
 * app may import `authClient` statically (a sign-in page): without this the
 * module would evaluate unseen and the session would never follow it.
 */
export function registerAuthClientOnEvaluation(resolver: Resolver, nuxt: Nuxt): void {
  const loader = resolver.resolve('./runtime/better-auth/vue/auth-client-loader')
  addVitePlugin({
    name: 'nuxt-convex-module:auth-client-registration',
    transform(code, id, transformOptions) {
      if (transformOptions?.ssr) return
      const target = nuxt.options.alias['#convex/auth-client']
      const file = id.split('?')[0]!
      if (!target || moduleKey(file) !== moduleKey(target)) return
      return { code: code + authClientRegistration(file, loader), map: null }
    },
  }, { server: false })
}

/**
 * Keep the auth client's chunk out of the `<link rel="prefetch">` tags Nuxt
 * writes for every dynamic import of the entry. The runtime
 * imports `#convex/auth-client` only dynamically, so a page that never needs
 * it never downloads it (PARITY D-18); a prefetch would fetch it anyway.
 */
export function keepAuthClientOffPrefetch(nuxt: Nuxt): void {
  nuxt.hook('build:manifest', (manifest) => {
    const target = nuxt.options.alias['#convex/auth-client']
    if (!target) return
    // Manifest keys are relative to Vite's root, which Nuxt sets to `srcDir`
    // unless the app sets `vite.root`.
    const root = nuxt.options.vite?.root ?? nuxt.options.srcDir
    const isAuthClient = (key: string) => manifestKeyMatches(manifest[key]?.src ?? key, root, target)
    const keys = new Set(Object.keys(manifest).filter(isAuthClient))
    if (keys.size === 0) return
    // As Nuxt keeps page chunks off it: a dynamic import listed here is prefetched.
    for (const chunk of Object.values(manifest)) {
      chunk.dynamicImports &&= chunk.dynamicImports.filter(key => !keys.has(key))
    }
    for (const key of keys) manifest[key]!.prefetch = false
  })
}
