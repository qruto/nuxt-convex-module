---
title: API Reference
description: Every auto-imported composable, component, and server helper, plus the generated TypeScript reference for each published module.
navigation: false
seo:
  title: Convex module API reference for Nuxt
---

Two hand-written index pages and the generated TypeDoc output.

- [App Auto-imports](/api-reference/auto-imports) — every composable and component auto-imported into pages, components, and composables.
- [Server Auto-imports](/api-reference/server-imports) — every helper auto-imported into Nitro server code.
- [Generated Reference](/api-reference/reference) — full TypeScript signatures for `client`, `app`, `server`, and each integration subpath.

For prose explanations of the same surface, start with the [Guide](/guide/queries).

## Subpath exports

Everything is auto-imported in Nuxt, but each surface is also a real subpath export of `nuxt-convex-module` — for explicit or type-only imports, and for a [plain Vue](/guide/plain-vue) app. Entries follow client/server naming, mirroring upstream's `convex/react` and `convex/nextjs` split.

A [plain Vue](/guide/plain-vue) app imports the same files under Vue-named subpaths, listed on that page.

| Import path | Contents |
|---|---|
| `nuxt-convex-module` | the Nuxt module (for `modules: []`) |
| `nuxt-convex-module/client` | `ConvexVueClient`, `ConvexClientKey`, every composable (`useQuery`, `useMutation`, `useAction`, pagination, upload, …), auth (`provideConvexWithAuth`, `useConvexAuth`, `<Authenticated>` …), `usePreloadedQuery`, and all public types |
| `nuxt-convex-module/server` | Nitro/server: `fetchQuery`, `fetchMutation`, `fetchAction`, `preloadQuery`, `preloadedQueryResult` |
| `nuxt-convex-module/app` | Nuxt app context: `useAsyncQuery`, `useAsyncPaginatedQuery` and their `useConvex*` twins, with the `AsyncQuery*` and `AsyncPaginatedQuery*` types |
| `nuxt-convex-module/testing` | for your own tests, and not auto-imported: `import { resetBetterAuthState } from 'nuxt-convex-module/testing'`, which forgets the token cache and session subscription Better Auth keeps for the app's lifetime. Load it in `@nuxt/test-utils`' `nuxt` environment |
| `nuxt-convex-module/convex-auth/client` | `provideConvexAuth`, `<ConvexAuthProvider>`, `useAuthActions`, `useAuthToken` |
| `nuxt-convex-module/convex-auth/server` | Nitro/server: `setupConvexAuthNuxt(config)`, with the `ConvexAuthNuxtConfig` type |
| `nuxt-convex-module/convex-auth/methods/username-password` | `useSignInWithUsernamePassword`, `useSignUpWithUsernamePassword` |
| `nuxt-convex-module/convex-auth/methods/email-password` | `useSignInWithEmailPassword`, `useSignUpWithEmailPassword`, `useCompleteSignUpWithEmailPassword`, `useStartPasswordRecovery`, `useCompletePasswordRecovery`, `useStartChangeEmail`, `useCompleteChangeEmail` |
| `nuxt-convex-module/convex-auth/methods/oauth` | `useOauth`, and `oauth()` for a custom `ambientSignIns` |
| `nuxt-convex-module/convex-auth/methods/google` | `useSignInWithGoogle`, `useOauth` |
| `nuxt-convex-module/convex-auth/methods/apple` | `useSignInWithApple`, `useOauth` |
| `nuxt-convex-module/convex-auth/methods/github` | `useSignInWithGithub`, `useOauth` |
| `nuxt-convex-module/convex-auth/methods/username-passkey` | `useSignInWithUsernamePasskey`, `useAddPasskey`, `useRemovePasskey` |
| `nuxt-convex-module/convex-auth/methods/username-passkey/custom` | not auto-imported: `createUsernamePasskeyHooks(ceremonies)`, the same three composables on passkey ceremonies you provide, with the `PasskeyCeremonies` type |
| `nuxt-convex-module/clerk/client` | `provideConvexWithClerk`, `<ConvexProviderWithClerk>` |
| `nuxt-convex-module/auth0/client` | `provideConvexWithAuth0`, `<ConvexProviderWithAuth0>` |
| `nuxt-convex-module/better-auth/client` | `useBetterAuth`, `authClient`, `usePreloadedAuthQuery`, `consumeCrossDomainOneTimeToken`, `resolveAuthRedirect`, `<AuthBoundary>`, and the `convexClient` / `crossDomainClient` client plugins (re-exported from `@convex-dev/better-auth/client/plugins`) |
| `nuxt-convex-module/better-auth/server` | Nitro/server: `convexBetterAuthNuxt(event)` (auto-imported in server code; import explicitly for the `ConvexBetterAuthOptions` / `ConvexBetterAuthService` types) |
| `nuxt-convex-module/polar/client` | `<CheckoutLink>`, `<CustomerPortalLink>` |
| `nuxt-convex-module/presence/client` | `usePresence` (also the default export) |
| `nuxt-convex-module/presence/facepile` | `<FacePile>` (also the default export), with the package's stylesheet |
| `nuxt-convex-module/r2/client` | `useUploadFile` |
| `nuxt-convex-module/rate-limiter/client` | `useRateLimit` |

The core, Convex Auth, Clerk, Auth0, Polar and component entries are self-contained and work in a plain Vue app; `/better-auth/*`, `/convex-auth/server`, `/server`, `/app` and `/testing` rely on Nuxt-provided aliases, runtime config or `#app`, and need Nuxt.
