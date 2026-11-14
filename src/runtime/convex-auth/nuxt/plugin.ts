/**
 * Client bindings for Convex Auth on Nuxt: a port of
 * `@convex-dev/auth/ssr/nextjs`'s `client.tsx` and of the server provider
 * that renders it, as one Nuxt plugin.
 *
 * When running under SSR, authentication is performed for two parties:
 *
 *  1. The Convex client (for all of the reactive/transactional client-side
 *     goodness)
 *  2. The browser itself (for authenticated requests to the SSR host)
 *
 * Under SSR the refresh token lives only in a server-only httpOnly cookie, so
 * client JS can only read the access token. The plugin configures the core
 * {@link AuthClient} in that mode: it refreshes and signs out by POSTing to
 * the SSR host's auth routes (which read the cookie) rather than talking to
 * Convex directly.
 *
 * Sign-in likewise runs on the server, but methods need no SSR-specific
 * composable for it. The plugin supplies an {@link AuthSignInApi} backed by a
 * `ConvexHttpClient` aimed at the SSR host's auth proxy, so the normal client
 * composable of a method works unchanged: the proxy mints the session, stashes
 * the refresh token in the cookie, and returns an access-only bundle for the
 * client to authenticate to Convex with.
 */
import type { IsAuthenticatedFn } from '@convex-dev/auth'
import { AuthClient, defaultStorage } from '@convex-dev/auth/browser'
import type { AuthSessionResponse } from '@convex-dev/auth/ssr'
import { defineNuxtPlugin, useRequestEvent, useResponseHeader, useState } from '#app'
import { ConvexHttpClient } from 'convex/browser'
import { makeFunctionReference } from 'convex/server'
import { computed, inject } from 'vue'
import { CONVEX_INITIAL_TOKEN_KEY } from '../../nuxt/config'
import { ConvexAuthStateKey, createScopedConvexAuthState, type ConvexAuthState } from '../../vue/auth/index'
import { ConvexClientKey } from '../../vue/client'
import type { AuthSignInApi } from '../upstream/browser/ambientSignInClient'
import { oauth } from '../upstream/methods/oauth/client'
import { provideAuth, useSessionWatcher } from '../vue/client'
import { CONVEX_AUTH_ROUTE } from './route'
import type { ConvexAuthNuxtContext } from './server'

/** `useState` key for the name of the app's `isAuthenticated` query. */
const IS_AUTHENTICATED_KEY = 'convex:auth:isAuthenticated'

/**
 * POST to the refresh or sign-out route and read back the access-only bundle.
 *
 * These two have their own handlers rather than going through the auth proxy,
 * because the refresh token they need is in the cookie rather than in any
 * argument the client could pass. Both reply with an
 * {@link AuthSessionResponse} on failure as on success (a dead session is a 401
 * carrying `tokens: null`), so the body is parsed regardless of status. Anything
 * without a JSON body degrades to `tokens: null`.
 */
async function postAuth(route: string): Promise<AuthSessionResponse> {
  // fallow-ignore-next-line security-sink -- one of the module's own same-origin routes; verified 2026-11-15
  const res = await fetch(route, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{}',
  })
  return (await res
    .json()
    .catch(() => ({ tokens: null }))) as AuthSessionResponse
}

export default defineNuxtPlugin({
  name: 'nuxt-convex-module:convex-auth',
  setup(nuxtApp) {
    // The module appends this plugin, so the client plugin has run. No client
    // means no deployment URL, which that plugin reports.
    const convex = inject(ConvexClientKey, undefined)
    if (convex === undefined) return

    // What upstream's server provider passes its client provider as props
    // reaches the browser in the payload: the access token from the SSR host,
    // so the Convex client hydrates ready to authenticate, and the name of
    // the app's `isAuthenticated` query.
    const initialToken = useState<string | null>(CONVEX_INITIAL_TOKEN_KEY, () => null)
    const isAuthenticatedFunctionName = useState<string | null>(IS_AUTHENTICATED_KEY, () => null)
    if (import.meta.server) {
      const refreshed = (useRequestEvent()?.context as { convexAuth?: ConvexAuthNuxtContext } | undefined)?.convexAuth
      if (refreshed) {
        initialToken.value = refreshed.token
        isAuthenticatedFunctionName.value = refreshed.isAuthenticatedFunctionName
        // The page carries this visitor's token, so no cache may hand it to
        // another one.
        if (refreshed.token) useResponseHeader('Cache-Control').value = 'private, no-store'
      }
    }

    // Sign-in goes to the auth proxy so the minted refresh token can be
    // moved into an httpOnly cookie server-side. The proxy speaks the
    // `ConvexHttpClient` wire format, so this is a real Convex client pointed at
    // the SSR host: no bespoke request shape, and args and errors keep their
    // encoding. The address is relative, hence skipping the URL check, and
    // same-origin fetch sends the auth cookies automatically. The trailing
    // `?path=` puts the endpoint the client appends into the query string, so
    // the sign-in route can be a static route rather than a catch-all.
    const proxy = new ConvexHttpClient(`${CONVEX_AUTH_ROUTE}/signin?path=`, {
      skipConvexDeploymentUrlCheck: true,
      logger: convex.logger,
    })
    // Attach the current access token per call: a sign-in typically runs
    // unauthenticated, but a function may want the existing identity (e.g. to
    // link an account to the signed-in user). `authClient` is assigned below,
    // after `signInApi`, because the two reference each other: the api reads
    // the client's token, and the client hands the api to its ambient setups.
    // Those setups run inside the constructor, so the read must stay lazy.
    // eslint-disable-next-line prefer-const -- read by `withAuth` before it is assigned
    let authClient: AuthClient
    const withAuth = () => {
      const token = authClient.getAccessToken()
      if (token !== null) proxy.setAuth(token)
      else proxy.clearAuth()
      return proxy
    }
    const signInApi: AuthSignInApi = {
      mutation: (fn, args) => withAuth().mutation(fn, args),
      action: (fn, args) => withAuth().action(fn, args),
    }
    authClient = new AuthClient({
      mode: 'ssr',
      authApi: {
        // The refresh token is read from the httpOnly cookie when it reaches the SSR host.
        refreshSession: async () => (await postAuth(`${CONVEX_AUTH_ROUTE}/refresh`)).tokens,
        signOut: async () => {
          await postAuth(`${CONVEX_AUTH_ROUTE}/signout`)
        },
      },
      storage: defaultStorage(),
      storageNamespace: convex.url,
      // The SSR host may have refreshed on our behalf, so this is the freshest
      // access token; the client adopts it on init.
      initialAccessToken: initialToken.value,
      ambientSignIns: {
        signIns: [oauth()],
        signInApi,
        // Calls that don't return a sign-in envelope, like starting an OAuth
        // flow, go to the deployment because the proxy refuses them.
        convex: { mutation: (fn, args) => convex.mutation(fn, args) },
      },
    })

    const auth = provideAuth({ authClient, signInApi }, {
      provide: (key, value) => {
        nuxtApp.vueApp.provide(key, value)
      },
      // Upstream starts in an effect, which runs once the tree has hydrated.
      // `app:mounted` is too early for that: a page with an async `setup`
      // hydrates when the root `<Suspense>` resolves, and a session loaded
      // before then renders a signed-in page over the server's loading one.
      onMounted: (start) => {
        const stop = nuxtApp.hook('app:suspense:resolve', () => {
          stop()
          start()
        })
      },
      // The app lives as long as the page does.
      onUnmounted: () => {},
    })

    if (import.meta.server) {
      // A server render reports the loading state, as upstream's does.
      const ssrAuthState: ConvexAuthState = {
        isLoading: computed(() => true),
        isAuthenticated: computed(() => false),
        isRefreshing: computed(() => false),
      }
      nuxtApp.vueApp.provide(ConvexAuthStateKey, ssrAuthState)
      return
    }

    const { state, scope } = createScopedConvexAuthState({ client: convex, useAuth: () => auth })
    nuxtApp.vueApp.provide(ConvexAuthStateKey, state)

    // A page the server did not render carries no payload, so no name: the
    // session is then checked at the next refresh instead.
    const name = isAuthenticatedFunctionName.value
    if (name !== null) {
      scope.run(() => useSessionWatcher(authClient, makeFunctionReference(name) as IsAuthenticatedFn, state))
    }
  },
})
