// PARITY: A-14
import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import { convexAuth } from './server'

const METHODS = ['GET', 'HEAD', 'POST', 'OPTIONS']

/**
 * Proxy all `${convex.betterAuth.authRoute}/**` requests (default `/api/auth/**`) to the
 * Convex site URL. This keeps auth cookies on the same origin (no CORS issues).
 *
 * The site URL is `convexAuth`'s to resolve: `runtimeConfig.public.convex.siteUrl`,
 * then the environment — so a container built without it and started with
 * `NUXT_PUBLIC_CONVEX_SITE_URL` works.
 *
 * The method list matches the nuxt-security route rule the module registers on this
 * route; enforcing it here too keeps the proxy closed to `PUT`/`DELETE` probes when
 * nuxt-security is not installed.
 *
 * The path check: Nitro 2 routes the request's raw path, and the handler forwards
 * the URL-normalised one. `/api/auth/../../x` (or its `%2e%2e` spelling) matches
 * this route and normalises to `/x`, which the proxy would send to the site
 * origin — any HTTP action on the deployment, reached through the app's origin
 * with the app's cookies attached. Next.js normalises before routing, so
 * upstream's handler never sees such a path; Nitro 2 does not, so a dot segment
 * in the part of the path this route matched is refused here.
 */
export default defineEventHandler(async (event) => {
  if (!METHODS.includes(event.req.method)) {
    throw createError({ status: 405, statusText: 'Method Not Allowed' })
  }
  const matched = getRouterParam(event, '_', { decode: true }) ?? ''
  if (matched.split(/[/\\]/).some(segment => segment === '.' || segment === '..')) {
    throw createError({ status: 400, statusText: 'Bad Request' })
  }
  return convexAuth(event).handler()
})
