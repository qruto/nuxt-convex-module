// PARITY: D-18
import { realpathSync } from 'node:fs'
import path, { basename } from 'node:path'
import { addVitePlugin, resolvePath, type Resolver } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'

// The extensions a module's id may carry. Anything else after a dot is part
// of the name: `auth.client` is `auth.client.ts`, not `auth.ts`.
const SCRIPT_EXTENSION = /\.(?:[cm]?[jt]sx?|vue)$/

/** A path with `/` separators. */
const posix = (file: string): string => file.replaceAll('\\', '/')

/**
 * Whether `file` is `target`. A target that names its extension (what
 * `resolvePath` resolved) matches that file only, never a sibling of another
 * extension (`auth-client.js` beside `auth-client.ts`); an extensionless one
 * (the alias as configured, when nothing resolved) matches by name.
 */
function sameModule(file: string, target: string): boolean {
  if (SCRIPT_EXTENSION.test(target)) return posix(file) === posix(target)
  return posix(file).replace(SCRIPT_EXTENSION, '') === posix(target)
}

/**
 * Whether a client-manifest key (or its `src`) names `target`. Keys are
 * posix paths relative to Vite's root, so the comparison happens there: the
 * target made relative to `root`, never the key made absolute, which on
 * Windows would bring a drive letter and backslashes into it. `paths` is the
 * platform's `node:path`; a test hands it `path.win32`. @internal
 */
export function manifestKeyMatches(key: string, root: string, target: string, paths: Pick<typeof path, 'relative'> = path): boolean {
  return sameModule(key, paths.relative(root, target))
}

/** `path` with its symlinks followed, or `path` when it cannot be. */
function real(file: string): string {
  try {
    return realpathSync(file)
  }
  catch {
    return file
  }
}

/**
 * Every spelling of the module behind `#convex/auth-client`: the alias as
 * configured (`join(rootDir, custom)`, often extensionless), the file it
 * resolves to (an extension, a directory's `index`), and that file with its
 * symlinks followed, as Vite names the modules it transforms. Resolved once
 * per build.
 */
function authClientFiles(nuxt: Nuxt): () => Promise<string[]> {
  let files: Promise<string[]> | undefined
  return () => files ??= (async () => {
    const target = nuxt.options.alias['#convex/auth-client']
    if (!target) return []
    const resolved = await resolvePath(target, { fallbackToOriginal: true })
    // The extensionless alias only when it resolved to nothing more exact.
    return [...new Set(resolved === target ? [target, real(target)] : [resolved, real(resolved)])]
  })()
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
    `import { registerEvaluatedAuthClient as __convexRegisterAuthClient } from ${JSON.stringify(loader)}`,
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
  const files = authClientFiles(nuxt)
  addVitePlugin({
    name: 'nuxt-convex-module:auth-client-registration',
    async transform(code, id, transformOptions) {
      if (transformOptions?.ssr) return
      const file = id.split('?')[0]!
      if (!(await files()).some(target => sameModule(file, target))) return
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
  const files = authClientFiles(nuxt)
  nuxt.hook('build:manifest', async (manifest) => {
    const targets = await files()
    if (targets.length === 0) return
    // Manifest keys are relative to Vite's root, which Nuxt sets to `srcDir`
    // unless the app sets `vite.root`; a symlinked root is tried both ways.
    const root = nuxt.options.vite?.root ?? nuxt.options.srcDir
    const roots = [...new Set([root, real(root)])]
    const isAuthClient = (key: string) => roots.some(base => targets.some(target => manifestKeyMatches(manifest[key]?.src ?? key, base, target)))
    const keys = new Set(Object.keys(manifest).filter(isAuthClient))
    if (keys.size === 0) return
    // As Nuxt keeps page chunks off it: a dynamic import listed here is prefetched.
    for (const chunk of Object.values(manifest)) {
      chunk.dynamicImports &&= chunk.dynamicImports.filter(key => !keys.has(key))
    }
    for (const key of keys) manifest[key]!.prefetch = false
  })
}
