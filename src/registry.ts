// What the module registers into a Nuxt app, as data: every auto-import,
// every component, every server import, keyed by the integration that adds
// it. `module.ts` iterates these; `test/docs/docs-contract.test.ts` reads them
// to check the docs name every one. Off the module entry for the same reason
// as options.ts — this is wiring, not API.

/** An auto-import: the name a Nuxt app sees and the runtime file it comes from. */
export interface Registration {
  name: string
  /** Relative to `src/`, without extension — `runtime/vue/composables/use-query`. */
  from: string
  /** Type-only import (`import type … from '#imports'`). */
  type?: boolean
}

export type Integration = 'core' | 'betterAuth' | 'clerk' | 'auth0' | 'polar'

const vue = (file: string) => `runtime/vue/${file}`
const composable = (file: string) => vue(`composables/${file}`)
const asyncQuery = 'runtime/nuxt/composables/use-async-query'

/** App-side auto-imports (`addImports`). */
export const APP_IMPORTS: Record<Integration, Registration[]> = {
  core: [
    { name: 'useConvex', from: vue('client') },
    { name: 'useQuery', from: composable('use-query') },
    { name: 'useQuery_experimental', from: composable('use-query') },
    { name: 'useConvexQuery', from: composable('use-query') },
    { name: 'useQueries', from: composable('use-queries') },
    { name: 'useConvexQueries', from: composable('use-queries') },
    { name: 'useMutation', from: composable('use-mutation') },
    { name: 'useConvexMutation', from: composable('use-mutation') },
    { name: 'useAction', from: composable('use-action') },
    { name: 'useConvexAction', from: composable('use-action') },
    { name: 'useConvexConnectionState', from: composable('use-connection-state') },
    { name: 'useUpload', from: composable('use-upload') },
    { name: 'useConvexUpload', from: composable('use-upload') },
    { name: 'uploadFile', from: composable('use-upload') },
    { name: 'useUploadQueue', from: composable('use-upload-queue') },
    { name: 'useConvexUploadQueue', from: composable('use-upload-queue') },
    { name: 'useStorageUrl', from: composable('use-storage-url') },
    { name: 'useConvexStorageUrl', from: composable('use-storage-url') },
    { name: 'useConvexAuth', from: vue('auth/index') },
    { name: 'provideConvexAuth', from: vue('auth/index') },
    { name: 'provideConvexApi', from: vue('provide') },
    { name: 'useConvexApi', from: vue('provide') },
    { name: 'useConvexNamespace', from: vue('provide') },
    { name: 'usePreloadedQuery', from: vue('hydration') },
    // Nuxt-only (imports `#app`), hence under runtime/nuxt/ — see PARITY.md.
    // Its types too, so `import type { AsyncQueryReturn } from '#imports'` works
    // without spelling out the `nuxt-convex-module/app` subpath.
    { name: 'useAsyncQuery', from: asyncQuery },
    { name: 'useConvexAsyncQuery', from: asyncQuery },
    { name: 'AsyncQueryData', from: asyncQuery, type: true },
    { name: 'AsyncQueryOptions', from: asyncQuery, type: true },
    { name: 'AsyncQueryReturn', from: asyncQuery, type: true },
    { name: 'AsyncQueryStatus', from: asyncQuery, type: true },
    { name: 'usePaginatedQuery', from: composable('use-paginated-query') },
    { name: 'useConvexPaginatedQuery', from: composable('use-paginated-query') },
    { name: 'usePaginatedQuery_experimental', from: composable('use-paginated-query') },
  ],
  betterAuth: [
    { name: 'useAuth', from: 'runtime/better-auth/vue/use-auth' },
    { name: 'usePreloadedAuthQuery', from: 'runtime/better-auth/vue/hydration' },
    { name: 'resolveAuthRedirect', from: 'runtime/better-auth/vue/redirect' },
  ],
  clerk: [{ name: 'provideConvexAuthFromClerk', from: 'runtime/clerk/vue/index' }],
  auth0: [{ name: 'provideConvexAuthFromAuth0', from: 'runtime/auth0/vue/index' }],
  polar: [],
}

/** Auto-registered components (`addComponent`); `name` is also the export. */
export const APP_COMPONENTS: Record<Integration, Registration[]> = {
  core: ['Authenticated', 'Unauthenticated', 'AuthLoading', 'AuthRefreshing']
    .map(name => ({ name, from: vue('auth/helpers') })),
  betterAuth: [{ name: 'AuthBoundary', from: 'runtime/better-auth/vue/auth-boundary' }],
  clerk: [{ name: 'ConvexProviderWithClerk', from: 'runtime/clerk/vue/index' }],
  auth0: [{ name: 'ConvexProviderWithAuth0', from: 'runtime/auth0/vue/index' }],
  polar: ['CheckoutLink', 'CustomerPortalLink']
    .map(name => ({ name, from: 'runtime/polar/vue/components' })),
}

/** Nitro auto-imports (`addServerImports`). */
export const SERVER_IMPORTS: Record<Integration, Registration[]> = {
  core: ['fetchQuery', 'fetchMutation', 'fetchAction', 'preloadQuery', 'preloadedQueryResult']
    .map(name => ({ name, from: 'runtime/nuxt/index' })),
  betterAuth: ['convexAuth', 'convexBetterAuthNuxt']
    .map(name => ({ name, from: 'runtime/better-auth/nuxt/server' })),
  clerk: [],
  auth0: [],
  polar: [],
}
