import { defineEventHandler, getRequestURL } from 'nuxt/server'
import auth from '#convex/auth-server'
import { CONVEX_AUTH_ROUTE } from './route'

/**
 * Server middleware: upstream's `proxy.ts`, with its matcher. Runs the
 * up-front refresh on everything except the auth routes, which own their
 * cookies.
 */
export default defineEventHandler(async (event) => {
  // `includes`, not `startsWith`: Nitro mounts the routes under the app's base URL.
  if (getRequestURL(event).pathname.includes(`${CONVEX_AUTH_ROUTE}/`)) return
  await auth.convexAuthNuxtProxy(event)
})
