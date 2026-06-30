import { defineComponent, type SlotsType, type VNode } from 'vue'
import { useConvexAuth } from './index'

/**
 * Renders slot content only if the client is authenticated.
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
export const Authenticated = defineComponent({
  name: 'Authenticated',
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(_, { slots }) {
    const auth = useConvexAuth()
    return () => {
      if (auth.isLoading || !auth.isAuthenticated) return null
      return slots.default?.()
    }
  },
})

/**
 * Renders slot content only if the client is unauthenticated (and not loading).
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
export const Unauthenticated = defineComponent({
  name: 'Unauthenticated',
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(_, { slots }) {
    const auth = useConvexAuth()
    return () => {
      if (auth.isLoading || auth.isAuthenticated) return null
      return slots.default?.()
    }
  },
})

/**
 * Renders slot content only while the auth state is loading.
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
export const AuthLoading = defineComponent({
  name: 'AuthLoading',
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(_, { slots }) {
    const auth = useConvexAuth()
    return () => {
      if (!auth.isLoading) return null
      return slots.default?.()
    }
  },
})

/**
 * Renders slot content while the client is refreshing the auth token for an
 * already-authenticated session (the server rejected the current token and the
 * socket is paused while a new one is fetched). Routine background token
 * rotation does not trigger this state.
 *
 * Whether used inside `<Authenticated>` or not, slot content is only rendered
 * while the user is authenticated.
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
export const AuthRefreshing = defineComponent({
  name: 'AuthRefreshing',
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(_, { slots }) {
    const auth = useConvexAuth()
    return () => {
      if (!auth.isAuthenticated || !auth.isRefreshing) return null
      return slots.default?.()
    }
  },
})
