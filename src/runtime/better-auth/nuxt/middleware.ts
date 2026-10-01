// PARITY: A-12
import { defineNuxtRouteMiddleware, navigateTo, useRuntimeConfig } from '#app'
import { watch } from 'vue'
import { useBetterAuth } from '../vue/use-better-auth'
import { loginTarget, serverGuard } from './server-guard'

// The Better Auth client only resolves a session in the browser (it relies
// on cookies + window fetch). On the server `isPending` never flips to
// `false`, so waiting for it would hang SSR forever.
function waitForSession(isPending: () => boolean) {
  return new Promise<void>((resolve) => {
    const stop = watch(
      isPending,
      (pending) => {
        if (!pending) {
          stop()
          resolve()
        }
      },
      { immediate: true },
    )
  })
}

/**
 * Auth route middleware — protects pages from unauthenticated access.
 *
 * Unauthenticated visitors are sent to the configured login route
 * (`convex.betterAuth.loginPath`, default `/login`) with the original
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

  if (import.meta.server) {
    return serverGuard(to, loginPath)
  }

  const { session } = useBetterAuth()
  if (session.value.isPending) {
    await waitForSession(() => session.value.isPending)
  }

  // Same self-redirect guard as the server branch.
  if (!session.value.data && to.path !== loginPath) {
    return navigateTo(loginTarget(to, loginPath))
  }
})
