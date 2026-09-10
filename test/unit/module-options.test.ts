import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { resolveDeploymentUrls, validateModuleOptions } from '../../src/module'

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

  it('warns on urls that have an http(s) prefix but do not parse', () => {
    const bareScheme = validateModuleOptions({ ...base, url: 'https://' })
    expect(bareScheme.warnings).toHaveLength(1)
    expect(bareScheme.warnings[0]).toContain('does not look like a valid http(s) URL')

    expect(validateModuleOptions({ ...base, url: 'http://[' }).warnings)
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

describe('resolveDeploymentUrls', () => {
  const option = { url: 'https://option.convex.cloud', siteUrl: 'https://option.convex.site' }

  it('prefers the explicit option over either environment name', () => {
    expect(resolveDeploymentUrls(option, {
      NUXT_PUBLIC_CONVEX_URL: 'https://prefixed.convex.cloud',
      CONVEX_URL: 'https://cli.convex.cloud',
      NUXT_PUBLIC_CONVEX_SITE_URL: 'https://prefixed.convex.site',
      CONVEX_SITE_URL: 'https://cli.convex.site',
    })).toEqual(option)
  })

  it('prefers the NUXT_PUBLIC_ name over the unprefixed one', () => {
    expect(resolveDeploymentUrls({}, {
      NUXT_PUBLIC_CONVEX_URL: 'https://prefixed.convex.cloud',
      CONVEX_URL: 'https://cli.convex.cloud',
      NUXT_PUBLIC_CONVEX_SITE_URL: 'https://prefixed.convex.site',
      CONVEX_SITE_URL: 'https://cli.convex.site',
    })).toEqual({
      url: 'https://prefixed.convex.cloud',
      siteUrl: 'https://prefixed.convex.site',
    })
  })

  // The whole point of the fallback: `npx convex dev` writes these names, so an
  // app that has only ever run the CLI needs no `convex.url` in nuxt.config.
  it('falls back to the unprefixed names the Convex CLI writes', () => {
    expect(resolveDeploymentUrls({}, {
      CONVEX_URL: 'https://cli.convex.cloud',
      CONVEX_SITE_URL: 'https://cli.convex.site',
    })).toEqual({
      url: 'https://cli.convex.cloud',
      siteUrl: 'https://cli.convex.site',
    })
  })

  // An empty NUXT_PUBLIC_CONVEX_URL is still a *defined* variable, and Nitro
  // applies it as a runtime override — but it must not shadow a usable
  // CONVEX_URL at build time, or a CLI-configured app renders unconfigured.
  it('treats an empty prefixed variable as unset', () => {
    expect(resolveDeploymentUrls({}, {
      NUXT_PUBLIC_CONVEX_URL: '',
      CONVEX_URL: 'https://cli.convex.cloud',
    }).url).toBe('https://cli.convex.cloud')
  })

  it('resolves to empty strings when nothing is configured', () => {
    expect(resolveDeploymentUrls({}, {})).toEqual({ url: '', siteUrl: '' })
  })
})
