import { computed } from 'vue'
import { setResponseHeader } from 'h3'
import { defineNuxtPlugin, useRuntimeConfig, useState, useRequestEvent } from '#app'
import { ConvexVueClient, ConvexClientKey } from '../../vue/client'
import { CONVEX_INITIAL_TOKEN_KEY } from '../../nuxt/config'
import { convexAuth } from '../nuxt/server'
import { ConvexAuthStateKey, type ConvexAuthState } from '../../vue/auth/index'

/**
 * Prefetch the Convex JWT for SSR and stash it in `initialToken`.
 *
 * Exported for unit tests.
 * @internal
 */
export async function prefetchAuthToken(
  event: ReturnType<typeof useRequestEvent>,
  initialToken: ReturnType<typeof useState<string | null>>,
) {
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
      setResponseHeader(event, 'Cache-Control', 'private, no-store')
    }
  }
  catch (error) {
    console.warn('[nuxt-convex-module] Failed to prefetch auth token for SSR:', error)
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

    // Provide a Convex client on SSR so composables like `useMutation` /
    // `useAction` that call `useConvex()` during component setup don't throw.
    // The WebSocket is opened lazily on first subscription — `usePreloadedQuery`
    // and `usePreloadedAuthQuery` short-circuit on the server, so no
    // subscriptions are created during SSR.
    const url = useRuntimeConfig().public.convex.url
    const ssrClient = url ? new ConvexVueClient(url) : undefined
    if (ssrClient) {
      nuxtApp.vueApp.provide(ConvexClientKey, ssrClient)
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
      await prefetchAuthToken(event, initialToken)
    }
  },
})
