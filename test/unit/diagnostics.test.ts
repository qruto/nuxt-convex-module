import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { formatStartupSummary, resolveIntegrationState } from '../../src/module'
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
      { betterAuth: true, clerk: false, auth0: false, polar: true },
    )).toBe('Convex https://happy-otter-123.convex.cloud · functions: convex/ · integrations: better-auth, polar')
  })

  it('spells out the empty cases instead of hiding them', () => {
    expect(formatStartupSummary('', 'convex', { betterAuth: false, clerk: false, auth0: false, polar: false }))
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
