import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { validateModuleOptions } from '../../src/module'

const rootDir = mkdtempSync(join(tmpdir(), 'convex-module-options-'))
afterAll(() => rmSync(rootDir, { recursive: true, force: true }))

const base = {
  url: 'https://example.convex.cloud',
  siteUrl: 'https://example.convex.site',
  authRoute: '/api/auth',
  rootDir,
}

describe('validateModuleOptions', () => {
  it('accepts a well-formed configuration', () => {
    expect(validateModuleOptions(base)).toEqual({
      errors: [],
      warnings: [],
      authRoute: '/api/auth',
    })
  })

  it('accepts empty url/siteUrl (unset is handled elsewhere)', () => {
    const result = validateModuleOptions({ ...base, url: '', siteUrl: '' })
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
  })

  it('errors when url points at the .convex.site domain', () => {
    const result = validateModuleOptions({ ...base, url: 'https://example.convex.site' })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('convex.siteUrl')
  })

  it('warns when siteUrl points at the .convex.cloud domain', () => {
    const result = validateModuleOptions({ ...base, siteUrl: 'https://example.convex.cloud' })
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]).toContain('swap')
  })

  it('warns on malformed urls', () => {
    expect(validateModuleOptions({ ...base, url: 'example.convex.cloud' }).warnings)
      .toHaveLength(1)
    expect(validateModuleOptions({ ...base, siteUrl: 'ws://foo' }).warnings)
      .toHaveLength(1)
  })

  it('normalizes authRoute: adds the leading slash with a warning, strips trailing slashes silently', () => {
    const missingSlash = validateModuleOptions({ ...base, authRoute: 'api/auth' })
    expect(missingSlash.authRoute).toBe('/api/auth')
    expect(missingSlash.warnings).toHaveLength(1)

    const trailingSlash = validateModuleOptions({ ...base, authRoute: '/api/auth/' })
    expect(trailingSlash.authRoute).toBe('/api/auth')
    expect(trailingSlash.warnings).toEqual([])
  })

  it('errors when a custom authClient path does not exist', () => {
    const result = validateModuleOptions({ ...base, authClient: './app/missing-client' })
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('missing-client')
  })

  it('accepts an existing authClient path, with or without extension', () => {
    writeFileSync(join(rootDir, 'auth-client.ts'), 'export const authClient = {}\n')
    expect(validateModuleOptions({ ...base, authClient: './auth-client' }).errors).toEqual([])
    expect(validateModuleOptions({ ...base, authClient: './auth-client.ts' }).errors).toEqual([])
  })
})
