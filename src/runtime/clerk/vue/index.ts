/**
 * Convex + Clerk integration for Vue.
 *
 * A Vue/Nuxt port of `convex/react-clerk`'s `ConvexProviderWithClerk`. It adapts
 * `@clerk/vue`'s `useAuth()` into the generic Convex auth provider
 * ({@link provideConvexAuth}) — no new auth core, just the SDK shim.
 *
 * @module
 */
import { useAuth as useClerkAuth } from '@clerk/vue'
import { defineComponent, toValue, type ComputedRef, type PropType, type SlotsType, type VNode } from 'vue'
import type { AuthTokenFetcher } from 'convex/browser'
import { provideConvexAuth, type ConvexAuthState } from '../../vue/auth/index'
import { useConvex, type ConvexVueClient } from '../../vue/client'

/**
 * Minimal structural view of `@clerk/vue`'s `useAuth()` return — only the
 * fields the Convex adapter needs. Mirrors the hand-written `UseAuth` type in
 * `convex/react-clerk`, decoupling us from Clerk's full discriminated-union
 * type (which `useAuth` exposes as a per-field map of `ComputedRef`s).
 */
export type ClerkGetToken = (options?: { template?: string, skipCache?: boolean }) => Promise<string | null>

export interface ClerkAuthRefs {
  isLoaded: ComputedRef<boolean>
  isSignedIn: ComputedRef<boolean | undefined>
  getToken: ComputedRef<ClerkGetToken>
  // We don't read these directly, but a change in either should trigger a new
  // token fetch (see `authVersion` below).
  orgId: ComputedRef<string | null | undefined>
  orgRole: ComputedRef<string | null | undefined>
  sessionClaims: ComputedRef<{ aud?: unknown } | null | undefined>
}

/**
 * Portable type for `@clerk/vue`'s `useAuth` composable, narrowed to the fields
 * the Convex adapter reads. We don't reuse `typeof import('@clerk/vue').useAuth`
 * directly because its return type references Clerk-internal types that cannot
 * be named in our emitted declarations; the real composable is structurally
 * compatible and assigned through a cast.
 */
export type ClerkUseAuth = () => ClerkAuthRefs

/**
 * Options for {@link provideConvexAuthFromClerk} / `<ConvexProviderWithClerk>`.
 */
export interface ConvexProviderWithClerkOptions {
  /** Convex client to authenticate. Defaults to the provided {@link useConvex} client. */
  client?: ConvexVueClient
  /** Clerk's `useAuth` composable. Defaults to `useAuth` from `@clerk/vue`. */
  useAuth?: ClerkUseAuth
}

/**
 * Adapt Clerk's reactive auth state into the shape {@link provideConvexAuth}
 * expects. Mirrors `useAuthFromClerk` in `convex/react-clerk`.
 */
function useAuthFromClerk(useAuth: ClerkUseAuth) {
  const { isLoaded, isSignedIn, getToken, orgId, orgRole, sessionClaims } = useAuth()

  const fetchAccessToken: AuthTokenFetcher = async ({ forceRefreshToken }) => {
    try {
      const get = toValue(getToken)
      const claims = toValue(sessionClaims)
      if (claims?.aud === 'convex') {
        // Using the Convex integration (claims already carry `aud: "convex"`).
        return await get({ skipCache: forceRefreshToken })
      }
      // Using the "convex" JWT template.
      return await get({ template: 'convex', skipCache: forceRefreshToken })
    }
    catch {
      return null
    }
  }

  return {
    isLoading: () => !toValue(isLoaded),
    isAuthenticated: () => toValue(isSignedIn) ?? false,
    fetchAccessToken,
    // Re-run `setAuth` whenever the active organization changes — the Vue analog
    // of React's `[orgId, orgRole]` dependency array.
    authVersion: () => `${toValue(orgId) ?? ''}:${toValue(orgRole) ?? ''}`,
  }
}

/**
 * Authenticate the Convex client with Clerk and expose the reactive auth state
 * to descendants via {@link useConvexAuth}.
 *
 * Call this in a top-level component's `setup` (the app must be wrapped by a
 * configured Clerk plugin from `@clerk/vue`). Equivalent to wrapping with
 * `<ConvexProviderWithClerk>`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { provideConvexAuthFromClerk } from '@qruto/nuxt-convex/clerk/vue'
 * provideConvexAuthFromClerk()
 * </script>
 * ```
 *
 * @public
 */
export function provideConvexAuthFromClerk(
  options: ConvexProviderWithClerkOptions = {},
): ConvexAuthState {
  const client = options.client ?? useConvex()
  // The real `@clerk/vue` composable is structurally compatible with our
  // narrowed {@link ClerkUseAuth} (its return type just carries extra fields).
  const useAuth = options.useAuth ?? (useClerkAuth as unknown as ClerkUseAuth)
  return provideConvexAuth({ client, useAuth: () => useAuthFromClerk(useAuth) })
}

/**
 * Component form of {@link provideConvexAuthFromClerk} — a drop-in parity port
 * of `convex/react-clerk`'s `<ConvexProviderWithClerk>`. Renders its default
 * slot once Convex auth is wired.
 *
 * @public
 */
export const ConvexProviderWithClerk = defineComponent({
  name: 'ConvexProviderWithClerk',
  props: {
    client: { type: Object as PropType<ConvexVueClient>, default: undefined },
    useAuth: { type: Function as PropType<ClerkUseAuth>, default: undefined },
  },
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(props, { slots }) {
    provideConvexAuthFromClerk({ client: props.client, useAuth: props.useAuth })
    return () => slots.default?.()
  },
})
