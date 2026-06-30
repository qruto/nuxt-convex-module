/**
 * Public Vue API for the opt-in Better Auth integration — a Vue/Nuxt port of
 * `@convex-dev/better-auth`'s `react` integration.
 *
 * @module
 */

export { useAuth, type UseAuthService, type AuthSession } from './use-auth'
export { authClient, type AuthClient } from './client'
export { usePreloadedAuthQuery } from './hydration'
export { consumeCrossDomainOneTimeToken } from './cross-domain'
export { AuthBoundary } from './auth-boundary'
