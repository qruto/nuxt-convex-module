/**
 * Vue login component for use with Clerk.
 *
 * A Vue/Nuxt port of `convex/react-clerk`. The provider is exposed both as the
 * {@link provideConvexAuthFromClerk} composable and the thin
 * {@link ConvexProviderWithClerk} component wrapper; both adapt `@clerk/vue`'s
 * `useAuth()` into the generic Convex auth provider
 * ({@link provideConvexAuth}) — no new auth core, just the SDK shim.
 *
 * @module clerk/client
 */
import { useAuth as useClerkAuth } from '@clerk/vue'
import { defineComponent, toValue, type ComputedRef, type PropType } from 'vue'
import type { AuthTokenFetcher } from 'convex/browser'
import { provideConvexAuth, type ConvexAuthState, type IConvexVueClient } from '../../vue/auth/index'
import { useConvexOrThrow } from '../../vue/client'

// https://clerk.com/docs/reference/clerk-react/useauth — `@clerk/vue` returns
// each field as a `ComputedRef`. Hand-written like upstream's `UseAuth` (the
// real composable's return type references Clerk-internal types that cannot be
// named in our emitted declarations; it is structurally compatible and
// assigned through a cast). Exported (upstream keeps it private) because it
// appears in the public {@link ConvexProviderWithClerkOptions}.
export type UseAuth = () => {
  isLoaded: ComputedRef<boolean>
  isSignedIn: ComputedRef<boolean | undefined>
  getToken: ComputedRef<(options: {
    template?: 'convex'
    skipCache?: boolean
  }) => Promise<string | null>>
  // We don't use these properties but they should trigger a new token fetch.
  orgId: ComputedRef<string | undefined | null>
  orgRole: ComputedRef<string | undefined | null>
  // `Record<string, unknown>` mirrors upstream verbatim — anything narrower is
  // a TS "weak type" that Clerk's real `ComputedRef<JwtPayload>` fails to
  // satisfy, breaking the documented `useAuth` wiring at compile time.
  sessionClaims: ComputedRef<Record<string, unknown> | undefined | null>
}

/**
 * Options for {@link provideConvexAuthFromClerk} / `<ConvexProviderWithClerk>`.
 */
export interface ConvexProviderWithClerkOptions {
  /** Convex client to authenticate. Defaults to the provided {@link useConvex} client. */
  client?: IConvexVueClient
  /** Clerk's `useAuth` composable. Defaults to `useAuth` from `@clerk/vue`. */
  useAuth?: UseAuth
}

/**
 * A composable which provides a {@link ConvexVueClient}
 * authenticated with Clerk, exposing the reactive auth state to descendants
 * via {@link useConvexAuth} — the Vue translation of wrapping the app in
 * `convex/react-clerk`'s `<ConvexProviderWithClerk>`.
 *
 * Call it in a top-level component's `setup`. The app must be wrapped by a
 * configured `clerkPlugin`, from `@clerk/vue`, `@clerk/nuxt` or
 * another Vue-based Clerk client library and have the corresponding
 * `useAuth` composable passed in (it defaults to `useAuth` from `@clerk/vue`).
 *
 * See [Convex Clerk](https://docs.convex.dev/auth/clerk) on how to set up
 * Convex with Clerk.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { provideConvexAuthFromClerk } from 'nuxt-convex-module/clerk/client'
 * provideConvexAuthFromClerk()
 * </script>
 * ```
 *
 * @public
 */
export function provideConvexAuthFromClerk(
  options: ConvexProviderWithClerkOptions = {},
): ConvexAuthState {
  const client = options.client ?? useConvexOrThrow('provideConvexAuthFromClerk')
  // The real `@clerk/vue` composable is structurally compatible with our
  // narrowed {@link UseAuth} (its return type just carries extra fields).
  const useAuth = options.useAuth ?? (useClerkAuth as unknown as UseAuth)
  return provideConvexAuth({ client, useAuth: () => useAuthFromClerk(useAuth) })
}

/**
 * A wrapper Vue component which provides a {@link ConvexVueClient}
 * authenticated with Clerk — the component form of
 * {@link provideConvexAuthFromClerk}, kept as a drop-in parity port of
 * `convex/react-clerk`'s `<ConvexProviderWithClerk>`. Renders its default
 * slot once Convex auth is wired.
 *
 * @public
 */
export const ConvexProviderWithClerk = defineComponent({
  name: 'ConvexProviderWithClerk',
  props: {
    client: { type: Object as PropType<IConvexVueClient>, default: undefined },
    useAuth: { type: Function as PropType<UseAuth>, default: undefined },
  },
  setup(props, { slots }) {
    provideConvexAuthFromClerk({ client: props.client, useAuth: props.useAuth })
    return () => slots.default?.()
  },
})

// The Vue translation of upstream's `useUseAuthFromClerk`: the memoizing outer
// wrapper is unnecessary (`provideConvexAuth` invokes `useAuth` once in
// `setup`), so only the inner `useAuthFromClerk` composable is ported.
function useAuthFromClerk(useAuth: UseAuth) {
  const { isLoaded, isSignedIn, getToken, orgId, orgRole, sessionClaims } = useAuth()
  const fetchAccessToken: AuthTokenFetcher = async ({ forceRefreshToken }) => {
    try {
      if (toValue(sessionClaims)?.aud === 'convex') {
        // Using the Convex integration
        return await toValue(getToken)({
          skipCache: forceRefreshToken,
        })
      }
      else {
        // Using the JWT token template
        return await toValue(getToken)({
          template: 'convex',
          skipCache: forceRefreshToken,
        })
      }
    }
    catch {
      return null
    }
  }
  return {
    isLoading: () => !toValue(isLoaded),
    isAuthenticated: () => toValue(isSignedIn) ?? false,
    fetchAccessToken,
    // The `authVersion` key triggers setAuth() whenever these change — the Vue
    // translation of upstream rebuilding `fetchAccessToken` with dependencies
    // `[orgId, orgRole]`. Anything else from the JWT Clerk wants to be
    // reactive goes here too.
    authVersion: () => `${toValue(orgId) ?? ''}:${toValue(orgRole) ?? ''}`,
  }
}
