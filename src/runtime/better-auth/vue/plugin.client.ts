import { defineNuxtPlugin, useRuntimeConfig, useState } from '#app'
import { ConvexVueClient, ConvexClientKey } from '../../vue/client'
import { ConvexAuthStateKey, createScopedConvexAuthState } from '../../vue/auth/index'
import { useAuth } from './use-auth'
import { consumeCrossDomainOneTimeToken } from './cross-domain'

type ConvexNuxtInjection = {
  convex?: ConvexVueClient
}

export default defineNuxtPlugin<ConvexNuxtInjection>({
  name: 'nuxt-convex-module:better-auth:client',
  async setup(nuxtApp) {
    const url = useRuntimeConfig().public.backend.url

    if (!url) {
      console.warn('[nuxt-convex-module] No Convex URL configured for client plugin.')
      return { provide: {} }
    }

    const client = new ConvexVueClient(url)
    nuxtApp.vueApp.provide(ConvexClientKey, client)

    // Hydrate the session before wiring auth so Convex sees a valid token
    // on the very first `setAuth()` call after a cross-domain redirect.
    await consumeCrossDomainOneTimeToken()

    // Read the SSR-prefetched token from the Nuxt payload. Mirrors the React
    // integration's `initialToken={await getToken()}` prop.
    const initialToken = useState<string | null>('backend:initialToken', () => null)

    const { state, scope } = createScopedConvexAuthState({
      client,
      useAuth: () => useAuth(initialToken.value),
    })
    nuxtApp.vueApp.provide(ConvexAuthStateKey, state)

    // No teardown on `beforeunload` — the event is cancelable and fires before
    // the user answers the unsaved-changes dialog, so closing the client here
    // would drop in-flight mutations when the user chooses to stay (upstream
    // never closes on unload). `scope` lives for the app's lifetime.
    void scope

    return {
      provide: {
        convex: client,
      },
    }
  },
})
