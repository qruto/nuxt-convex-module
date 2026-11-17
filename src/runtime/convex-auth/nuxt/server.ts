/**
 * Server bindings for Convex Auth on Nuxt: a port of
 * `@convex-dev/auth/ssr/nextjs`.
 *
 * This is the thin, genuinely Nuxt-specific layer. The auth *handlers*
 * (per-method sign-in, plus refresh/sign-out) are framework-agnostic
 * `(Request) => Response` functions from `@convex-dev/auth/ssr`. What remains
 * Nuxt-specific is the proxy (the up-front refresh) and reading the access
 * token in server code.
 *
 * @module convex-auth/server
 */
import {
  AUTH_JWT_COOKIE,
  createServerAuthChecker,
  isTokenExpiring,
  ServerAuthSession,
  setupConvexAuthServer,
  type AuthCookieOptions,
  type CookieDeleteOptions,
  type CookieOptions,
  type CookieStore,
  type ExposedSignInFn,
  type IsAuthenticatedFn,
  type RefreshSessionFn,
  type RequestHandler,
  type SignOutFn,
} from '@convex-dev/auth/ssr'
import { ConvexHttpClient } from 'convex/browser'
import { getFunctionName } from 'convex/server'
import type { RequestEvent } from 'nuxt/schema'
import { deleteCookie, getCookie, setCookie } from 'nuxt/server'
import { getConvexRuntimeConfig } from '../../nuxt/config'

/**
 * Configuration for {@link setupConvexAuthNuxt}: upstream's
 * `ConvexAuthNextjsConfig` and `ConvexAuthServerConfig` in one, because the
 * module mounts the auth routes from the same file.
 */
export interface ConvexAuthNuxtConfig {
  /**
   * The Convex deployment URL used server-side. Defaults to
   * `runtimeConfig.public.convex.url`.
   */
  convexUrl?: string
  /**
   * The app's `refreshSession` mutation reference. The refresh route and the
   * proxy's optimistic refresh use it.
   */
  refreshSession: RefreshSessionFn
  /** The app's `signOut` mutation reference. */
  signOut: SignOutFn
  /**
   * The app's `isAuthenticated` query reference, used twice over: the server
   * verifies the access token against the backend with it (which checks its
   * signature and that the session is live) rather than trusting the cookie by
   * decoding it, and the client subscribes to it, so a session revoked
   * server-side signs the browser out reactively instead of at the next failed
   * refresh.
   */
  isAuthenticated: IsAuthenticatedFn
  /**
   * The sign-in functions of the methods to expose through the auth proxy.
   * This should include all the Convex backend functions in your app that can
   * issue auth sessions (e.g. account creation, log in with existing account…).
   *
   * Anything not listed is refused, so this allowlist is the proxy's entire API
   * surface. Listing a function here is all the wiring an auth method needs.
   */
  signIn: ExposedSignInFn[]
  /**
   * Overrides the default auth cookie attributes. `secure` may be omitted; it
   * is on outside `nuxt dev`.
   */
  cookieOptions?: Partial<AuthCookieOptions>
  /**
   * Origins beyond the request's own `Host` trusted by every handler's CSRF
   * origin check, for deployments where the two differ (e.g. a proxy that
   * rewrites `Host`).
   */
  allowedOrigins?: string[]
}

/** What the proxy leaves on `event.context` for the rest of the request. */
export interface ConvexAuthNuxtContext {
  /** The (possibly just-refreshed) access token, or null. */
  token: string | null
  /** The name of the app's `isAuthenticated` query, for the client to subscribe to. */
  isAuthenticatedFunctionName: string
  /** {@link ConvexAuthNuxt.isAuthenticatedNuxt} for this request, asked of the deployment once. */
  isAuthenticated: () => Promise<boolean>
}

type ConvexAuthNuxtEvent = Pick<RequestEvent, 'req' | 'res' | 'context'>

const contextOf = (event: Pick<RequestEvent, 'context'>) =>
  event.context as { convexAuth?: ConvexAuthNuxtContext }

/**
 * A {@link CookieStore} over one request. Reads come from the request's
 * cookies, and a write goes to the response and is remembered, so a read
 * after it sees the new value.
 */
class EventCookieStore implements CookieStore {
  readonly #event: ConvexAuthNuxtEvent
  readonly #overlay = new Map<string, string | null>()

  constructor(event: ConvexAuthNuxtEvent) {
    this.#event = event
  }

  get(name: string): string | undefined {
    if (this.#overlay.has(name)) return this.#overlay.get(name) ?? undefined
    return getCookie(this.#event, name)
  }

  set(name: string, value: string, options?: CookieOptions): void {
    this.#overlay.set(name, value)
    setCookie(this.#event, name, value, options)
  }

  delete(name: string, options?: CookieDeleteOptions): void {
    this.#overlay.set(name, null)
    deleteCookie(this.#event, name, options)
  }
}

/**
 * Build the Nuxt server helpers from one config. Export the result as the
 * default export of `server/convex-auth.ts`: the module mounts the auth
 * routes from it and refreshes the session before each render.
 *
 * ```ts
 * // server/convex-auth.ts
 * import { api } from '#convex/api'
 *
 * export default setupConvexAuthNuxt({
 *   refreshSession: api.auth.refreshSession,
 *   signOut: api.auth.signOut,
 *   isAuthenticated: api.auth.isAuthenticated,
 *   signIn: [
 *     api.auth.signInWithUsernamePassword,
 *     api.auth.signUpWithUsernamePassword,
 *   ],
 * })
 * ```
 *
 * @public
 */
export function setupConvexAuthNuxt(config: ConvexAuthNuxtConfig) {
  // `nuxt dev` serves http on localhost, so cookies are HTTPS-only everywhere
  // else. An explicit `secure` still wins.
  const cookieOptions: AuthCookieOptions = {
    ...config.cookieOptions,
    secure: config.cookieOptions?.secure ?? !import.meta.dev,
  }

  // Built on first use: this function runs when the app's file is imported,
  // which can be before the runtime config is readable.
  let built: ReturnType<typeof build> | undefined
  const build = () => {
    const convexUrl = config.convexUrl ?? getConvexRuntimeConfig().url as string
    const httpClient = new ConvexHttpClient(convexUrl)
    return {
      httpClient,
      server: setupConvexAuthServer({
        convexUrl,
        refreshSession: config.refreshSession,
        signOut: config.signOut,
        signIn: config.signIn,
        cookieOptions,
        allowedOrigins: config.allowedOrigins,
      }),
      // Verifies an access token against the backend (which checks its
      // signature), so a forged cookie can't fake authentication.
      checkAuthenticated: createServerAuthChecker({
        convexUrl,
        isAuthenticated: config.isAuthenticated,
      }),
    }
  }
  const use = () => built ??= build()

  const newSession = (cookies: CookieStore) =>
    new ServerAuthSession({
      refreshSession: refreshToken =>
        use().httpClient.mutation(config.refreshSession, { refreshToken }),
      cookies,
      cookieOptions,
    })

  /**
   * Refreshes the session up front, so the render and the server routes
   * after it see a fresh token. The module runs it as server middleware on
   * every request but the auth routes, which own their cookies.
   */
  async function convexAuthNuxtProxy(event: ConvexAuthNuxtEvent): Promise<void> {
    const session = newSession(new EventCookieStore(event))
    let authenticated: Promise<boolean> | undefined
    contextOf(event).convexAuth = {
      token: await session.getToken(), // refresh if near expiry, rewriting cookies
      isAuthenticatedFunctionName: getFunctionName(config.isAuthenticated),
      isAuthenticated: () => authenticated ??= isAuthenticatedNuxt(event),
    }
  }

  /**
   * The current access token in server code, or null. Never triggers a
   * refresh (the proxy does that); returns null for an expired token.
   *
   * The token is returned after only a local expiry check, not a signature
   * check — that is safe because its only use is to authenticate a request to
   * the Convex backend (e.g. `fetchQuery`), which verifies the signature
   * itself. To decide *authentication state* server-side, use
   * {@link isAuthenticatedNuxt} instead, which verifies against the backend.
   */
  async function convexAuthNuxtAccessToken(event: Pick<RequestEvent, 'req' | 'context'>): Promise<string | null> {
    const refreshed = contextOf(event).convexAuth
    const token = refreshed ? refreshed.token : getCookie(event, AUTH_JWT_COOKIE) ?? null
    if (token === null) return null
    return !isTokenExpiring(token, 0) ? token : null
  }

  /**
   * Whether the current request carries a valid, signed-in session. Verifies
   * the cookie's access token against the backend (which checks its signature),
   * so a forged cookie can't fake authentication.
   */
  async function isAuthenticatedNuxt(event: Pick<RequestEvent, 'req' | 'context'>): Promise<boolean> {
    return use().checkAuthenticated(await convexAuthNuxtAccessToken(event))
  }

  const refreshHandler: RequestHandler = request => use().server.refreshHandler(request)
  const signOutHandler: RequestHandler = request => use().server.signOutHandler(request)
  const convexProxyHandler: RequestHandler = request => use().server.convexProxyHandler(request)

  return {
    refreshHandler,
    signOutHandler,
    convexProxyHandler,
    /**
     * The name of the app's `isAuthenticated` query. The client subscribes to
     * it on a page the server did not render, where no payload carries it.
     */
    isAuthenticatedFunctionName: getFunctionName(config.isAuthenticated),
    convexAuthNuxtProxy,
    convexAuthNuxtAccessToken,
    isAuthenticatedNuxt,
  }
}

/** What {@link setupConvexAuthNuxt} returns. */
export type ConvexAuthNuxt = ReturnType<typeof setupConvexAuthNuxt>
