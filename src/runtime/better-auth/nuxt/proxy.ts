// PARITY: A-14
import { assertMethod, defineEventHandler } from 'h3'
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
 */
export default defineEventHandler(async (event) => {
  assertMethod(event, ['GET', 'HEAD', 'POST', 'OPTIONS'])
  return convexAuth(event).handler()
})
