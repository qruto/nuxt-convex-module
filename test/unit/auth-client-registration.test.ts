// PARITY: D-18
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, win32 } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

/** The part of a Vite plugin this test drives. */
interface Plugin { transform?: unknown }

// The runtime reaches `#convex/auth-client` through `import()`; an app may
// still import `authClient` statically. The browser build appends a line to
// the client module that hands the client to the loader as it evaluates, so
// the session follows a client nothing loaded through the loader.

const plugins: Plugin[] = []
// What @nuxt/kit's `resolvePath` answers for an alias target: by default the
// target itself; a test sets the file it resolves to.
const resolved = new Map<string, string>()
vi.mock('@nuxt/kit', () => ({
  resolvePath: async (target: string) => resolved.get(target) ?? target,
  addVitePlugin: (plugin: Plugin, options: unknown) => {
    expect(options).toEqual({ server: false })
    plugins.push(plugin)
  },
}))

const { authClientRegistration, manifestKeyMatches, registerAuthClientOnEvaluation } = await import('../../src/auth-client-registration')

function transformFor(target: string | undefined) {
  plugins.length = 0
  const nuxt = { options: { alias: target ? { '#convex/auth-client': target } : {} } }
  registerAuthClientOnEvaluation({ resolve: (path: string) => `/pkg/dist/${path.slice(2)}` } as never, nuxt as never)
  const { transform } = plugins[0]!
  return (code: string, id: string, ssr = false) =>
    (transform as (code: string, id: string, options?: { ssr?: boolean }) => Promise<{ code: string } | undefined>)(code, id, { ssr })
}

describe('the auth client registration', () => {
  it('appends a self import that hands the module\'s authClient to the loader', () => {
    const code = authClientRegistration('/app/app/convex-auth-client.ts', '/pkg/dist/runtime/better-auth/vue/auth-client-loader')
    expect(code).toContain('import { registerEvaluatedAuthClient as __convexRegisterAuthClient } from "/pkg/dist/runtime/better-auth/vue/auth-client-loader"')
    // Relative, so a dev server serves it as the same module, not a second copy.
    expect(code).toContain('import * as __convexAuthClientModule from "./convex-auth-client.ts"')
    expect(code).toContain('__convexRegisterAuthClient(__convexAuthClientModule.authClient)')
  })

  it('transforms the module behind the alias in the browser build, however its id is spelled', async () => {
    const transform = transformFor('/app/app/convex-auth-client')
    const result = await transform('export const authClient = {}', '/app/app/convex-auth-client.ts?v=123')
    expect(result?.code.startsWith('export const authClient = {}\n')).toBe(true)
    expect(result?.code).toContain('__convexRegisterAuthClient(__convexAuthClientModule.authClient)')
  })

  it('leaves the server build, other modules and a missing alias alone', async () => {
    const transform = transformFor('/app/app/convex-auth-client')
    expect(await transform('export const authClient = {}', '/app/app/convex-auth-client.ts', true)).toBeUndefined()
    expect(await transform('export const x = 1', '/app/app/other.ts')).toBeUndefined()
    expect(await transformFor(undefined)('export const authClient = {}', '/app/app/convex-auth-client.ts')).toBeUndefined()
  })

  it('keeps the dots in a client\'s name: auth.client is auth.client.ts, not auth.ts', async () => {
    resolved.set('/app/app/auth.client', '/app/app/auth.client.ts')
    const transform = transformFor('/app/app/auth.client')
    expect((await transform('export const authClient = {}', '/app/app/auth.client.ts'))?.code).toContain('__convexRegisterAuthClient')
    expect(await transform('export const x = 1', '/app/app/auth.ts')).toBeUndefined()
  })

  it('matches an alias that names a directory, by the index file it resolves to', async () => {
    resolved.set('/app/auth', '/app/auth/index.ts')
    const transform = transformFor('/app/auth')
    expect((await transform('export const authClient = {}', '/app/auth/index.ts'))?.code).toContain('__convexRegisterAuthClient')
  })

  it('matches an alias under a symlinked root, by the real path Vite transforms', async () => {
    const base = realpathSync(mkdtempSync(join(tmpdir(), 'ncm-auth-client-')))
    try {
      mkdirSync(join(base, 'real'))
      writeFileSync(join(base, 'real', 'auth-client.ts'), 'export const authClient = {}\n')
      // A junction on Windows, which needs no admin rights.
      symlinkSync(join(base, 'real'), join(base, 'linked'), process.platform === 'win32' ? 'junction' : 'dir')
      resolved.set(join(base, 'linked', 'auth-client'), join(base, 'linked', 'auth-client.ts'))
      const transform = transformFor(join(base, 'linked', 'auth-client'))
      expect((await transform('export const authClient = {}', join(base, 'real', 'auth-client.ts')))?.code).toContain('__convexRegisterAuthClient')
    }
    finally {
      rmSync(base, { recursive: true, force: true })
    }
  })
})

describe('keeping the auth client off the prefetch list', () => {
  type Chunk = { src?: string, file: string, dynamicImports?: string[], prefetch?: boolean }

  async function manifestAfterBuild(options: { srcDir: string, viteRoot?: string, target: string }, manifest: Record<string, Chunk>) {
    const { keepAuthClientOffPrefetch } = await import('../../src/auth-client-registration')
    let hook: ((manifest: Record<string, Chunk>) => Promise<void>) | undefined
    const nuxt = {
      options: { srcDir: options.srcDir, vite: options.viteRoot ? { root: options.viteRoot } : {}, alias: { '#convex/auth-client': options.target } },
      hook: (_name: string, fn: typeof hook) => {
        hook = fn
      },
    }
    keepAuthClientOffPrefetch(nuxt as never)
    await hook!(manifest)
    return manifest
  }

  it('resolves manifest keys against Vite\'s root when the app moves it off srcDir', async () => {
    const manifest = await manifestAfterBuild({ srcDir: '/app/app', viteRoot: '/app', target: '/app/lib/auth-client' }, {
      'node_modules/nuxt/dist/app/entry.js': { file: 'entry.js', dynamicImports: ['lib/auth-client.ts', 'pages/index.vue'] },
      'lib/auth-client.ts': { src: 'lib/auth-client.ts', file: 'auth.js' },
    })

    expect(manifest['node_modules/nuxt/dist/app/entry.js']!.dynamicImports).toEqual(['pages/index.vue'])
    expect(manifest['lib/auth-client.ts']!.prefetch).toBe(false)
  })

  it('matches a posix manifest key against a Windows target and root', () => {
    expect(manifestKeyMatches('lib/auth-client.ts', 'C:\\app', 'C:\\app\\lib\\auth-client', win32)).toBe(true)
    expect(manifestKeyMatches('lib/auth-client.ts', 'C:/app', 'C:/app/lib/auth-client.ts', win32)).toBe(true)
    expect(manifestKeyMatches('../node_modules/pkg/dist/client.js', 'C:\\app\\app', 'C:\\app\\node_modules\\pkg\\dist\\client', win32)).toBe(true)
    expect(manifestKeyMatches('pages/index.vue', 'C:\\app', 'C:\\app\\lib\\auth-client', win32)).toBe(false)
  })
})
