import { computed } from 'vue'
import { defineNuxtPlugin, useRuntimeConfig, useState, useRequestEvent, useRequestHeaders, useResponseHeader } from '#app'
import { ConvexVueClient, ConvexClientKey } from '../../vue/client'
import { CONVEX_INITIAL_TOKEN_KEY, closeAfterRender } from '../../nuxt/config'
import { convexAuth } from '../nuxt/server'
import { ConvexAuthStateKey, type ConvexAuthState } from '../../vue/auth/index'
import { BetterAuthTokenStoreKey, createBetterAuthTokenStore, hasSessionCookie, NO_SESSION_KEY, seedInitialToken } from './token-store'

/**
 * Prefetch the Convex JWT for SSR and stash it in `initialToken`. Resolves
 * `true` once the deployment answered, `false` when the prefetch failed.
 *
 * Exported for unit tests.
 * @internal
 */
export async function prefetchAuthToken(
  event: ReturnType<typeof useRequestEvent>,
  initialToken: ReturnType<typeof useState<string | null>>,
  cacheControl: { value: unknown },
): Promise<boolean> {
  try {
    const token = await convexAuth(event!).getToken()
    initialToken.value = token ?? null
    if (token && event) {
      // The token is serialized into the client-readable SSR payload
      // (`window.__NUXT__`), and any `preloadAuthQuery` data rides the same
      // payload — so this response body carries a per-user secret. Forbid
      // shared/browser caching by default so an authenticated page can never
      // be replayed to a different user from a CDN or proxy. Set early enough
      // that a route with stricter needs can still override it.
      cacheControl.value = 'private, no-store'
    }
    return true
  }
  catch (error) {
    console.warn('[nuxt-convex-module] Failed to prefetch auth token for SSR:', error)
    return false
  }
}

// PARITY: D-18
/** The parts of a request event `isSharedRender` reads. */
export interface RenderContext {
  /** Nitro's matched route rules (`event.context._nitro.routeRules`), `swr`/`isr` normalised into `cache`. */
  routeRules?: Record<string, unknown>
  /** Set by Nitro's cached handler on the render it caches (`event.context.cache`). */
  cache?: unknown
  /** The response's caching headers as the render sees them, by lower-case name. */
  headers?: Record<string, unknown>
}

const CACHING_HEADERS = ['cache-control', 'cdn-cache-control', 'surrogate-control'] as const

/** A header's value as one string; `''` when unset. */
function headerText(value: unknown): string {
  if (Array.isArray(value)) return value.join(',')
  return typeof value === 'string' || typeof value === 'number' ? String(value) : ''
}

/** Whether a caching header lets a cache other than this browser's keep the response. */
function storesForOthers(name: (typeof CACHING_HEADERS)[number], value: string): boolean {
  const directives = value.toLowerCase().split(',').map(directive => directive.trim().split('=')[0]!).filter(Boolean)
  if (directives.length === 0 || directives.includes('private') || directives.includes('no-store')) return false
  // CDN-Cache-Control and Surrogate-Control speak only to shared caches.
  if (name !== 'cache-control') return true
  return directives.includes('public') || directives.includes('s-maxage') || directives.includes('max-age')
}

/**
 * Whether this render may be served to other visitors: Nitro caches it (its
 * cached handler marks the render, or a `cache`/`swr`/`isr`/`prerender`
 * rule matches), or a caching header lets a shared cache keep it. Nitro's
 * cached handler renders with no cookie (only the `varies` headers reach
 * it), so a cached render always looks signed out: its payload must not tell
 * every browser that reads it there is no session. Read off Nitro's own
 * rules, not `getRouteRules()` from `#app`, which folds the caching rules
 * into `payload`.
 *
 * Exported for unit tests.
 * @internal
 */
export function isSharedRender({ routeRules = {}, cache, headers = {} }: RenderContext): boolean {
  // `payload`: what Nuxt folds `cache`/`swr`/`isr` into, should a merged rule set carry it.
  if (cache || routeRules.cache || routeRules.swr || routeRules.isr || routeRules.prerender || routeRules.payload) return true
  const ruleHeaders = Object.fromEntries(Object.entries((routeRules.headers ?? {}) as Record<string, unknown>).map(([name, value]) => [name.toLowerCase(), value]))
  return CACHING_HEADERS.some(name => storesForOthers(name, headerText(headers[name])) || storesForOthers(name, headerText(ruleHeaders[name])))
}

/** What `isSharedRender` reads off this request. */
function renderContext(event: NonNullable<ReturnType<typeof useRequestEvent>>): RenderContext {
  const context = event.context as { _nitro?: { routeRules?: Record<string, unknown> }, cache?: unknown }
  return {
    routeRules: context._nitro?.routeRules,
    cache: context.cache,
    headers: Object.fromEntries(CACHING_HEADERS.map(name => [name, event.node?.res?.getHeader?.(name)])),
  }
}

/**
 * Server-side Better Auth bootstrap.
 *
 * Mirrors the Next.js parity layer that calls `getToken()` from the root
 * server layout and passes it as `initialToken` to `ConvexBetterAuthProvider`.
 *
 * The token is stashed into a Nuxt `useState` (`CONVEX_INITIAL_TOKEN_KEY`) so
 * the client plugin can hand it to `useBetterAuth(initialToken)` before the
 * first Convex `setAuth` call — avoiding an extra Better Auth round-trip on
 * first paint.
 */
export default defineNuxtPlugin({
  name: 'nuxt-convex-module:better-auth:server',
  async setup(nuxtApp) {
    const initialToken = useState<string | null>(CONVEX_INITIAL_TOKEN_KEY, () => null)

    // PARITY: D-13
    // This request's own token store for `useBetterAuth()`, seeded below with
    // the prefetched token: a signed-in visitor's render reads signed-in, as the
    // browser does from the same token, and no other visitor's render sees it.
    const tokenStore = createBetterAuthTokenStore()
    nuxtApp.vueApp.provide(BetterAuthTokenStoreKey, tokenStore)

    // Provide a Convex client on SSR so composables like `useMutation` /
    // `useAction` that call `useConvex()` during component setup don't throw.
    // The WebSocket is opened lazily on first subscription — `usePreloadedQuery`
    // and `usePreloadedAuthQuery` short-circuit on the server, so no
    // subscriptions are created during SSR.
    const url = useRuntimeConfig().public.convex.url
    const ssrClient = url ? new ConvexVueClient(url) : undefined
    if (ssrClient) {
      nuxtApp.vueApp.provide(ConvexClientKey, ssrClient)
      // PARITY: D-14
      closeAfterRender(nuxtApp, ssrClient)
    }

    // Provide a stub auth state for SSR so components calling `useConvexAuth`
    // (e.g. via `usePreloadedAuthQuery`) don't throw. `isLoading: true` makes
    // preloaded query helpers return the server-prefetched value during SSR
    // and defer the live query to the client plugin.
    const ssrAuthState: ConvexAuthState = {
      isLoading: computed(() => true),
      isAuthenticated: computed(() => false),
      isRefreshing: computed(() => false),
    }
    nuxtApp.vueApp.provide(ConvexAuthStateKey, ssrAuthState)

    // A prerendered page has no visitor, so there is no session to prefetch:
    // skip the per-route Better Auth round-trip (and, with no site URL, the
    // per-route warning). The payload is the same either way — a null token.
    const event = useRequestEvent()
    if (event && !import.meta.prerender) {
      // Taken before the await: the Nuxt context it needs is gone after it.
      const cacheControl = useResponseHeader('Cache-Control')
      const noSession = useState<boolean>(NO_SESSION_KEY, () => false)
      const { cookie } = useRequestHeaders(['cookie'])
      const answered = await prefetchAuthToken(event, initialToken, cacheControl)
      seedInitialToken(tokenStore, initialToken.value)
      // PARITY: D-18
      // No session cookie, and the deployment confirmed no token: the browser
      // can wait for a first use before it downloads the Better Auth client.
      // Never on a render other visitors may be served.
      noSession.value = answered && !initialToken.value && !hasSessionCookie(cookie)
        && !isSharedRender(renderContext(event))
      // A page may set a caching header as it renders, after this plugin ran:
      // check again once it has, before the payload is written.
      nuxtApp.hooks.hook('app:rendered', () => {
        if (noSession.value && isSharedRender(renderContext(event))) noSession.value = false
      })
    }
  },
})
