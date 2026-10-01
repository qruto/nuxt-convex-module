import { defineComponent } from 'vue'
import { useConvexAuth } from './index'

/**
 * Renders the default slot if the client is authenticated.
 *
 * @example
 * ```vue
 * <Authenticated>
 *   <p>You are logged in!</p>
 * </Authenticated>
 * ```
 *
 * @public
 */
export const Authenticated = /* @__PURE__ */ defineComponent({
  name: 'Authenticated',
  setup(_, { slots }) {
    const { isLoading, isAuthenticated } = useConvexAuth()
    return () => {
      if (isLoading.value || !isAuthenticated.value) {
        return null
      }
      return slots.default?.()
    }
  },
})

/**
 * Renders the default slot if the client is using authentication but is not authenticated.
 *
 * @example
 * ```vue
 * <Unauthenticated>
 *   <p>Please log in.</p>
 * </Unauthenticated>
 * ```
 *
 * @public
 */
export const Unauthenticated = /* @__PURE__ */ defineComponent({
  name: 'Unauthenticated',
  setup(_, { slots }) {
    const { isLoading, isAuthenticated } = useConvexAuth()
    return () => {
      if (isLoading.value || isAuthenticated.value) {
        return null
      }
      return slots.default?.()
    }
  },
})

/**
 * Renders the default slot if the client isn't using authentication or is in the process
 * of authenticating.
 *
 * @example
 * ```vue
 * <AuthLoading>
 *   <p>Checking authentication...</p>
 * </AuthLoading>
 * ```
 *
 * @public
 */
export const AuthLoading = /* @__PURE__ */ defineComponent({
  name: 'AuthLoading',
  setup(_, { slots }) {
    const { isLoading } = useConvexAuth()
    return () => {
      if (!isLoading.value) {
        return null
      }
      return slots.default?.()
    }
  },
})

/**
 * Renders the default slot while the client is refreshing the auth token for an
 * already-authenticated session (the server rejected the current token and
 * the socket is paused while a new one is fetched). Routine background
 * token rotation does not trigger this state.
 *
 * Whether used inside of `<Authenticated>` or not, the default slot will only be
 * rendered if the user is authenticated.
 *
 * @example
 * ```vue
 * <AuthRefreshing>
 *   <p>Refreshing token...</p>
 * </AuthRefreshing>
 * ```
 *
 * @public
 */
export const AuthRefreshing = /* @__PURE__ */ defineComponent({
  name: 'AuthRefreshing',
  setup(_, { slots }) {
    const { isAuthenticated, isRefreshing } = useConvexAuth()
    return () => {
      if (!isAuthenticated.value || !isRefreshing.value) {
        return null
      }
      return slots.default?.()
    }
  },
})
