/**
 * Vue login component for use with Auth0.
 *
 * A Vue/Nuxt port of `convex/react-auth0`. The provider is exposed both as the
 * {@link provideConvexAuthFromAuth0} composable and the thin
 * {@link ConvexProviderWithAuth0} component wrapper; both adapt
 * `@auth0/auth0-vue`'s `useAuth0()` into the generic Convex auth provider
 * ({@link provideConvexAuth}) — no new auth core, just the SDK shim.
 *
 * @module
 */
import { useAuth0 } from '@auth0/auth0-vue'
import { defineComponent, type PropType } from 'vue'

// Upstream re-describes its client interface locally (`IConvexReactClient`);
// the port's mirror is exported from the auth core, so import it instead.
import { provideConvexAuth, type ConvexAuthState, type IConvexVueClient } from '../../vue/auth/index'
import { useConvexOrThrow } from '../../vue/client'

/**
 * Options for {@link provideConvexAuthFromAuth0} / `<ConvexProviderWithAuth0>`.
 */
export interface ConvexProviderWithAuth0Options {
  /** Convex client to authenticate. Defaults to the provided {@link useConvex} client. */
  client?: IConvexVueClient
}

/**
 * The composable form of {@link ConvexProviderWithAuth0} — provides a
 * {@link ConvexVueClient} authenticated with Auth0.
 *
 * It must be called in an app wrapped by a configured Auth0 plugin from
 * `@auth0/auth0-vue`.
 *
 * See [Convex Auth0](https://docs.convex.dev/auth/auth0) on how to set up
 * Convex with Auth0.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { provideConvexAuthFromAuth0 } from 'nuxt-convex-kit/auth0/vue'
 * provideConvexAuthFromAuth0()
 * </script>
 * ```
 *
 * @public
 */
export function provideConvexAuthFromAuth0(
  options: ConvexProviderWithAuth0Options = {},
): ConvexAuthState {
  const client = options.client ?? useConvexOrThrow('provideConvexAuthFromAuth0')
  return provideConvexAuth({ client, useAuth: useAuthFromAuth0 })
}

/**
 * A wrapper Vue component which provides a {@link ConvexVueClient}
 * authenticated with Auth0 — the component form of
 * {@link provideConvexAuthFromAuth0}. Renders its default slot once Convex
 * auth is wired.
 *
 * It must be wrapped by a configured Auth0 plugin from `@auth0/auth0-vue`.
 *
 * See [Convex Auth0](https://docs.convex.dev/auth/auth0) on how to set up
 * Convex with Auth0.
 *
 * @public
 */
export const ConvexProviderWithAuth0 = defineComponent({
  name: 'ConvexProviderWithAuth0',
  props: {
    client: { type: Object as PropType<IConvexVueClient>, default: undefined },
  },
  setup(props, { slots }) {
    provideConvexAuthFromAuth0({ client: props.client })
    return () => slots.default?.()
  },
})

// Mirrors `useAuthFromAuth0` in `convex/react-auth0`. `isLoading` /
// `isAuthenticated` are Auth0 `Ref`s passed through unwrapped (the provider
// reads them with `toValue`); `useCallback` / `useMemo` drop out — setup-scope
// code runs once and `@auth0/auth0-vue` binds its methods.
function useAuthFromAuth0() {
  const { isLoading, isAuthenticated, getAccessTokenSilently } = useAuth0()
  const fetchAccessToken = async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    try {
      const response = await getAccessTokenSilently({
        detailedResponse: true,
        cacheMode: forceRefreshToken ? 'off' : 'on',
      })
      return response.id_token as string
    }
    catch {
      return null
    }
  }
  return { isLoading, isAuthenticated, fetchAccessToken }
}
