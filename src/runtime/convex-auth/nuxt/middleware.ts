// PARITY: A-12
import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp, useRequestEvent, useRuntimeConfig } from '#app'
import { watch } from 'vue'
import { useAuth } from '../vue/client'
import type { ConvexAuthNuxtContext } from './server'

/** Resolves once the session has loaded. */
function whenLoaded(isLoading: () => boolean) {
  return new Promise<void>((resolve) => {
    const stop = watch(
      isLoading,
      (loading) => {
        if (!loading) {
          stop()
          resolve()
        }
      },
      { immediate: true },
    )
  })
}

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

  if (import.meta.server) {
    // The proxy middleware leaves the check on the request. It asks the
    // deployment, so a forged cookie does not pass. No proxy means no session
    // to check, and the answer is "not signed in", never "let it through".
    const session = (useRequestEvent()?.context as { convexAuth?: ConvexAuthNuxtContext } | undefined)?.convexAuth
    const authed = session ? await session.isAuthenticated() : false
    if (!authed && to.path !== loginPath) return toLogin()
    return
  }

  // The server decided for the page it rendered, and the session is not
  // loaded until that page has hydrated.
  if (nuxtApp.isHydrating && nuxtApp.payload.serverRendered) return

  // The session's own state, not `useConvexAuth`: right after a sign-in the
  // session exists while the connection has yet to accept its token.
  const { isLoading, isAuthenticated } = useAuth()
  if (isLoading()) await whenLoaded(isLoading)
  if (!isAuthenticated() && to.path !== loginPath) return toLogin()
})
