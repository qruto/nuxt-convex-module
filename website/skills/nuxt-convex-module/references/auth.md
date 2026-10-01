# Auth: Better Auth, Clerk, Auth0

Each integration switches on when its package is in the app's `package.json`. There is no `modules` entry to add, and the next dev run picks it up. Use one provider at a time: Better Auth together with Clerk or Auth0 gets a startup warning.

Every provider has two halves:

- **The Nuxt side**, which this module wires.
- **The Convex side**: functions and env vars on the deployment. That half is framework-independent, so Convex's guides for React apply unchanged. Convex's `convex-setup-auth` skill (`npx skills add get-convex/agent-skills`) covers it too.

Auth state is the same for every provider: `useConvexAuth()` → `isLoading`, `isAuthenticated`, and the `<Authenticated>`, `<Unauthenticated>`, `<AuthLoading>` and `<AuthRefreshing>` components. During SSR it reads as loading.

## Better Auth

```bash
npm i @convex-dev/better-auth better-auth
```

**What the module adds on its own:**

- a same-origin proxy at `/api/auth/**` to the Better Auth endpoints on the deployment's `.site` origin;
- a Better Auth client with `convexClient()`, available through `useBetterAuth()` → `{ user, session, isLoading, isAuthenticated, client }`. Sign-in and sign-out live on `client`, for example `client.signIn.email({ email, password })`;
- the `convex-auth` route middleware: `definePageMeta({ middleware: 'convex-auth' })` sends signed-out visitors to `/login?redirect=…`;
- `resolveAuthRedirect(route.query.redirect)`, which returns a safe same-origin destination for after sign-in;
- `convexAuth(event)` in server routes, for authenticated `fetchAuthQuery` / `fetchAuthMutation` / `fetchAuthAction` calls.

**Nuxt config.** Nothing is required. `NUXT_PUBLIC_CONVEX_SITE_URL` must reach a production build; in development the `CONVEX_SITE_URL` in `.env.local` is enough. Options live under `convex.betterAuth` (`authClient`, `loginPath`, `crossDomainCallbackRoute`).

**Convex side** (`@convex-dev/better-auth` 0.12). The files, as in the component's guide at https://labs.convex.dev/better-auth:

1. `convex/convex.config.ts`:

   ```ts
   import betterAuth from '@convex-dev/better-auth/convex.config'
   import { defineApp } from 'convex/server'

   const app = defineApp()
   app.use(betterAuth)
   export default app
   ```

2. `convex/auth.config.ts`:

   ```ts
   import type { AuthConfig } from 'convex/server'
   import { getAuthConfigProvider } from '@convex-dev/better-auth/auth-config'

   export default { providers: [getAuthConfigProvider()] } satisfies AuthConfig
   ```

3. `convex/auth.ts`: `export const authComponent = createClient<DataModel>(components.betterAuth)` (from `@convex-dev/better-auth`), and a `createAuth(ctx)` that returns `betterAuth({ baseURL: process.env.SITE_URL, database: authComponent.adapter(ctx), emailAndPassword: { enabled: true }, plugins: [convex({ authConfig })] })`. `convex` comes from `@convex-dev/better-auth/plugins`, `betterAuth` from `better-auth`. Export a user query too: `export const { getAuthUser } = authComponent.clientApi()`.
4. `convex/http.ts`: `authComponent.registerRoutes(http, createAuth)` on an `httpRouter()`.
5. Env vars on the deployment:

   ```bash
   npx convex env set BETTER_AUTH_SECRET "$(openssl rand -base64 32)"
   npx convex env set SITE_URL http://localhost:3000
   ```

   Use the app's real dev URL for `SITE_URL`, and set both again on the production deployment with `--prod`.

**Pages.** For the protected-page pattern (a login page that uses `resolveAuthRedirect`, plus the middleware), see https://nuxt-convex-module.dev/raw/recipes/protected-page.md. For the full reference, see https://nuxt-convex-module.dev/raw/components/better-auth.md.

## Clerk

```bash
npm i @clerk/vue
```

1. Register Clerk's Vue plugin as Clerk documents. With `@clerk/nuxt` instead, auto-detection stays off: set `convex: { clerk: true }` in `nuxt.config.ts`.
2. Call `provideConvexAuthFromClerk()` in `app.vue`, above anything that reads Convex data. The component form is `<ConvexProviderWithClerk>`.
3. Convex side: the Clerk JWT template and the Clerk entry in `convex/auth.config.ts`, as in https://docs.convex.dev/auth/clerk.
4. Under `nuxt-security`, add Clerk's origins to `connect-src`.

Full reference: https://nuxt-convex-module.dev/raw/components/clerk.md.

## Auth0

```bash
npm i @auth0/auth0-vue
```

1. Register Auth0's Vue plugin as Auth0 documents.
2. Call `provideConvexAuthFromAuth0()` in `app.vue`. The component form is `<ConvexProviderWithAuth0>`.
3. Convex side: the Auth0 entry in `convex/auth.config.ts`, as in https://docs.convex.dev/auth/auth0.
4. Under `nuxt-security`, add the Auth0 tenant to `connect-src`.

Full reference: https://nuxt-convex-module.dev/raw/components/auth0.md.

After any Convex-side change, run `npx convex dev --once` (or keep the `dev` script running) so the deployment and `convex/_generated/` pick it up.
