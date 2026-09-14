// PARITY: A-14
import { assertMethod, createError, defineEventHandler, toWebRequest } from 'h3'
import { convexAuth } from './server'

/**
 * Proxy all /api/auth/* requests to the Convex site URL.
 * This keeps auth cookies on the same origin (no CORS issues).
 *
 * The site URL is `convexAuth`'s to resolve: the private `runtimeConfig.convex.siteUrl`,
 * then the public one, then the environment — so a container built without it and
 * started with `NUXT_PUBLIC_CONVEX_SITE_URL` works. Reading only the private key here
 * used to fail every auth request in exactly that deployment.
 *
 * The method list matches the nuxt-security route rule the module registers on this
 * route; enforcing it here too keeps the proxy closed to `PUT`/`DELETE` probes when
 * nuxt-security is not installed.
 *
 * The path check: h3 routes the request's raw path, and the handler forwards the
 * URL-normalised one. `/api/auth/../../x` (or its `%2e%2e` spelling) matches this
 * route and normalises to `/x`, which the proxy would send to the site origin —
 * any HTTP action on the deployment, reached through the app's origin with the
 * app's cookies attached. Next.js normalises before routing, so upstream's
 * handler never sees such a path; Nitro does not, so it is refused here.
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, ['GET', 'HEAD', 'POST', 'OPTIONS'])
  const routed = event.path.split('?')[0]
  const forwarded = new URL(toWebRequest(event).url).pathname
  if (forwarded !== routed) {
    throw createError({ statusCode: 400, statusMessage: 'Bad Request' })
  }
  return convexAuth(event).handler()
})
