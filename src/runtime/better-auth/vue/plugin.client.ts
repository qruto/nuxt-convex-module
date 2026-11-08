import { defineNuxtPlugin, useRuntimeConfig, useState } from '#app'
import { ConvexVueClient, ConvexClientKey } from '../../vue/client'
import { ConvexAuthStateKey, createScopedConvexAuthState } from '../../vue/auth/index'
import { CONVEX_INITIAL_TOKEN_KEY } from '../../nuxt/config'
import { settleSessionWithoutClient, useBetterAuth } from './use-better-auth'
import { deferAuthClient } from './auth-client-loader'
import { NO_SESSION_KEY } from './token-store'
import { consumeCrossDomainOneTimeToken } from './cross-domain'

/** Whether this browser's storage holds a session the cross-domain client plugin saved: `<prefix>_cookie`. */
function holdsCrossDomainSession(): boolean {
  try {
    for (let index = 0; index < localStorage.length; index++) {
      const key = localStorage.key(index)
      if (key?.endsWith('_cookie') && localStorage.getItem(key)?.includes('session_token')) return true
    }
  }
  catch {
    // Storage the browser refuses to open holds nothing to read.
  }
  return false
}

export default defineNuxtPlugin({
  name: 'nuxt-convex-module:better-auth:client',
  async setup(nuxtApp) {
    const { url, crossDomainCallbackRoute } = useRuntimeConfig().public.convex

    if (!url) {
      console.warn('[nuxt-convex-module] No Convex deployment URL configured — client and auth not created. Set NUXT_PUBLIC_CONVEX_URL or `convex.url` in nuxt.config.')
      return
    }

    const client = new ConvexVueClient(url)
    nuxtApp.vueApp.provide(ConvexClientKey, client)

    // PARITY: D-18
    // The server saw no session: the Better Auth client waits for a first use
    // (a call on it, a token request, a guarded route), and the session reads
    // signed out once the page has hydrated. Not for a cross-domain session,
    // which lives in this browser's storage where the server cannot see it,
    // nor for a one-time token, which needs the client now.
    if (useState<boolean>(NO_SESSION_KEY, () => false).value && !new URL(window.location.href).searchParams.has('ott') && !holdsCrossDomainSession()) {
      deferAuthClient()
      nuxtApp.hook('app:suspense:resolve', settleSessionWithoutClient)
    }

    // Hydrate the session before wiring auth so Convex sees a valid token
    // on the very first `setAuth()` call after a cross-domain redirect.
    await consumeCrossDomainOneTimeToken({
      callbackRoute: crossDomainCallbackRoute || undefined,
    })

    // Read the SSR-prefetched token from the Nuxt payload. Mirrors the React
    // integration's `initialToken={await getToken()}` prop.
    const initialToken = useState<string | null>(CONVEX_INITIAL_TOKEN_KEY, () => null)

    const { state, scope } = createScopedConvexAuthState({
      client,
      useAuth: () => useBetterAuth(initialToken.value),
    })
    nuxtApp.vueApp.provide(ConvexAuthStateKey, state)

    // No teardown on `beforeunload` — the event is cancelable and fires before
    // the user answers the unsaved-changes dialog, so closing the client here
    // would drop in-flight mutations when the user chooses to stay (upstream
    // never closes on unload). `scope` lives for the app's lifetime.
    void scope
  },
})
