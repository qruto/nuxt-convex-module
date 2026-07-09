import { defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { convexAuth } from './server'

/**
 * Proxy all /api/auth/* requests to the Convex site URL.
 * This keeps auth cookies on the same origin (no CORS issues).
 */
export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const siteUrl = config.convex.siteUrl

  if (!siteUrl) {
    throw new Error('[nuxt-convex-module] NUXT_PUBLIC_CONVEX_SITE_URL is not configured. Auth proxy cannot forward requests.')
  }

  return convexAuth(event, { convexSiteUrl: siteUrl }).handler()
})
