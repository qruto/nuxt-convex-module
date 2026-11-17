import { defineEventHandler, getRequestURL } from 'nuxt/server'
import { useRuntimeConfig } from '#imports'
import auth from '#convex/auth-server'
import { CONVEX_AUTH_ROUTE } from './route'

/**
 * Server middleware: upstream's `proxy.ts`, with its matcher. Runs the
 * up-front refresh on everything except the auth routes, which own their
 * cookies.
 */
export default defineEventHandler(async (event) => {
  // Nitro mounts the routes under the app's base URL.
  // `nuxt/server`'s event, which `useRuntimeConfig`'s h3 typing predates.
  const config = (useRuntimeConfig as (event: unknown) => { app?: { baseURL?: string } })(event)
  const base = (config.app?.baseURL ?? '/').replace(/\/+$/, '')
  if (getRequestURL(event).pathname.startsWith(`${base}${CONVEX_AUTH_ROUTE}/`)) return
  await auth.convexAuthNuxtProxy(event)
})
