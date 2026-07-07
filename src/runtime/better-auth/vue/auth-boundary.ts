import { defineComponent, h, onErrorCaptured, type PropType, ref, type VNode, watch } from 'vue'
import type { FunctionReference } from 'convex/server'
import type { EmptyObject } from 'convex-helpers'
import { useConvexAuth } from '../../vue/auth/index'
import { Authenticated } from '../../vue/auth/helpers'
import { useQuery } from '../../vue/composables/use-query'
import type { AuthClient } from '#convex/auth-client'

// Subscribe to the session validated user to keep this check reactive to
// actual user auth state at the provider level (rather than just jwt validity state).
const UserSubscription = defineComponent({
  name: 'UserSubscription',
  props: {
    getAuthUserFn: { type: Object as PropType<FunctionReference<'query'>>, required: true },
  },
  setup(props) {
    // Narrow to the zero-args reference `AuthBoundary` accepts so `useQuery`
    // takes no args, matching upstream's bare `useQuery(getAuthUserFn)`.
    useQuery(props.getAuthUserFn as FunctionReference<'query', 'public', EmptyObject>)
    return () => null
  },
})

/**
 * _Experimental_
 *
 * A wrapper Vue component which provides error handling for auth related errors.
 * This is typically used to redirect the user to the login page when they are
 * unauthenticated, and does so reactively based on the getAuthUserFn query.
 *
 * @example
 * ```vue
 * <!--
 *   convex/auth.ts:
 *   export const { getAuthUser } = authComponent.clientApi();
 * -->
 * <script setup lang="ts">
 * import { AuthBoundary, authClient } from '#imports'
 * import { api } from '#backend/api'
 * import { isAuthError } from '~/utils/auth'
 * </script>
 *
 * <template>
 *   <AuthBoundary
 *     :on-unauth="() => navigateTo('/sign-in')"
 *     :auth-client="authClient"
 *     :get-auth-user-fn="api.auth.getAuthUser"
 *     :is-auth-error="isAuthError"
 *   >
 *     <slot />
 *   </AuthBoundary>
 * </template>
 * ```
 * @param props.onUnauth - Function to call when the user is
 * unauthenticated. Typically a redirect to the login page.
 * @param props.authClient - Better Auth authClient to use.
 * @param props.renderFallback - Fallback component to render when the user is
 * unauthenticated. Defaults to null. Generally not rendered as error handling
 * is typically a redirect.
 * @param props.getAuthUserFn - Reference to a Convex query that returns user.
 * The component provides a query for this via `export const { getAuthUser } = authComponent.clientApi()`.
 * @param props.isAuthError - Function to check if the error is auth related.
 *
 * @public
 */
export const AuthBoundary = defineComponent({
  name: 'AuthBoundary',
  props: {
    /**
     * The function to call when the user is unauthenticated. Typically a redirect
     * to the login page.
     */
    onUnauth: { type: Function as PropType<() => void | Promise<void>>, required: true },
    /**
     * The Better Auth authClient to use.
     */
    authClient: { type: Object as PropType<AuthClient>, required: true },
    /**
     * The fallback to render when the user is unauthenticated. Defaults to null.
     * Generally not rendered as error handling is typically a redirect.
     */
    renderFallback: { type: Function as PropType<() => VNode | null>, default: () => null },
    /**
     * The function to call to get the auth user.
     */
    getAuthUserFn: {
      type: Object as PropType<FunctionReference<'query', 'public', EmptyObject>>,
      required: true,
    },
    /**
     * The function to call to check if the error is auth related.
     */
    isAuthError: { type: Function as PropType<(error: unknown) => boolean>, required: true },
  },
  setup(props, { slots }) {
    const { isAuthenticated, isLoading } = useConvexAuth()
    const handleUnauth = async () => {
      // Auth request that will clear cookies if session is invalid
      await props.authClient.getSession()
      await props.onUnauth()
    }

    // `immediate` because the upstream `useEffect` also runs on mount.
    watch([isLoading, isAuthenticated], () => {
      void (async () => {
        if (!isLoading.value && !isAuthenticated.value) {
          await handleUnauth()
        }
      })()
    }, { immediate: true })

    // `onErrorCaptured` is the `ErrorBoundary` port: the stored error mirrors
    // `getDerivedStateFromError`, the `handleUnauth` call `componentDidCatch`,
    // and `return false` stops propagation like a React error boundary. Non-auth
    // errors keep propagating (Vue has no catch-and-rerender boundary).
    const error = ref<unknown>()
    onErrorCaptured((err) => {
      error.value = err
      if (props.isAuthError(err)) {
        void handleUnauth()
        return false
      }
    })

    return () => {
      if (error.value && props.isAuthError(error.value)) {
        return props.renderFallback?.()
      }
      return [
        h(Authenticated, () => h(UserSubscription, { getAuthUserFn: props.getAuthUserFn })),
        slots.default?.(),
      ]
    }
  },
})
