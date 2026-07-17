import type { AuthTokenFetcher } from 'convex/browser'
import { computed, effectScope, inject, provide, ref, toValue, unref, watch, watchEffect, type ComputedRef, type EffectScope, type InjectionKey, type MaybeRef, type MaybeRefOrGetter } from 'vue'

// Mirrors upstream's `IConvexReactClient` — just describe the interface enough
// to help users pass the right type. Exported (upstream keeps it private) so
// wrappers or test doubles that only implement `setAuth`/`clearAuth` are
// accepted.
export type IConvexVueClient = {
  setAuth(
    fetchToken: AuthTokenFetcher,
    onChange: (isAuthenticated: boolean) => void,
    onRefreshChange?: (isRefreshing: boolean) => void,
  ): void
  clearAuth(): void
}

/**
 * Type representing the state of an auth integration with Convex.
 *
 * - `isLoading`: the client is still resolving the initial auth state and
 *   waiting for the server to confirm the current token.
 * - `isAuthenticated`: the server has confirmed the current token.
 * - `isRefreshing`: the server rejected a previously-confirmed token and the
 *   socket is paused while a replacement is fetched. Only ever `true` when
 *   `isAuthenticated` is also `true`. Routine background token rotation does
 *   not trigger this state.
 *
 * Each field is a `ComputedRef` (the Vue translation of upstream's re-rendered
 * plain booleans), so the upstream destructuring idiom stays reactive:
 * `const { isLoading, isAuthenticated } = useConvexAuth()`.
 *
 * @public
 */
export type ConvexAuthState = {
  isLoading: ComputedRef<boolean>
  isAuthenticated: ComputedRef<boolean>
  isRefreshing: ComputedRef<boolean>
}

// The Vue translation of upstream's `ConvexAuthContext` (context → provide/inject).
export const ConvexAuthStateKey: InjectionKey<ConvexAuthState> = Symbol('ConvexAuthState')

/**
 * Get the {@link ConvexAuthState} within a Vue component.
 *
 * This relies on a Convex auth integration provider being above in the Vue
 * component tree. See {@link ConvexAuthState} for the meaning of each field.
 *
 * @returns The current {@link ConvexAuthState}.
 *
 * @public
 */
export function useConvexAuth(): {
  isLoading: ComputedRef<boolean>
  isAuthenticated: ComputedRef<boolean>
  isRefreshing: ComputedRef<boolean>
} {
  const authContext = inject(ConvexAuthStateKey)
  if (authContext === undefined) {
    throw new Error(
      'Could not find Convex auth context. '
      + 'Ensure `provideConvexAuth` has been called in an ancestor component '
      + 'or that the Convex auth plugin is installed, or you might have two '
      + 'instances of the `nuxt-convex-module` runtime loaded in your project.',
    )
  }
  return authContext
}

/**
 * Options for {@link provideConvexAuth} — the Vue translation of the props of
 * upstream's `ConvexProviderWithAuth` component.
 */
export interface ConvexAuthProviderOptions {
  client: IConvexVueClient
  useAuth: () => {
    isLoading: MaybeRefOrGetter<boolean>
    isAuthenticated: MaybeRefOrGetter<boolean>
    /**
     * The token fetcher. May be a `Ref`/`ComputedRef` whose *identity* changes
     * when re-authentication is needed — the Vue translation of upstream
     * re-running its `setAuth` effect when the `useAuth` prop returns a new
     * `fetchAccessToken` function between renders (e.g. Clerk's `useCallback`
     * deps `[orgId, orgRole]`). A plain function never re-triggers.
     *
     * (A getter is deliberately not accepted here: the fetcher is itself a
     * function, so a getter would be indistinguishable from the value.)
     */
    fetchAccessToken: MaybeRef<AuthTokenFetcher>
    /**
     * Alternative re-authentication trigger for providers that hand out a
     * stable fetcher function: when this value changes, auth state transitions
     * back to loading, `clearAuth` runs, and `fetchAccessToken` is called
     * again against the new auth context.
     */
    authVersion?: MaybeRefOrGetter<unknown>
  }
}

/**
 * A replacement for the plain Convex client provide (upstream's
 * `ConvexProvider`) which additionally provides {@link ConvexAuthState} to
 * descendants of the calling component.
 *
 * Use this to integrate any auth provider with Convex. The `useAuth` option
 * should be a Vue composable that returns the provider's authentication state
 * and a function to fetch a JWT access token.
 *
 * If the returned `fetchAccessToken` ref identity (or the optional
 * `authVersion` value) updates then auth state
 * will transition to loading and the `fetchAccessToken()` function called again.
 *
 * See [Custom Auth Integration](https://docs.convex.dev/auth/advanced/custom-auth) for more information.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useAuth } from '~/composables/useAuth'  // your auth provider
 *
 * const { client } = useNuxtApp().$convex
 * const authState = provideConvexAuth({ client, useAuth })
 * </script>
 * ```
 *
 * @param options - Auth integration options including the Convex client and
 *   an `useAuth` factory that returns loading state and a token fetcher.
 * @returns The reactive auth state.
 *
 * @public
 */
export function provideConvexAuth(options: ConvexAuthProviderOptions): ConvexAuthState {
  const authState = createConvexAuthState(options)
  provide(ConvexAuthStateKey, authState)
  return authState
}

/**
 * Build reactive {@link ConvexAuthState} and wire watchers between the
 * external auth provider and the Convex client, without calling `provide()` —
 * the body of upstream's `ConvexProviderWithAuth` component.
 *
 * Use this when you need to install the state at the Nuxt app level
 * (`nuxtApp.vueApp.provide`) rather than from a component's setup function.
 *
 * When `scope` is provided, all watchers are created inside that
 * {@link EffectScope} so callers can dispose them later.
 */
// Public API (documented): installs auth state at the Nuxt app level; the two
// wrappers below are the only in-repo callers.
// fallow-ignore-next-line unused-export
export function createConvexAuthState(
  options: ConvexAuthProviderOptions,
  scope?: EffectScope,
): ConvexAuthState {
  const { client, useAuth } = options
  const {
    isLoading: authProviderLoading,
    isAuthenticated: authProviderAuthenticated,
    fetchAccessToken,
    authVersion,
  } = useAuth()

  const isConvexAuthenticated = ref<boolean | null>(null)
  const isRefreshing = ref<boolean>(false)

  const register = () => {
    // Reconcile the Convex auth state with the external auth provider.
    //
    // This mirrors the render-phase reconciliation in convex/react's
    // `ConvexProviderWithAuth`, which re-runs on *every* render — including
    // renders caused by `isConvexAuthenticated` itself changing. That property
    // is essential: the `setAuth` effect's cleanup below resets
    // `isConvexAuthenticated` to `null` whenever the provider stops being
    // authenticated. On a live sign-out the provider transitions straight from
    // authenticated to not-authenticated in a single tick, so the cleanup fires
    // in the same flush as this watcher. If we only tracked
    // `[loading, authenticated]` (as a plain Vue `watch` would), the cleanup's
    // reset to `null` would never be corrected and `useConvexAuth().isLoading`
    // would hang at `true` forever. Tracking `isConvexAuthenticated.value` here
    // re-runs the reconciliation after the cleanup and settles it to `false`.
    watch(
      () => [
        toValue(authProviderLoading),
        toValue(authProviderAuthenticated),
        isConvexAuthenticated.value,
      ] as const,
      ([authProviderLoading, authProviderAuthenticated]) => {
        // If the useAuth went back to the authProviderLoading state (which is unusual but possible)
        // reset the Convex auth state to null so that we can correctly
        // transition the state from "loading" to "authenticated"
        // without going through "unauthenticated".
        if (authProviderLoading && isConvexAuthenticated.value !== null) {
          isConvexAuthenticated.value = null
          isRefreshing.value = false
        }

        // If the useAuth goes to not authenticated then isConvexAuthenticated should reflect that.
        if (
          !authProviderLoading
          && !authProviderAuthenticated
          && isConvexAuthenticated.value !== false
        ) {
          isConvexAuthenticated.value = false
          isRefreshing.value = false
        }
      },
      { immediate: true },
    )

    // Set auth on the Convex client when authenticated. Merges upstream's
    // `ConvexAuthStateFirstEffect` and `ConvexAuthStateLastEffect` (their
    // first/last-child ordering guarantees relative to sibling components'
    // query subscriptions have no Vue watcher-scheduling equivalent).
    watchEffect((onCleanup) => {
      // Upstream runs this in a passive effect (useEffect), which React never
      // executes during SSR. Vue *does* run a watchEffect body once during SSR
      // setup — and `onCleanup` never fires there — so `setAuth` would lazily
      // instantiate the sync client and open a WebSocket on the server that
      // nothing ever closes, once per request. Mirror the SSR short-circuit in
      // `use-queries.ts`; the reconciliation watcher above still runs so SSR
      // renders `isLoading: true`.
      if (import.meta.server) {
        return
      }
      let isThisEffectRelevant = true
      // The loading flag is read only for dependency tracking (the effect
      // re-registers when it flips, mirroring upstream's effect deps) — it
      // must not gate `setAuth`: a provider may report a cached session
      // (authenticated) while still revalidating (loading), and upstream
      // authenticates the client immediately in that window.
      void toValue(authProviderLoading)
      void toValue(authVersion)
      // Unwrapping here (not outside the effect) tracks the ref, so a new
      // fetcher identity re-registers auth — upstream's effect re-running when
      // `fetchAccessToken` changes between renders.
      const fetchToken = unref(fetchAccessToken)
      if (toValue(authProviderAuthenticated)) {
        client.setAuth(
          fetchToken,
          (convexReportsIsAuthenticated) => {
            if (isThisEffectRelevant) {
              isConvexAuthenticated.value = convexReportsIsAuthenticated
            }
          },
          // Upstream names this callback's parameter `isRefreshing` too; that
          // would shadow the ref here.
          (refreshing) => {
            if (isThisEffectRelevant) {
              isRefreshing.value = refreshing
            }
          },
        )
        onCleanup(() => {
          isThisEffectRelevant = false

          client.clearAuth()
          // Set state back to loading in case this is a transition from one
          // fetchToken function to another which signals a new auth context,
          // e.g. a new orgId from Clerk. Auth context changes like this
          // return isAuthenticated: true from useAuth() but if
          // useAuth reports isAuthenticated: false on the next flush
          // then this null value will be overridden to false.
          isConvexAuthenticated.value = null
          isRefreshing.value = false
        })
      }
    })
  }

  if (scope) {
    scope.run(register)
  }
  else {
    register()
  }

  const isAuthenticated = computed(
    () => toValue(authProviderAuthenticated) && (isConvexAuthenticated.value ?? false),
  )
  return {
    isLoading: computed(() => isConvexAuthenticated.value === null),
    isAuthenticated,
    isRefreshing: computed(() => isRefreshing.value && isAuthenticated.value),
  }
}

/**
 * Create a fresh {@link EffectScope} and build a Convex auth state inside it.
 * The scope is returned so the caller can `.stop()` it on teardown.
 */
export function createScopedConvexAuthState(
  options: ConvexAuthProviderOptions,
): { state: ConvexAuthState, scope: EffectScope } {
  const scope = effectScope(true)
  const state = createConvexAuthState(options, scope)
  return { state, scope }
}
