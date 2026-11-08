/**
 * Helpers for an app's own tests, kept off the runtime entries.
 *
 * The module keeps some state for the app's lifetime, as upstream's provider
 * keeps it for the provider's: a test that signs in leaves it behind for the
 * next. Reset it here instead of reaching into the module's files by path.
 *
 * Load it where the app's runtime loads, in `@nuxt/test-utils`' `nuxt`
 * environment: it imports `#convex/auth-client`, the alias the module (or
 * your test config) registers.
 *
 * ```ts
 * import { afterEach } from 'vitest'
 * import { resetBetterAuthState } from 'nuxt-convex-module/testing'
 *
 * afterEach(() => resetBetterAuthState())
 * ```
 *
 * @module testing
 */

export { resetBetterAuthState } from '../better-auth/vue/use-better-auth'
