import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { formatStartupSummary, integrationWarnings, isDeclaredDependency, resolveIntegrationState } from '../../src/options'
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
