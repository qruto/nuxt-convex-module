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
 * Options for {@link consumeCrossDomainOneTimeToken}.
 *
 * @public
 */
export interface ConsumeCrossDomainOneTimeTokenOptions {
  /**
   * Only exchange the one-time token when the page URL matches this route
   * (e.g. `'/auth/callback'`; trailing slashes ignored). On every other route
   * the `ott` parameter is scrubbed from the URL but **not** exchanged.
   *
   * The cross-domain protocol cannot bind the token to the browser that
   * started the sign-in flow (magic-link flows legitimately finish in another
   * browsing context), so without this restriction a crafted
   * `/any-page?ott=…` link silently signs the visitor into the link author's
   * session — login CSRF. Restricting consumption to the one route your
   * sign-in `callbackURL`s point at shrinks that surface to a single
   * predictable URL.
   *
   * In Nuxt, set `convex.betterAuth.crossDomainCallbackRoute` instead — the
   * client plugin forwards it here.
   */
  callbackRoute?: string
}

/** `/auth/callback/` compares equal to `/auth/callback`; a missing leading slash is tolerated. */
const normalizePathname = (path: string): string => {
  const slashed = path.startsWith('/') ? path : `/${path}`
  const trimmed = slashed.replace(/\/+$/, '')
  return trimmed === '' ? '/' : trimmed
}

/**
 * Exchange a `?ott=...` one-time token (set by the Better Auth cross-domain
 * plugin when redirecting from an auth origin) for a full session — the Vue
 * port of `ConvexBetterAuthProvider`'s one-time-token `useEffect`.
 *
 * Safe to call unconditionally — returns early when the URL has no `ott`
 * parameter or the cross-domain plugin is not installed on the auth client.
 *
 * The token is not bound to the browser that initiated sign-in (upstream
 * design), so anyone holding a fresh token can mint a link that logs its
 * visitor into *their* session — see
 * {@link ConsumeCrossDomainOneTimeTokenOptions.callbackRoute} for the
 * mitigation.
 */
export async function consumeCrossDomainOneTimeToken(
  options: ConsumeCrossDomainOneTimeTokenOptions = {},
): Promise<void> {
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
    // Port-only guard (login-CSRF defense): with a dedicated callback route
    // configured, a token landing anywhere else is scrubbed above but never
    // exchanged — a crafted `/any-page?ott=…` link must not be able to swap
    // the visitor's session for the link author's.
    if (
      options.callbackRoute
      && normalizePathname(url.pathname) !== normalizePathname(options.callbackRoute)
    ) {
      console.warn(
        `[nuxt-convex-module] ignoring cross-domain one-time token on "${url.pathname}" — consumption is restricted to "${options.callbackRoute}" (convex.betterAuth.crossDomainCallbackRoute).`,
      )
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
