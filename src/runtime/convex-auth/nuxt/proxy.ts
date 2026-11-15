import { defineEventHandler, getRequestURL } from 'nuxt/server'
import auth from '#convex/auth-server'
import { CONVEX_AUTH_ROUTE } from './route'

/**
 * Server middleware: upstream's `proxy.ts`, with its matcher. Runs the
 * up-front refresh on everything except the auth routes, which own their
 * cookies.
 */
export default defineEventHandler(async (event) => {
  if (getRequestURL(event).pathname.startsWith(`${CONVEX_AUTH_ROUTE}/`)) return
  await auth.convexAuthNuxtProxy(event)
})
