import { defineNuxtPlugin } from '#app'
import { inject, watchEffect } from 'vue'
import { ConvexClientKey } from '../vue/client'
import { ConvexAuthStateKey } from '../vue/auth/index'
import { createConvexDevtoolsBridge } from './bridge'
import type { ConvexDevtoolsBridge } from './types'

declare global {
  interface Window {
    __NUXT_CONVEX_DEVTOOLS__?: ConvexDevtoolsBridge
  }
}

// Dev-only (the module registers this plugin only in dev, appended so it runs
// after whichever plugin created the Convex client — the base plugin or Better
// Auth's). It looks the client up instead of creating one, so it attaches
// identically on every client-provisioning path without touching ported files.
export default defineNuxtPlugin({
  name: 'nuxt-convex:devtools',
  setup(nuxtApp) {
    const attach = (): boolean => {
      const client = nuxtApp.vueApp.runWithContext(() => inject(ConvexClientKey, undefined))
      if (!client) return false

      const bridge = createConvexDevtoolsBridge(client)

      // Better Auth provides its auth state at the app level; Clerk/Auth0
      // provide at component level, invisible from here — the panel shows
      // adapter presence (via server RPC) with state "unavailable" for those.
      const auth = nuxtApp.vueApp.runWithContext(() => inject(ConvexAuthStateKey, undefined))
      if (auth) {
        watchEffect(() => {
          bridge.setAuth({
            available: true,
            isLoading: auth.isLoading.value,
            isAuthenticated: auth.isAuthenticated.value,
            isRefreshing: auth.isRefreshing.value,
          })
        })
      }

      // The DevTools iframe reads the bridge from the host app: primarily via
      // `client.host.nuxt.$convexDevtools`, with the window global as fallback.
      nuxtApp.provide('convexDevtools', bridge)
      window.__NUXT_CONVEX_DEVTOOLS__ = bridge
      return true
    }

    // A misconfigured app (e.g. no deployment URL) never provides a client —
    // retry once after mount, then give up quietly; the panel shows guidance.
    if (!attach()) {
      nuxtApp.hook('app:mounted', () => {
        attach()
      })
    }
  },
})
