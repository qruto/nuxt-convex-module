// PARITY: A-12
//
// The `convex-auth` middleware's server half, kept out of middleware.ts. Nuxt
// lazy-loads a named middleware as a whole module, so anything middleware.ts
// exports reaches the browser with everything it imports. Here, `serverGuard`
// and its `./server` import (h3, jose, ConvexHttpClient) leave the client
// bundle once `import.meta.server` folds the only call site away.
import { navigateTo, useNuxtApp, useRequestEvent } from '#app'
import { convexAuth } from './server'

interface GuardedRoute {
  path: string
  fullPath: string
}

export function loginTarget(to: GuardedRoute, loginPath: string) {
  return { path: loginPath, query: { redirect: to.fullPath } }
}

/** Exported for unit tests — `import.meta.server` is compile-time. @internal */
export async function serverGuard(to: GuardedRoute, loginPath: string) {
  // Capture the Nuxt app *before* the await — awaiting loses the async context,
  // so a bare `navigateTo` afterwards throws "called outside of setup". Restore
  // it with runWithContext so the server-side redirect works on direct loads.
  const nuxtApp = useNuxtApp()
  const event = useRequestEvent()
  // No request event means no session to check, so the answer is "not signed
  // in" — never "let it through". A server render always has one; this is
  // the guard failing closed, not a path a page takes.
  const authed = event ? await convexAuth(event).isAuthenticated() : false
  if (!authed && to.path !== loginPath) {
    return nuxtApp.runWithContext(() => navigateTo(loginTarget(to, loginPath)))
  }
}
