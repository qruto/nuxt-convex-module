import { useRequestEvent, type NuxtApp } from '#app'
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
 * Whether the visitor is signed in, for the two `convex-auth` route
 * middlewares. `undefined` while the browser hydrates a page the server
 * rendered: the server decided for that page, and the session is not loaded
 * until it has hydrated.
 *
 * @internal
 */
export async function pageSession(nuxtApp: NuxtApp): Promise<boolean | undefined> {
  if (import.meta.server) {
    // The proxy middleware leaves the check on the request. It asks the
    // deployment, so a forged cookie does not pass. No proxy means no session
    // to check, and the answer is "not signed in", never "let it through".
    const session = (useRequestEvent(nuxtApp)?.context as { convexAuth?: ConvexAuthNuxtContext } | undefined)?.convexAuth
    return session ? await session.isAuthenticated() : false
  }

  if (nuxtApp.isHydrating && nuxtApp.payload.serverRendered) return undefined

  // The session's own state, not `useConvexAuth`: right after a sign-in the
  // session exists while the connection has yet to accept its token.
  const { isLoading, isAuthenticated } = useAuth()
  if (isLoading()) await whenLoaded(isLoading)
  return isAuthenticated()
}
