import { getCurrentInstance } from 'vue'

/** The part of a vue-router instance the URL cleanup needs. */
interface UrlRouter {
  replace: (to: string) => unknown
  options: { history: { base: string } }
}

/**
 * The app's router, if it has one. Read from the app rather than through
 * `vue-router`'s injection key, so plain Vue without the router still works.
 *
 * @internal
 */
export function useAppRouter(): UrlRouter | undefined {
  return getCurrentInstance()?.appContext.config.globalProperties.$router as UrlRouter | undefined
}

/**
 * A `replaceUrl` for the ambient sign-ins that goes through the app's router.
 *
 * The router keeps its own copy of the URL. After upstream's bare
 * `history.replaceState`, the route still carries the OAuth callback params,
 * and the router's next navigation writes them back into history. The router
 * prepends its base, so the path is handed over without it.
 *
 * Returns `undefined`, upstream's default, without a router or with hash
 * history, where the route is in the hash and the callback params are not.
 *
 * @internal
 */
export function routerReplaceUrl(router: UrlRouter | undefined): ((url: string) => void) | undefined {
  if (router === undefined) return undefined
  const base = router.options.history.base
  if (base.includes('#')) return undefined
  return (url) => {
    const { pathname, search, hash } = new URL(url)
    const inBase = base !== '' && (pathname === base || pathname.startsWith(`${base}/`))
    void router.replace((inBase ? pathname.slice(base.length) || '/' : pathname) + search + hash)
  }
}
