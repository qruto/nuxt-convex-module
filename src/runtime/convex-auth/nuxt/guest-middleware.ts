// PARITY: A-12
import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp } from '#app'
import { resolveAuthRedirect } from '../../better-auth/vue/redirect'
import { pageSession } from './page-session'

/**
 * Guest-only route middleware for Convex Auth's cookie sessions: sends
 * signed-in visitors away from pages such as the login page, the way
 * upstream's proxy handler does with `nextjsProxyRedirect`.
 *
 * They go to the page's `?redirect=` query when it is a same-origin path (the
 * one the `convex-auth` middleware adds), and to `/` otherwise.
 *
 * Usage in page:
 * ```vue
 * <script setup>
 * definePageMeta({ middleware: 'convex-auth-guest' })
 * </script>
 * ```
 */
export default defineNuxtRouteMiddleware(async (to) => {
  // Captured before any await, which loses the async context `navigateTo` needs.
  const nuxtApp = useNuxtApp()
  if (await pageSession(nuxtApp) === true) {
    return nuxtApp.runWithContext(() => navigateTo(resolveAuthRedirect(to.query.redirect)))
  }
})
