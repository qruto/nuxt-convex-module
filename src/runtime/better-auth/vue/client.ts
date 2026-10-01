import { convexClient } from '@convex-dev/better-auth/client/plugins'
import { createAuthClient } from 'better-auth/vue'

// Bundled default client — the zero-config Nuxt analog of upstream's
// "author your own `authClient` and pass it to `ConvexBetterAuthProvider`".
// Carries only `convexClient()`, the one plugin the integration itself needs
// (token fetching). Point `convex.betterAuth.authClient` at your own module
// to add app-level plugins (OTP, passkeys, cross-domain, ...).
//
// The annotation is the type `createAuthClient` infers, named. Without it the
// declaration file spells out the whole server-plugin type (19.7 KB of it).
// It goes through `createAuthClient` rather than better-auth's own
// `VueAuthClient`, which only exists from 1.6.20 on; the peer range starts at
// 1.6.11.
export const authClient: ReturnType<typeof createAuthClient<{ plugins: ReturnType<typeof convexClient>[] }>> = createAuthClient({
  plugins: [convexClient()],
})

// The Vue/Nuxt analog of upstream's generic `AuthClient` union
// (`AuthClientWithPlugins<PluginsWith/WithoutCrossDomain>`): the
// `#convex/auth-client` alias substitutes the app's own client module, so this
// type is exactly as wide as the plugins the app's client installs — the
// integration itself is plugin-agnostic beyond `convexClient()`.
export type AuthClient = typeof authClient
