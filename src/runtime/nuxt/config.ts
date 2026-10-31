import { useRuntimeConfig } from '#imports'

/**
 * Nuxt `useState` key the Better Auth server plugin stashes the SSR-prefetched
 * Convex JWT under, read back by the client plugin and `useAsyncQuery`. Lives
 * here, dependency-free, so the core composable can read the token without
 * importing the integration.
 */
export const CONVEX_INITIAL_TOKEN_KEY = 'convex:initialToken'

/**
 * Close a server render's Convex client once its request is done, rendered
 * or failed. Anything that opened the client's connection during the render
 * would otherwise leave a WebSocket open from the server, one per request.
 *
 * @internal
 */
export function closeAfterRender(
  nuxtApp: { hook: (name: 'app:rendered' | 'app:error', fn: () => void) => unknown },
  client: { close: () => Promise<void> },
): void {
  const close = () => void client.close()
  nuxtApp.hook('app:rendered', close)
  nuxtApp.hook('app:error', close)
}

type ConvexRuntimeConfig = {
  public?: {
    convex?: {
      url?: string
      siteUrl?: string
      authRoute?: string
    }
  }
}

/**
 * The module's runtime config, tolerating a missing Nuxt context (a plain
 * server import outside a request) by returning an empty object.
 *
 * Given a server route's event, it reads that request's config: an
 * environment variable set after the server started (by a Nitro plugin, say)
 * reaches it, where the config read without one was fixed at startup.
 */
export function getConvexRuntimeConfig(event?: unknown) {
  try {
    const config = (useRuntimeConfig as (event?: unknown) => unknown)(event) as ConvexRuntimeConfig
    return {
      url: config.public?.convex?.url,
      siteUrl: config.public?.convex?.siteUrl,
      authRoute: config.public?.convex?.authRoute,
    }
  }
  catch {
    return {}
  }
}
