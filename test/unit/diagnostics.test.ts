// PARITY: A-09
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { clientDependencies, createDependencyLocator, formatStartupSummary, integrationWarnings, isDeclaredDependency, isPackageInstalled, resolveIntegrationState } from '../../src/options'
import { hasGeneratedApi } from '../../src/functions-dir'

describe('resolveIntegrationState', () => {
  it('disables when explicitly turned off, regardless of installation', () => {
    expect(resolveIntegrationState(false, true)).toEqual({ enabled: false, missingPackage: false })
    expect(resolveIntegrationState(false, false)).toEqual({ enabled: false, missingPackage: false })
  })

  it('auto-detects from installation when the option is unset', () => {
    expect(resolveIntegrationState(undefined, true)).toEqual({ enabled: true, missingPackage: false })
    expect(resolveIntegrationState(undefined, false)).toEqual({ enabled: false, missingPackage: false })
  })

  it('does not auto-enable a package that resolves but the app never declared', () => {
    // A sibling app's dependency, hoisted to a monorepo root.
    expect(resolveIntegrationState(undefined, true, false)).toEqual({ enabled: false, missingPackage: false })
    // An explicit `true` only needs resolution — a layer may provide the package.
    expect(resolveIntegrationState(true, true, false)).toEqual({ enabled: true, missingPackage: false })
  })

  it('enables when explicitly requested and the package is installed', () => {
    expect(resolveIntegrationState(true, true)).toEqual({ enabled: true, missingPackage: false })
    // Object form (e.g. `betterAuth: { authClient: ... }`) counts as explicit enable.
    expect(resolveIntegrationState({ authClient: './x' }, true)).toEqual({ enabled: true, missingPackage: false })
  })

  it('flags the misconfiguration when explicitly requested but not installed', () => {
    expect(resolveIntegrationState(true, false)).toEqual({ enabled: false, missingPackage: true })
    expect(resolveIntegrationState({ authClient: './x' }, false)).toEqual({ enabled: false, missingPackage: true })
  })
})

describe('formatStartupSummary', () => {
  it('lists the enabled integrations in a single line', () => {
    expect(formatStartupSummary(
      'https://happy-otter-123.convex.cloud',
      'convex',
      { betterAuth: true, clerk: false, auth0: false, polar: true, security: true },
    )).toBe('Convex https://happy-otter-123.convex.cloud · functions: convex/ · integrations: better-auth, polar, nuxt-security')
  })

  it('spells out the empty cases instead of hiding them', () => {
    expect(formatStartupSummary('', 'convex', { betterAuth: false, clerk: false, auth0: false, polar: false, security: false }))
      .toBe('Convex (no URL) · functions: convex/ · integrations: none')
  })
})

describe('hasGeneratedApi', () => {
  const rootDir = mkdtempSync(join(tmpdir(), 'nuxt-convex-module-codegen-'))
  afterAll(() => rmSync(rootDir, { recursive: true, force: true }))

  it('is false before `convex dev` has emitted _generated/api', () => {
    expect(hasGeneratedApi(rootDir)).toBe(false)
    expect(hasGeneratedApi(rootDir, 'convex')).toBe(false)
  })

  it('detects either the .d.ts or the .js emitted by codegen', () => {
    const generatedDir = join(rootDir, 'convex', '_generated')
    mkdirSync(generatedDir, { recursive: true })

    writeFileSync(join(generatedDir, 'api.js'), 'export const api = {}\n')
    expect(hasGeneratedApi(rootDir)).toBe(true)

    rmSync(join(generatedDir, 'api.js'))
    writeFileSync(join(generatedDir, 'api.d.ts'), 'export declare const api: unknown\n')
    expect(hasGeneratedApi(rootDir, 'convex')).toBe(true)
  })
})

describe('isDeclaredDependency', () => {
  const root = mkdtempSync(join(tmpdir(), 'convex-declared-'))
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  it.each(['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'])('reads %s', (field) => {
    writeFileSync(join(root, 'package.json'), JSON.stringify({ [field]: { 'nuxt-security': '*' } }))
    expect(isDeclaredDependency('nuxt-security', root)).toBe(true)
    expect(isDeclaredDependency('@convex-dev/polar', root)).toBe(false)
  })

  it('is false without a manifest, or with one that does not parse', () => {
    rmSync(join(root, 'package.json'), { force: true })
    expect(isDeclaredDependency('nuxt-security', root)).toBe(false)
    writeFileSync(join(root, 'package.json'), '{ not json')
    expect(isDeclaredDependency('nuxt-security', root)).toBe(false)
  })
})

describe('isPackageInstalled', () => {
  const root = mkdtempSync(join(tmpdir(), 'convex-installed-'))
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  function install(dir: string, id: string, manifest: Record<string, unknown> = {}) {
    mkdirSync(join(dir, 'node_modules', id), { recursive: true })
    writeFileSync(join(dir, 'node_modules', id, 'package.json'), JSON.stringify({ name: id, ...manifest }))
  }

  it('finds a package whatever its exports map allows', () => {
    // ESM-only and no `./package.json` export, like nuxt-security.
    install(root, 'fixture-esm-only', { type: 'module', exports: { '.': { import: './index.mjs' } } })
    // No `.` export at all, like @polar-sh/checkout.
    install(root, '@fixture/subpaths-only', { exports: { './embed': './embed.js' } })
    expect(isPackageInstalled('fixture-esm-only', root)).toBe(true)
    expect(isPackageInstalled('@fixture/subpaths-only', root)).toBe(true)
    expect(isPackageInstalled('fixture-not-installed', root)).toBe(false)
  })

  it('looks in parent folders, where a hoisted install puts it', () => {
    install(root, 'fixture-hoisted')
    const app = join(root, 'apps', 'web')
    mkdirSync(app, { recursive: true })
    expect(isPackageInstalled('fixture-hoisted', app)).toBe(true)
  })
})

describe('integrationWarnings', () => {
  const flags = (on: Partial<Record<'betterAuth' | 'clerk' | 'auth0' | 'polar' | 'security', boolean>>) =>
    ({ betterAuth: false, clerk: false, auth0: false, polar: false, security: false, ...on })
  const everything = () => true

  it('warns when Better Auth shares the client with another auth adapter', () => {
    expect(integrationWarnings(flags({ betterAuth: true, clerk: true }), everything)).toEqual([
      expect.stringContaining('Better Auth and Clerk are both enabled'),
    ])
    const [all] = integrationWarnings(flags({ betterAuth: true, clerk: true, auth0: true }), everything)
    expect(all).toContain('Clerk and Auth0')
    expect(all).toContain('`convex.clerk: false` / `convex.auth0: false`')
  })

  it('stays quiet for Clerk with Auth0, or for one auth adapter alone', () => {
    expect(integrationWarnings(flags({ clerk: true, auth0: true }), everything)).toEqual([])
    expect(integrationWarnings(flags({ betterAuth: true }), everything)).toEqual([])
  })

  it('warns when Polar is on but its checkout peer is missing', () => {
    const missing = (pkg: string) => pkg !== '@polar-sh/checkout'
    expect(integrationWarnings(flags({ polar: true }), missing)).toEqual([
      expect.stringContaining('npm install @polar-sh/checkout'),
    ])
    expect(integrationWarnings(flags({ polar: true }), everything)).toEqual([])
    expect(integrationWarnings(flags({ polar: false }), missing)).toEqual([])
  })
})

describe('clientDependencies', () => {
  const flags = (on: Partial<Record<'betterAuth' | 'clerk' | 'auth0' | 'polar' | 'security', boolean>>) =>
    ({ betterAuth: false, clerk: false, auth0: false, polar: false, security: false, ...on })
  const everything = () => ''

  it('lists only Convex when no integration is on', () => {
    expect(clientDependencies(flags({}), everything)).toEqual(['convex/browser', 'convex/server', 'convex/values'])
  })

  it('adds what each enabled integration imports on the client', () => {
    expect(clientDependencies(flags({ betterAuth: true, clerk: true, auth0: true, polar: true, security: true }), everything)).toEqual([
      'convex/browser',
      'convex/server',
      'convex/values',
      '@convex-dev/better-auth/client/plugins',
      'better-auth/vue',
      '@clerk/vue',
      '@auth0/auth0-vue',
      '@polar-sh/checkout/embed',
    ])
  })

  it('leaves out an entry whose package is not installed', () => {
    const checked: string[] = []
    const missing = (pkg: string) => (checked.push(pkg), pkg === '@polar-sh/checkout' ? undefined : '')
    expect(clientDependencies(flags({ polar: true }), missing)).not.toContain('@polar-sh/checkout/embed')
    expect(checked).toEqual(['convex', 'convex', 'convex', '@polar-sh/checkout'])
  })

  it('names an entry by the walk Vite takes to it', () => {
    const nested = (pkg: string) => pkg === 'better-auth' ? 'nuxt-backend > nuxt-convex-module > ' : ''
    expect(clientDependencies(flags({ betterAuth: true }), nested)).toEqual([
      'convex/browser',
      'convex/server',
      'convex/values',
      '@convex-dev/better-auth/client/plugins',
      'nuxt-backend > nuxt-convex-module > better-auth/vue',
    ])
  })
})

// Each layout is built the way its package manager lays it out on disk, down
// to pnpm's symlinks into `.pnpm`, because those links are what Vite follows.
describe('createDependencyLocator', () => {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'convex-locate-')))
  afterAll(() => rmSync(root, { recursive: true, force: true }))

  let count = 0
  function app(dependencies: Record<string, string>): string {
    const dir = join(root, `app-${++count}`)
    write(dir, { name: 'app', dependencies })
    return dir
  }
  function write(dir: string, manifest: Record<string, unknown> = {}) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'package.json'), JSON.stringify(manifest))
  }
  function link(target: string, path: string) {
    mkdirSync(dirname(path), { recursive: true })
    symlinkSync(target, path, process.platform === 'win32' ? 'junction' : 'dir')
  }
  /** This module in pnpm's virtual store with its peers beside it; returns the folder it runs from. */
  function storeModule(dir: string, peers: string[]): string {
    const store = join(dir, 'node_modules', '.pnpm', 'nuxt-convex-module@1.0.0', 'node_modules')
    write(join(store, 'nuxt-convex-module'), { name: 'nuxt-convex-module' })
    mkdirSync(join(store, 'nuxt-convex-module', 'dist'), { recursive: true })
    for (const peer of peers) {
      const real = join(dir, 'node_modules', '.pnpm', `${peer.replace('/', '+')}@1.0.0`, 'node_modules', peer)
      write(real, { name: peer })
      link(real, join(store, peer))
    }
    return join(store, 'nuxt-convex-module', 'dist')
  }

  it('leaves a package at the app\'s root bare: npm, yarn and hoisted pnpm', () => {
    const dir = app({ 'nuxt-convex-module': '1.0.0' })
    write(join(dir, 'node_modules', 'nuxt-convex-module'), { name: 'nuxt-convex-module' })
    write(join(dir, 'node_modules', 'better-auth'), { name: 'better-auth' })
    write(join(dir, 'node_modules', '@polar-sh', 'checkout'), { name: '@polar-sh/checkout' })
    mkdirSync(join(dir, 'node_modules', 'nuxt-convex-module', 'dist'))
    const locate = createDependencyLocator(dir, join(dir, 'node_modules', 'nuxt-convex-module', 'dist'))
    expect(locate('better-auth')).toBe('')
    expect(locate('@polar-sh/checkout')).toBe('')
    expect(locate('@clerk/vue')).toBeUndefined()
  })

  it('walks through this module to a peer only its own folder has: isolated pnpm', () => {
    const dir = app({ 'nuxt-convex-module': '1.0.0' })
    const moduleDir = storeModule(dir, ['better-auth', '@polar-sh/checkout'])
    link(dirname(moduleDir), join(dir, 'node_modules', 'nuxt-convex-module'))
    const locate = createDependencyLocator(dir, moduleDir)
    expect(locate('better-auth')).toBe('nuxt-convex-module > ')
    expect(locate('@polar-sh/checkout')).toBe('nuxt-convex-module > ')
    expect(locate('@clerk/vue')).toBeUndefined()
  })

  /** A package in pnpm's virtual store, linked to `at`; returns its real folder. */
  function storePackage(dir: string, name: string, dependencies: Record<string, string>, at: string): string {
    const real = join(dir, 'node_modules', '.pnpm', `${name.replace('/', '+')}@1.0.0`, 'node_modules', name)
    write(real, { name, dependencies })
    link(real, at)
    return real
  }

  it('starts the walk at the app\'s dependency that brings this module in, as nuxt-backend does', () => {
    const dir = app({ 'nuxt': '4.0.0', '@acme/wrapper': '1.0.0' })
    const moduleDir = storeModule(dir, ['better-auth'])
    // pnpm's hidden hoist: every store package reaches this module by walking
    // up, `nuxt` included. Only the wrapper names it, so only it is the parent.
    link(dirname(moduleDir), join(dir, 'node_modules', '.pnpm', 'node_modules', 'nuxt-convex-module'))
    storePackage(dir, 'nuxt', {}, join(dir, 'node_modules', 'nuxt'))
    const wrapper = storePackage(dir, '@acme/wrapper', { 'nuxt-convex-module': '1.0.0' }, join(dir, 'node_modules', '@acme', 'wrapper'))
    link(dirname(moduleDir), join(wrapper, '..', '..', 'nuxt-convex-module'))
    expect(createDependencyLocator(dir, moduleDir)('better-auth')).toBe('@acme/wrapper > nuxt-convex-module > ')
  })

  it('walks to the copy of this module that is running, not another one at the root', () => {
    const dir = app({ 'nuxt-convex-module': '0.9.0', 'wrapper': '1.0.0' })
    write(join(dir, 'node_modules', 'nuxt-convex-module'), { name: 'nuxt-convex-module' })
    const moduleDir = storeModule(dir, ['better-auth'])
    const wrapper = storePackage(dir, 'wrapper', { 'nuxt-convex-module': '1.0.0' }, join(dir, 'node_modules', 'wrapper'))
    link(dirname(moduleDir), join(wrapper, '..', 'nuxt-convex-module'))
    expect(createDependencyLocator(dir, moduleDir)('better-auth')).toBe('wrapper > nuxt-convex-module > ')
  })

  it('leaves a package out when this module is more than one dependency deep', () => {
    const dir = app({ outer: '1.0.0' })
    const moduleDir = storeModule(dir, ['better-auth'])
    const inner = storePackage(dir, 'inner', { 'nuxt-convex-module': '1.0.0' }, join(dir, 'node_modules', '.pnpm', 'outer@1.0.0', 'node_modules', 'inner'))
    link(dirname(moduleDir), join(inner, '..', 'nuxt-convex-module'))
    write(join(dir, 'node_modules', '.pnpm', 'outer@1.0.0', 'node_modules', 'outer'), { name: 'outer', dependencies: { inner: '1.0.0' } })
    link(join(dir, 'node_modules', '.pnpm', 'outer@1.0.0', 'node_modules', 'outer'), join(dir, 'node_modules', 'outer'))
    expect(createDependencyLocator(dir, moduleDir)('better-auth')).toBeUndefined()
  })
})
