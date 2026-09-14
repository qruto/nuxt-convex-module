import { useRuntimeConfig } from '#imports'

/**
 * Nuxt `useState` key the Better Auth server plugin stashes the SSR-prefetched
 * Convex JWT under, read back by the client plugin and `useAsyncQuery`. Lives
 * here, dependency-free, so the core composable can read the token without
 * importing the integration.
 */
export const CONVEX_INITIAL_TOKEN_KEY = 'convex:initialToken'

type ConvexRuntimeConfig = {
  convex?: {
    siteUrl?: string
  }
  public?: {
    convex?: {
      url?: string
      siteUrl?: string
    }
  }
}

/**
 * The module's runtime config, tolerating a missing Nuxt context (a plain
 * server import outside a request) by returning an empty object.
 */
export function getConvexRuntimeConfig() {
  try {
    const config = useRuntimeConfig() as ConvexRuntimeConfig
    return {
      url: config.public?.convex?.url,
      siteUrl: config.convex?.siteUrl || config.public?.convex?.siteUrl,
    }
  }
  catch {
    return {}
  }
}
