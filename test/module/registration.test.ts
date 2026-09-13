// PARITY: A-01, A-09
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadNuxt, type Nuxt } from '@nuxt/kit'
import type { NuxtOptions } from '@nuxt/schema'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { APP_COMPONENTS, APP_IMPORTS, SERVER_IMPORTS } from '../../src/registry'

// What the module registers into a Nuxt app, observed on a real Nuxt instance
// — `loadNuxt` with `ready: true` runs the module's setup and nothing else, in
// seconds, with no build. The e2e fixtures exercise the same wiring end to
// end but never look at it; the unit tests cover the pure helpers. This is
// the only place a renamed auto-import, a dropped alias, a wrong
// `resolver.resolve()` path or a lost route rule is visible before a user
// hits it.
//
// Kit registers imports, components and middleware through hooks that run
// later in the build (`imports:extend`, `components:extend`, `nitro:config`,
// `app:resolve`), so those are read by calling the hook with an empty
// collector. Everything else lands on `nuxt.options` synchronously.

const fixture = fileURLToPath(new URL('../fixtures/registration', import.meta.url))
const moduleDir = fileURLToPath(new URL('../../src', import.meta.url))

type Registered = {
  options: NuxtOptions
  imports: string[]
  components: Array<{ pascalName: string, filePath: string, export?: string }>
  serverImports: string[]
  middleware: Array<{ name: string, path: string, global?: boolean }>
}

/**
 * Nuxt's own `nitro:config` hooks write into a real Nitro config
 * (`config.virtual[…] = …`, `config.alias.x = …`). This stands in for one:
 * any missing property becomes another stand-in, so every such write lands
 * somewhere; only the field this test reads is a real array.
 */
function nitroConfigStub(): Record<string, unknown> {
  const vivify = (): Record<string, unknown> => new Proxy({} as Record<string, unknown>, {
    get(target, key) {
      if (typeof key === 'symbol') return undefined
      if (key === 'push' || key === 'unshift') return () => 0
      if (!(key in target)) target[key] = vivify()
      return target[key]
    },
  })
  const config = vivify()
  config.imports = { imports: [] as Array<{ name: string }> }
  return config
}

async function load(overrides: Record<string, unknown> = {}): Promise<{ nuxt: Nuxt, registered: Registered }> {
  const nuxt = await loadNuxt({ cwd: fixture, dev: false, ready: true, overrides: { convex: overrides } as never })
  // Nuxt and nuxt-security register through the same hooks; keep this module's.
  const ours = <T extends { from?: string, filePath?: string, path?: string }>(entries: T[]) =>
    entries.filter(e => (e.from ?? e.filePath ?? e.path ?? '').startsWith(moduleDir))
  const imports: Array<{ name: string, from: string }> = []
  await nuxt.callHook('imports:extend', imports as never)
  const components: Registered['components'] = []
  await nuxt.callHook('components:extend', components as never)
  const nitro = nitroConfigStub() as { imports: { imports: Array<{ name: string, from: string }> } }
  await nuxt.callHook('nitro:config', nitro as never)
  const app = { middleware: [] as Registered['middleware'] }
  await nuxt.callHook('app:resolve', app as never)
  return {
    nuxt,
    registered: {
      options: nuxt.options,
      imports: ours(imports).map(i => i.name),
      components: ours(components),
      serverImports: ours(nitro.imports.imports).map(i => i.name),
      middleware: ours(app.middleware),
    },
  }
}

const names = (record: Record<string, Array<{ name: string }>>, keys: string[]) =>
  keys.flatMap(key => record[key]!.map(e => e.name))

describe('with Better Auth and nuxt-security declared (auto-detected)', () => {
  let nuxt: Nuxt
  let r: Registered
  beforeAll(async () => ({ nuxt, registered: r } = await load()), 60_000)
  afterAll(() => nuxt.close())

  it('registers the #convex/* aliases on Vite and Nitro, auth-client before the catch-all', () => {
    const expected = ['#convex/auth-client', '#convex/api', '#convex/server', '#convex/dataModel', '#convex/_generated', '#convex']
    for (const alias of expected) {
      expect(r.options.alias[alias], `alias ${alias} missing on nuxt.options.alias`).toBeDefined()
      expect(r.options.nitro.alias?.[alias], `alias ${alias} missing on nitro.alias`).toBe(r.options.alias[alias])
    }
    const keys = Object.keys(r.options.alias).filter(k => k.startsWith('#convex'))
    expect(keys.indexOf('#convex/auth-client')).toBeLessThan(keys.indexOf('#convex'))
    expect(keys.indexOf('#convex/api')).toBeLessThan(keys.indexOf('#convex'))
  })

  it('publishes the five runtime-config keys', () => {
    expect(r.options.runtimeConfig.public.convex).toEqual({
      url: 'https://example.convex.cloud',
      siteUrl: 'https://example.convex.site',
      crossDomainCallbackRoute: '',
      loginPath: '/login',
    })
    expect(r.options.runtimeConfig.convex).toEqual({ siteUrl: 'https://example.convex.site' })
  })

  it('auto-imports exactly the core and Better Auth names', () => {
    expect([...r.imports].sort()).toEqual(names(APP_IMPORTS, ['core', 'betterAuth']).sort())
  })

  it('registers exactly the core and Better Auth components, by export name', () => {
    expect(r.components.map(c => c.pascalName).sort()).toEqual(names(APP_COMPONENTS, ['core', 'betterAuth']).sort())
    for (const component of r.components) expect(component.export).toBe(component.pascalName)
  })

  it('auto-imports the core and Better Auth server helpers', () => {
    expect([...r.serverImports].sort()).toEqual(names(SERVER_IMPORTS, ['core', 'betterAuth']).sort())
  })

  it('mounts the auth proxy with its route rules on both Nuxt and Nitro', () => {
    const handler = r.options.serverHandlers.find(h => h.route === '/api/auth/**')
    expect(handler?.handler).toMatch(/runtime\/better-auth\/nuxt\/proxy$/)
    for (const rules of [r.options.routeRules, r.options.nitro.routeRules]) {
      const rule = rules?.['/api/auth/**'] as { cache: boolean, prerender: boolean, security: { xssValidator: boolean, allowedMethodsRestricter: { methods: string[] } } }
      expect(rule).toMatchObject({ cache: false, prerender: false, security: { xssValidator: false } })
      // Deduped: kit's extendRouteRules defu-merges into `routeRules` and
      // `nitro.routeRules`, which Nuxt 4 portal-links to one object, so the
      // array is concatenated with itself. nuxt-security reads it with `includes`.
      expect([...new Set(rule.security.allowedMethodsRestricter.methods)]).toEqual(['GET', 'HEAD', 'POST', 'OPTIONS'])
    }
  })

  it('registers the non-global auth middleware', () => {
    expect(r.middleware).toEqual([expect.objectContaining({ name: 'auth', global: false })])
    expect(r.middleware[0]!.path).toMatch(/runtime\/better-auth\/nuxt\/middleware$/)
  })

  it('lets the Better Auth plugins own the client — the base plugin stays out', () => {
    const plugins = r.options.plugins.map(p => (typeof p === 'string' ? p : p.src))
    expect(plugins.some(p => /runtime\/better-auth\/vue\/plugin\.client(?:\.[cm]?[jt]s)?$/.test(p))).toBe(true)
    expect(plugins.some(p => /runtime\/better-auth\/vue\/plugin\.server(?:\.[cm]?[jt]s)?$/.test(p))).toBe(true)
    expect(plugins.some(p => /runtime\/vue\/plugin(?:\.[cm]?[jt]s)?$/.test(p))).toBe(false)
  })

  it('registers the nuxt-security CSP plugin and the codegen watch', () => {
    expect(r.options.nitro.plugins?.some(p => /runtime\/nuxt\/security(?:\.[cm]?[jt]s)?$/.test(p))).toBe(true)
    // `dev: false` here; the watch only registers in dev — see codegen-watch.test.ts.
  })

  it('points every registration at a file that exists', () => {
    const referenced = [
      ...r.options.serverHandlers.map(h => h.handler),
      ...r.options.plugins.map(p => (typeof p === 'string' ? p : p.src)),
      ...r.middleware.map(m => m.path),
      ...r.components.map(c => c.filePath),
      ...(r.options.nitro.plugins ?? []),
    ].filter((p): p is string => typeof p === 'string' && p.startsWith(moduleDir))
    expect(referenced.length).toBeGreaterThan(8)
    for (const path of referenced) {
      expect(['', '.ts', '.js', '.vue'].some(ext => existsSync(path + ext)), `${path} does not exist`).toBe(true)
    }
  })
})

describe('with betterAuth: false', () => {
  let nuxt: Nuxt
  let r: Registered
  beforeAll(async () => ({ nuxt, registered: r } = await load({ betterAuth: false })), 60_000)
  afterAll(() => nuxt.close())

  it('provides the base client and registers nothing from Better Auth', () => {
    const plugins = r.options.plugins.map(p => (typeof p === 'string' ? p : p.src))
    expect(plugins.some(p => /runtime\/vue\/plugin(?:\.[cm]?[jt]s)?$/.test(p))).toBe(true)
    expect(plugins.some(p => p.includes('better-auth'))).toBe(false)
    expect(r.options.serverHandlers.some(h => h.route === '/api/auth/**')).toBe(false)
    expect(r.middleware).toEqual([])
    expect([...r.imports].sort()).toEqual(names(APP_IMPORTS, ['core']).sort())
    expect(r.components.map(c => c.pascalName).sort()).toEqual(names(APP_COMPONENTS, ['core']).sort())
    expect([...r.serverImports].sort()).toEqual(names(SERVER_IMPORTS, ['core']).sort())
  })
})

describe('with a custom authRoute and auth client', () => {
  let nuxt: Nuxt
  let r: Registered
  beforeAll(async () => ({ nuxt, registered: r } = await load({ authRoute: '/auth', betterAuth: { authClient: './auth-client' } })), 60_000)
  afterAll(() => nuxt.close())

  it('moves the proxy, its rules, and the auth-client alias together', () => {
    expect(r.options.serverHandlers.some(h => h.route === '/auth/**')).toBe(true)
    expect(r.options.serverHandlers.some(h => h.route === '/api/auth/**')).toBe(false)
    expect(r.options.routeRules?.['/auth/**']).toMatchObject({ cache: false })
    expect(r.options.alias['#convex/auth-client']).toMatch(/registration\/auth-client$/)
  })
})
