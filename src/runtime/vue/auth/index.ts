import type { AuthTokenFetcher } from 'convex/browser'
import { computed, effectScope, inject, nextTick, provide, ref, toValue, unref, watch, type ComputedRef, type EffectScope, type InjectionKey, type MaybeRef, type MaybeRefOrGetter } from 'vue'

// PARITY: A-10
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
      + 'Ensure `provideConvexWithAuth` has been called in an ancestor component '
      + 'or that the Convex auth plugin is installed, or you might have two '
      + 'instances of the `nuxt-convex-module` runtime loaded in your project.',
    )
  }
  return authContext
}

/**
 * Options for {@link provideConvexWithAuth} — the Vue translation of the props of
 * upstream's `ConvexProviderWithAuth` component.
 */
export interface ConvexProviderWithAuthOptions {
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
     * again against the new auth context. `undefined` means the provider does
     * not know the context yet, so the first value it learns is no change.
     */
    authVersion?: MaybeRefOrGetter<unknown>
  }
}

/** The clear each client still owes, and the registration waiting behind it. */
const pendingClears = new WeakMap<IConvexVueClient, { start: (() => void) | null }>()

/**
 * Clear auth once this flush is over.
 *
 * PARITY: D-15
 * `clearAuth` makes the server re-run every subscribed query signed out, so it
 * goes last, as upstream's last-child effect does: after the queries gated on
 * `isAuthenticated` have left. A registration made meanwhile waits behind it,
 * on this client whichever auth state made it, or the clear would wipe it.
 */
function clearAuthLast(client: IConvexVueClient, ended: () => void): void {
  const pending = pendingClears.get(client)
  if (pending) {
    if (pending.start === ended) {
      pending.start = null
    }
    return
  }
  const clear: { start: (() => void) | null } = { start: null }
  pendingClears.set(client, clear)
  void nextTick(() => {
    pendingClears.delete(client)
    try {
      client.clearAuth()
    }
    catch {
      // Closed right after the scope stopped: nothing is left to clear.
      return
    }
    clear.start?.()
  })
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
 * import { useAuth } from '~/composables/useMyAuthProvider'  // your auth provider
 *
 * const client = useConvex()
 * const authState = provideConvexWithAuth({ client, useAuth })
 * </script>
 * ```
 *
 * @param options - Auth integration options including the Convex client and
 *   an `useAuth` factory that returns loading state and a token fetcher.
 * @returns The reactive auth state.
 *
 * @public
 */
export function provideConvexWithAuth(options: ConvexProviderWithAuthOptions): ConvexAuthState {
  const authState = createConvexAuthState(options)
  provide(ConvexAuthStateKey, authState)
  return authState
}

/**
 * The old name of {@link provideConvexWithAuth}.
 *
 * @deprecated Use `provideConvexWithAuth`, the port of `ConvexProviderWithAuth`.
 * The next minor release gives this name to Convex Auth's `ConvexAuthProvider`.
 * @public
 */
export const provideConvexAuth = provideConvexWithAuth

/**
 * The old name of {@link ConvexProviderWithAuthOptions}.
 *
 * @deprecated Use `ConvexProviderWithAuthOptions`. Removed in the next minor release.
 */
export type ConvexAuthProviderOptions = ConvexProviderWithAuthOptions

/**
 * Build reactive {@link ConvexAuthState} and wire watchers between the
 * external auth provider and the Convex client, without calling `provide()` —
 * the body of upstream's `ConvexProviderWithAuth` component.
 *
 * Use this when you need to install the state at the Nuxt app level
 * (`nuxtApp.vueApp.provide`) rather than from a component's setup function.
 *
 * When `scope` is provided, all watchers are created inside that
 * `EffectScope` so callers can dispose them later.
 */
export function createConvexAuthState(
  options: ConvexProviderWithAuthOptions,
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

    // Counts the changes of auth context. A version the provider has only now
    // learned is the context it already had: a Better Auth session settling on
    // a page seeded with a server token must keep that token.
    const authContext = ref(0)
    watch(
      () => toValue(authVersion),
      (_version, previous) => {
        if (previous !== undefined) authContext.value++
      },
    )

    // Set auth on the Convex client when authenticated. Merges upstream's
    // `ConvexAuthStateFirstEffect` and `ConvexAuthStateLastEffect`.
    //
    // A `watch` with its sources spelled out, like upstream's effect deps, not
    // a `watchEffect`: `client.setAuth` runs the fetcher synchronously, so an
    // effect would also track what the fetcher reads. Better Auth's token cache
    // is one such read, and re-registering on every refresh would make the sync
    // client drop the reauthentication an `AuthError` started, its socket
    // stopped for good.
    watch(
      [
        // The loading flag is here only so auth re-registers when it flips,
        // mirroring upstream's effect deps. It must not gate `setAuth`: a
        // provider may report a cached session (authenticated) while still
        // revalidating (loading), and upstream authenticates the client
        // immediately in that window.
        () => toValue(authProviderLoading),
        authContext,
        // Unwrapping here tracks the ref, so a new fetcher identity
        // re-registers auth: upstream's effect re-running when
        // `fetchAccessToken` changes between renders.
        () => unref(fetchAccessToken),
        () => toValue(authProviderAuthenticated),
      ] as const,
      ([, , fetchToken, authenticated], _previous, onCleanup) => {
        // PARITY: D-01
        // Upstream runs this in a passive effect (useEffect), which React never
        // executes during SSR. Vue *does* run a watcher once during SSR setup,
        // and `onCleanup` never fires there, so `setAuth` would lazily
        // instantiate the sync client and open a WebSocket on the server that
        // nothing ever closes, once per request. Mirror the SSR short-circuit
        // in `use-queries.ts`; the reconciliation watcher above still runs so
        // SSR renders `isLoading: true`.
        if (import.meta.server) {
          return
        }
        if (!authenticated) {
          return
        }
        let isThisEffectRelevant = true
        const start = () => client.setAuth(
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
        const pending = pendingClears.get(client)
        if (pending) {
          pending.start = start
        }
        else {
          start()
        }
        onCleanup(() => {
          isThisEffectRelevant = false
          // Set state back to loading in case this is a transition from one
          // fetchToken function to another which signals a new auth context,
          // e.g. a new orgId from Clerk. Auth context changes like this
          // return isAuthenticated: true from useAuth() but if
          // useAuth reports isAuthenticated: false on the next flush
          // then this null value will be overridden to false.
          isConvexAuthenticated.value = null
          isRefreshing.value = false
          clearAuthLast(client, start)
        })
      },
      { immediate: true },
    )
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
  const isLoading = computed(() => isConvexAuthenticated.value === null)
  const isRefreshingWhileAuthenticated = computed(
    () => isRefreshing.value && isAuthenticated.value,
  )

  // Upstream (convex 1.44.0) wraps this object in a `useMemo` keyed on the three
  // derived booleans, so `useConvexAuth()` consumers only re-render when the
  // auth state actually changes. Vue needs no analog: the object is built once
  // per call and each field is a `computed` that only re-triggers dependents on
  // an actual value change, so the identity is already stable.
  return {
    isLoading,
    isAuthenticated,
    isRefreshing: isRefreshingWhileAuthenticated,
  }
}

/**
 * Create a fresh `EffectScope` and build a Convex auth state inside it.
 * The scope is returned so the caller can `.stop()` it on teardown.
 */
// PARITY: A-08
export function createScopedConvexAuthState(
  options: ConvexProviderWithAuthOptions,
): { state: ConvexAuthState, scope: EffectScope } {
  const scope = effectScope(true)
  const state = createConvexAuthState(options, scope)
  return { state, scope }
}
