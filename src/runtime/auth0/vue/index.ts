/**
 * Convex + Auth0 integration for Vue.
 *
 * A Vue/Nuxt port of `convex/react-auth0`'s `ConvexProviderWithAuth0`. It adapts
 * `@auth0/auth0-vue`'s `useAuth0()` into the generic Convex auth provider
 * ({@link provideConvexAuth}) — no new auth core, just the SDK shim.
 *
 * @module
 */
import { useAuth0 } from '@auth0/auth0-vue'
import { defineComponent, type PropType, type SlotsType, type VNode } from 'vue'
import type { AuthTokenFetcher } from 'convex/browser'
import { provideConvexAuth, type ConvexAuthState } from '../../vue/auth/index'
import { useConvex, type ConvexVueClient } from '../../vue/client'

/**
 * Options for {@link provideConvexAuthFromAuth0} / `<ConvexProviderWithAuth0>`.
 */
export interface ConvexProviderWithAuth0Options {
  /** Convex client to authenticate. Defaults to the provided {@link useConvex} client. */
  client?: ConvexVueClient
}

/**
 * Adapt Auth0's reactive auth state into the shape {@link provideConvexAuth}
 * expects. Mirrors `useAuthFromAuth0` in `convex/react-auth0`.
 *
 * `isLoading` / `isAuthenticated` are Auth0 `Ref`s, passed through unwrapped
 * (the provider reads them with `toValue`). The token is the Auth0 `id_token`
 * obtained via a detailed silent token request.
 */
function useAuthFromAuth0() {
  const auth0 = useAuth0()

  const fetchAccessToken: AuthTokenFetcher = async ({ forceRefreshToken }) => {
    try {
      const response = await auth0.getAccessTokenSilently({
        detailedResponse: true,
        cacheMode: forceRefreshToken ? 'off' : 'on',
      })
      return response.id_token
    }
    catch {
      return null
    }
  }

  return {
    isLoading: auth0.isLoading,
    isAuthenticated: auth0.isAuthenticated,
    fetchAccessToken,
  }
}

/**
 * Authenticate the Convex client with Auth0 and expose the reactive auth state
 * to descendants via {@link useConvexAuth}.
 *
 * Call this in a top-level component's `setup` (the app must be wrapped by a
 * configured Auth0 plugin from `@auth0/auth0-vue`). Equivalent to wrapping with
 * `<ConvexProviderWithAuth0>`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { provideConvexAuthFromAuth0 } from '@qruto/nuxt-convex/auth0/vue'
 * provideConvexAuthFromAuth0()
 * </script>
 * ```
 *
 * @public
 */
export function provideConvexAuthFromAuth0(
  options: ConvexProviderWithAuth0Options = {},
): ConvexAuthState {
  const client = options.client ?? useConvex()
  return provideConvexAuth({ client, useAuth: useAuthFromAuth0 })
}

/**
 * Component form of {@link provideConvexAuthFromAuth0} — a drop-in parity port
 * of `convex/react-auth0`'s `<ConvexProviderWithAuth0>`. Renders its default
 * slot once Convex auth is wired.
 *
 * @public
 */
export const ConvexProviderWithAuth0 = defineComponent({
  name: 'ConvexProviderWithAuth0',
  props: {
    client: { type: Object as PropType<ConvexVueClient>, default: undefined },
  },
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(props, { slots }) {
    provideConvexAuthFromAuth0({ client: props.client })
    return () => slots.default?.()
  },
})
