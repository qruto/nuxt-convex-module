// PARITY: A-12
import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp, useRuntimeConfig } from '#app'
import { pageSession } from './page-session'

/**
 * Auth route middleware for Convex Auth's cookie sessions: protects pages
 * from unauthenticated access.
 *
 * Unauthenticated visitors are sent to the configured login route
 * (`convex.convexAuth.loginPath`, default `/login`) with the original
 * destination in a `?redirect=` query.
 *
 * Usage in page:
 * ```vue
 * <script setup>
 * definePageMeta({ middleware: 'convex-auth' })
 * </script>
 * ```
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const loginPath = useRuntimeConfig().public.convex.loginPath || '/login'
  // Captured before any await, which loses the async context `navigateTo` needs.
  const nuxtApp = useNuxtApp()
  const toLogin = () => nuxtApp.runWithContext(() => navigateTo({ path: loginPath, query: { redirect: to.fullPath } }))

  // Signed in, by the server's answer for the page it renders and by the
  // session's own state in the browser. `undefined`: the server decided.
  const authed = await pageSession(nuxtApp)
  if (authed === false && to.path !== loginPath) return toLogin()
})
