import { defineNuxtRouteMiddleware, navigateTo, useNuxtApp, useRequestEvent, useRuntimeConfig } from '#app'
import { watch } from 'vue'
import { useAuth } from '../vue/use-auth'
import { convexAuth } from './server'

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
 * definePageMeta({ middleware: 'auth' })
 * </script>
 * ```
 */

interface GuardedRoute {
  path: string
  fullPath: string
}

function loginTarget(to: GuardedRoute, loginPath: string) {
  return { path: loginPath, query: { redirect: to.fullPath } }
}

/** Exported for unit tests — `import.meta.server` is compile-time. @internal */
export async function serverGuard(to: GuardedRoute, loginPath: string) {
  const event = useRequestEvent()
  if (!event) return
  // Capture the Nuxt app *before* the await — awaiting loses the async context,
  // so a bare `navigateTo` afterwards throws "called outside of setup". Restore
  // it with runWithContext so the server-side redirect works on direct loads.
  const nuxtApp = useNuxtApp()
  const authed = await convexAuth(event).isAuthenticated()
  if (!authed && to.path !== loginPath) {
    return nuxtApp.runWithContext(() => navigateTo(loginTarget(to, loginPath)))
  }
}

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

export default defineNuxtRouteMiddleware(async (to) => {
  const loginPath = useRuntimeConfig().public.convex.loginPath || '/login'

  if (import.meta.server) {
    return serverGuard(to, loginPath)
  }

  const { session } = useAuth()
  if (session.value.isPending) {
    await waitForSession(() => session.value.isPending)
  }

  // Same self-redirect guard as the server branch.
  if (!session.value.data && to.path !== loginPath) {
    return navigateTo(loginTarget(to, loginPath))
  }
})
