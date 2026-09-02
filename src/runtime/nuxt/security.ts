import { getConvexRuntimeConfig } from './config'
import { applyConvexSecurityDefaults, convexConnectSrc, convexResourceSrc, type SecurityRules } from './csp'

/**
 * The slice of the Nitro app this plugin touches, typed locally: the hook's
 * real declaration lives in the types nuxt-security generates into the app,
 * which only exist when the app has it installed — and this plugin is only
 * registered then. Nitro itself is not imported, so the published types don't
 * depend on how the app resolves `nitropack`.
 */
export interface SecurityNitroApp {
  hooks: {
    hook: (name: 'nuxt-security:routeRules', fn: (rules: Record<string, SecurityRules>) => void) => unknown
  }
}

/**
 * Nitro plugin: extend nuxt-security's Content Security Policy with the Convex
 * origins. Registered by the module only when the nuxt-security integration is
 * on (see `registerSecurity` in `module.ts`).
 *
 * Listens for `nuxt-security:routeRules`, which nuxt-security fires once its
 * global config and every route rule are merged into one table — so the
 * origins are appended to whatever the app configured, whatever the order of
 * `modules`. nuxt-security sorts its own Nitro plugins last, so this listener
 * is in place before the hook fires. The deployment URL comes from runtime
 * config, so it need not be known at build time.
 *
 * `connect-src` is tightened only in production: creating it in dev would
 * block the Vite HMR and devtools WebSockets, which run on ports `'self'`
 * doesn't cover, while nuxt-security's defaults leave the directive open.
 * `img-src` / `media-src` are widened in dev too — nuxt-security enforces its
 * default `img-src 'self' data:` during `nuxt dev` as well, which would block
 * files served from Convex storage.
 */
export default function convexSecurityPlugin(nitroApp: SecurityNitroApp): void {
  nitroApp.hooks.hook('nuxt-security:routeRules', (rules) => {
    const global = rules['/**']
    if (!global) return
    const { url, siteUrl } = getConvexRuntimeConfig()
    applyConvexSecurityDefaults(
      global,
      import.meta.dev ? [] : convexConnectSrc(url, siteUrl),
      convexResourceSrc(url, siteUrl),
    )
  })
}
