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
export default defineNuxtPlugin((nuxtApp) => {
  const url = useRuntimeConfig().public.backend.url

  if (!url) {
    if (import.meta.client) {
      console.warn('[nuxt-convex] No Convex URL configured; client not created.')
    }
    return
  }

  const client = new ConvexVueClient(url)
  nuxtApp.vueApp.provide(ConvexClientKey, client)

  if (import.meta.client) {
    window.addEventListener('beforeunload', () => {
      void client.close()
    })
  }
})
