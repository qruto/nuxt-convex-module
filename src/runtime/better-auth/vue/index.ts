/**
 * Public client-side API for the opt-in Better Auth integration — a Vue/Nuxt
 * port of `@convex-dev/better-auth`'s `react` integration.
 *
 * @module better-auth/client
 */

export { useAuth, type UseAuthService, type AuthSession, type AuthUser } from './use-auth'
// Resolves to your app's client (`convex.betterAuth.authClient`) or the bundled
// default — see `#convex/auth-client` in the module. Routing the public export
// through the same alias keeps a single client instance across the app.
export { authClient, type AuthClient } from '#convex/auth-client'
export { usePreloadedAuthQuery } from './hydration'
export { consumeCrossDomainOneTimeToken } from './cross-domain'
export { AuthBoundary } from './auth-boundary'

// Convex-specific Better Auth client plugins, re-exported so you can assemble a
// custom auth client (pointed at via `convex.betterAuth.authClient`) from a
// single import. Add `crossDomainClient()` to opt into cross-domain auth.
export { convexClient, crossDomainClient } from '@convex-dev/better-auth/client/plugins'
