import { defineComponent, h, onErrorCaptured, type PropType, ref, type SlotsType, type VNode, watch } from 'vue'
import type { FunctionReference } from 'convex/server'
import { useConvexAuth } from '../../vue/auth/index'
import { Authenticated } from '../../vue/auth/helpers'
import { useQuery } from '../../vue/composables/use-query'
import type { AuthClient } from './client'

/**
 * Subscribes to the validated-user query so the boundary stays reactive to the
 * actual user auth state (not just JWT validity). Rendered inside
 * `<Authenticated>` so it only subscribes when authenticated. Renders nothing.
 */
const UserSubscription = defineComponent({
  name: 'AuthBoundaryUserSubscription',
  props: {
    getAuthUserFn: { type: Object as PropType<FunctionReference<'query'>>, required: true },
  },
  setup(props) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    useQuery(props.getAuthUserFn as any, {})
    return () => null
  },
})

/**
 * _Experimental_
 *
 * A Vue port of `@convex-dev/better-auth`'s `AuthBoundary` — error handling for
 * auth-related errors. Typically redirects to the login page when the user is
 * unauthenticated, reactively based on the `getAuthUserFn` query, and clears the
 * session cookie via `authClient.getSession()` before calling `onUnauth`.
 *
 * @example
 * ```vue
 * <AuthBoundary
 *   :auth-client="authClient"
 *   :get-auth-user-fn="api.auth.getAuthUser"
 *   :is-auth-error="isAuthError"
 *   :on-unauth="() => navigateTo('/login')"
 * >
 *   <slot />
 * </AuthBoundary>
 * ```
 *
 * @public
 */
export const AuthBoundary = defineComponent({
  name: 'AuthBoundary',
  props: {
    /** Called when the user is unauthenticated — typically a redirect to login. */
    onUnauth: { type: Function as PropType<() => void | Promise<void>>, required: true },
    /** The Better Auth client (used to clear an invalid session before `onUnauth`). */
    authClient: { type: Object as PropType<AuthClient>, required: true },
    /** Reference to a Convex query returning the auth user (keeps the check reactive). */
    getAuthUserFn: { type: Object as PropType<FunctionReference<'query'>>, required: true },
    /** Whether a caught error is auth-related. */
    isAuthError: { type: Function as PropType<(error: unknown) => boolean>, required: true },
    /** Fallback to render when an auth error is caught. Defaults to nothing. */
    renderFallback: { type: Function as PropType<() => VNode | null>, default: undefined },
  },
  slots: Object as SlotsType<{ default: () => VNode[] }>,
  setup(props, { slots }) {
    const auth = useConvexAuth()
    const caughtAuthError = ref(false)

    const handleUnauth = async () => {
      // Auth request that will clear cookies if the session is invalid.
      await props.authClient.getSession()
      await props.onUnauth()
    }

    watch(
      () => [auth.isLoading, auth.isAuthenticated] as const,
      ([isLoading, isAuthenticated]) => {
        if (!isLoading && !isAuthenticated) {
          void handleUnauth()
        }
      },
      { immediate: true },
    )

    onErrorCaptured((error) => {
      if (props.isAuthError(error)) {
        caughtAuthError.value = true
        void handleUnauth()
        return false
      }
    })

    return () => {
      if (caughtAuthError.value) {
        return props.renderFallback?.() ?? null
      }
      return [
        h(Authenticated, () => h(UserSubscription, { getAuthUserFn: props.getAuthUserFn })),
        slots.default?.(),
      ]
    }
  },
})
