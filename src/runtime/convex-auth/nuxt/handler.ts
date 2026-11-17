import { createError, defineEventHandler, getRouterParam } from 'nuxt/server'
import auth from '#convex/auth-server'

const HANDLERS = {
  signin: 'convexProxyHandler',
  refresh: 'refreshHandler',
  signout: 'signOutHandler',
} as const

/**
 * The three auth routes upstream has an app mount by hand, as one handler on
 * `${CONVEX_AUTH_ROUTE}/:action`. Each is the framework-agnostic
 * `(Request) => Response` handler from `@convex-dev/auth/ssr`, configured by
 * the app's `server/convex-auth.ts`. A fourth, `session`, is the module's own.
 */
export default defineEventHandler((event) => {
  const action = getRouterParam(event, 'action') ?? ''
  // PARITY: N-17
  // The module's own: the name a page the server did not render subscribes to.
  if (action === 'session') return { isAuthenticatedFunctionName: auth.isAuthenticatedFunctionName }
  if (!Object.hasOwn(HANDLERS, action)) {
    throw createError({ status: 404, statusText: 'Not Found' })
  }
  return auth[HANDLERS[action as keyof typeof HANDLERS]](event.req)
})
