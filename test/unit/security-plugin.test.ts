import { afterEach, describe, expect, it } from 'vitest'
import convexSecurityPlugin from '../../src/runtime/nuxt/security'
import type { SecurityRules } from '../../src/runtime/nuxt/csp'
import { resetNuxtRuntimeConfigForTests, setNuxtRuntimeConfigForTests } from '../helpers/nuxt-imports'

// The Nitro plugin registered when nuxt-security is detected: it listens for
// nuxt-security's `nuxt-security:routeRules` hook (fired once the global
// config and route rules are merged) and appends the Convex origins to the
// `/**` rule. The plain `unit` project compiles `import.meta.dev` falsy, so
// this exercises the production path (connect-src included).

type Listener = (rules: Record<string, SecurityRules>) => void

function installPlugin() {
  const listeners = new Map<string, Listener[]>()
  const nitroApp = {
    hooks: {
      hook(name: string, fn: Listener) {
        listeners.set(name, [...(listeners.get(name) ?? []), fn])
      },
    },
  }
  convexSecurityPlugin(nitroApp as unknown as Parameters<typeof convexSecurityPlugin>[0])
  return {
    hookNames: [...listeners.keys()],
    fire(rules: Record<string, SecurityRules>) {
      for (const fn of listeners.get('nuxt-security:routeRules') ?? []) fn(rules)
    },
  }
}

const URL = 'https://happy-otter-123.convex.cloud'
const SITE_URL = 'https://happy-otter-123.convex.site'

function cspOf(rules: SecurityRules): Record<string, unknown> {
  return (rules.headers as Record<string, unknown>).contentSecurityPolicy as Record<string, unknown>
}

afterEach(() => resetNuxtRuntimeConfigForTests())

describe('convexSecurityPlugin', () => {
  it('registers on nuxt-security:routeRules only', () => {
    expect(installPlugin().hookNames).toEqual(['nuxt-security:routeRules'])
  })

  it('appends the Convex origins from runtime config to the global rule', () => {
    setNuxtRuntimeConfigForTests({ public: { convex: { url: URL, siteUrl: SITE_URL } } })
    const rules: Record<string, SecurityRules> = {
      '/**': { headers: { contentSecurityPolicy: { 'img-src': ['\'self\'', 'data:'] } } },
    }

    installPlugin().fire(rules)

    const csp = cspOf(rules['/**']!)
    expect(csp['connect-src']).toEqual([
      '\'self\'',
      'https://happy-otter-123.convex.cloud',
      'wss://happy-otter-123.convex.cloud',
      'https://happy-otter-123.convex.site',
      'wss://happy-otter-123.convex.site',
    ])
    expect(csp['img-src']).toEqual([
      '\'self\'',
      'data:',
      'https://happy-otter-123.convex.cloud',
      'https://happy-otter-123.convex.site',
    ])
    expect(csp['media-src']).toEqual([
      '\'self\'',
      'https://happy-otter-123.convex.cloud',
      'https://happy-otter-123.convex.site',
    ])
  })

  it('prefers the private siteUrl over the public one', () => {
    setNuxtRuntimeConfigForTests({
      convex: { siteUrl: 'https://private.convex.site' },
      public: { convex: { url: URL, siteUrl: 'https://public.convex.site' } },
    })
    const rules: Record<string, SecurityRules> = { '/**': {} }

    installPlugin().fire(rules)

    expect(cspOf(rules['/**']!)['connect-src']).toContain('https://private.convex.site')
    expect(cspOf(rules['/**']!)['connect-src']).not.toContain('https://public.convex.site')
  })

  it('keeps the app\'s own directive entries and only appends', () => {
    setNuxtRuntimeConfigForTests({ public: { convex: { url: URL } } })
    const rules: Record<string, SecurityRules> = {
      '/**': { headers: { contentSecurityPolicy: { 'connect-src': ['\'self\'', 'https://api.example.com'] } } },
    }

    installPlugin().fire(rules)

    expect(cspOf(rules['/**']!)['connect-src']).toEqual([
      '\'self\'',
      'https://api.example.com',
      'https://happy-otter-123.convex.cloud',
      'wss://happy-otter-123.convex.cloud',
    ])
  })

  it('touches only the /** rule — per-route overrides stay the app\'s', () => {
    setNuxtRuntimeConfigForTests({ public: { convex: { url: URL } } })
    const admin: SecurityRules = { headers: { contentSecurityPolicy: { 'connect-src': ['\'self\''] } } }
    const rules: Record<string, SecurityRules> = { '/**': {}, '/admin/**': admin }

    installPlugin().fire(rules)

    expect(cspOf(admin)['connect-src']).toEqual(['\'self\''])
  })

  it('is a no-op without a Convex URL, a /** rule, or with CSP switched off', () => {
    const plugin = installPlugin()

    const noUrl: Record<string, SecurityRules> = { '/**': {} }
    plugin.fire(noUrl)
    expect(noUrl['/**']).toEqual({})

    setNuxtRuntimeConfigForTests({ public: { convex: { url: URL } } })
    const noGlobal: Record<string, SecurityRules> = { '/admin/**': {} }
    plugin.fire(noGlobal)
    expect(noGlobal['/admin/**']).toEqual({})

    const cspOff: Record<string, SecurityRules> = { '/**': { headers: { contentSecurityPolicy: false } } }
    plugin.fire(cspOff)
    expect((cspOff['/**']!.headers as Record<string, unknown>).contentSecurityPolicy).toBe(false)
  })
})
