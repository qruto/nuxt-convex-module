import { authClient } from '#convex/auth-client'

// The aliased client's type only reflects the plugins the app installed (the
// bundled default omits `crossDomainClient()`), so describe the cross-domain
// additions locally — the Vue analog of upstream's
// `authClient as AuthClientWithPlugins<PluginsWithCrossDomain>` cast target.
type AuthClientWithCrossDomain = typeof authClient & {
  // `updateSession` is a top-level action contributed by the cross-domain
  // client plugin's `getActions` (not namespaced under `crossDomain`), matching
  // `convex/react`'s `authClientWithCrossDomain.updateSession()`.
  updateSession: () => void
  crossDomain?: {
    oneTimeToken: {
      verify: (args: { token: string }) => Promise<{
        data?: { session?: { token: string } | null } | null
      }>
    }
  }
}

/**
 * Exchange a `?ott=...` one-time token (set by the Better Auth cross-domain
 * plugin when redirecting from an auth origin) for a full session — the Vue
 * port of `ConvexBetterAuthProvider`'s one-time-token `useEffect`.
 *
 * Safe to call unconditionally — returns early when the URL has no `ott`
 * parameter or the cross-domain plugin is not installed on the auth client.
 */
export async function consumeCrossDomainOneTimeToken(): Promise<void> {
  if (typeof window === 'undefined' || !window.location?.href) {
    return
  }
  const url = new URL(window.location.href)
  const token = url.searchParams.get('ott')
  if (token) {
    const authClientWithCrossDomain = authClient as AuthClientWithCrossDomain
    url.searchParams.delete('ott')
    window.history.replaceState({}, '', url)
    // Port-only guard: the aliased client may not install the cross-domain
    // plugin (upstream requires it whenever an `ott` parameter appears).
    if (!authClientWithCrossDomain.crossDomain) {
      return
    }
    // Port-only catch: this runs while the Nuxt app bootstraps (not in a
    // fire-and-forget effect), so a failed exchange must not break startup.
    try {
      const result
        = await authClientWithCrossDomain.crossDomain.oneTimeToken.verify({
          token,
        })
      const session = result.data?.session
      if (session) {
        await authClient.getSession({
          fetchOptions: {
            headers: {
              Authorization: `Bearer ${session.token}`,
            },
          },
        })
        authClientWithCrossDomain.updateSession()
      }
    }
    catch (error) {
      console.warn('[nuxt-convex-module] failed to consume cross-domain one-time token', error)
    }
  }
}
