import { defineNuxtPlugin, useRuntimeConfig } from '#app'
import { ConvexVueClient, ConvexClientKey } from './client'

/**
 * Base Convex client bootstrap.
 *
 * Creates a {@link ConvexVueClient} from the configured deployment URL and
 * provides it app-wide (server and client) so the data composables
 * (`useQuery`, `useMutation`, `useAction`, ...) — and the Clerk / Auth0 auth
 * adapters — can resolve a client via `useConvex()`.
 *
 * This runs only when no auth integration is managing the client. When Better
 * Auth is installed, its own `plugin.client` / `plugin.server` create and
 * provide the client (alongside session hydration), so the module registers
 * those instead of this one — see `registerIntegrations` in `src/module.ts`.
 *
 * The WebSocket opens lazily on the first subscription; on the server the
 * preloaded-query helpers short-circuit, so no socket is opened during SSR.
 */
export default defineNuxtPlugin({
  name: 'nuxt-convex-module:client',
  setup(nuxtApp) {
    const url = useRuntimeConfig().public.convex.url

    if (!url) {
      if (import.meta.client) {
        console.warn('[nuxt-convex-module] No Convex URL configured; client not created.')
      }
      return
    }

    const client = new ConvexVueClient(url)
    nuxtApp.vueApp.provide(ConvexClientKey, client)

    // No teardown on `beforeunload` — upstream never closes the client there.
    // The event is cancelable: it fires BEFORE the user answers the
    // unsaved-changes dialog (the client's own `unsavedChangesWarning`), so
    // closing here would drop in-flight mutations exactly when the user chose
    // to stay. The browser tears the socket down on a real navigation anyway.
  },
})
