/**
 * Binds Convex Auth's session engine to Vue: a port of `@convex-dev/auth`'s
 * `react/client.tsx`.
 */
import type { IsAuthenticatedFn, TokenBundle } from '@convex-dev/auth'
import type { AuthClient } from '@convex-dev/auth/browser'
import type { AuthTokenFetcher } from 'convex/browser'
import { computed, inject, onMounted, onScopeDispose, provide, shallowRef, watch, type ComputedRef, type InjectionKey } from 'vue'
import type { ConvexAuthState } from '../../vue/auth/index'
import { useQuery } from '../../vue/composables/use-query'
import type { AuthSignInApi } from '../upstream/browser/ambientSignInClient'
import type { SlimTokenBundle } from '../upstream/lib/types'

export type { AuthSignInApi }

const ConvexAuthSignInApiKey: InjectionKey<AuthSignInApi> = Symbol('ConvexAuthSignInApi')

/**
 * The {@link AuthSignInApi} for the surrounding auth provider.
 *
 * The sign-in composables call this to run their sign-in function instead of
 * reaching for `useMutation`/`useAction`, which is what keeps them working
 * under either session model. Throws when used outside an auth provider.
 */
export function useAuthSignInApi(): AuthSignInApi {
  const signInApi = inject(ConvexAuthSignInApiKey, undefined)
  if (signInApi === undefined) {
    throw new Error(
      'useAuthSignInApi must be used below `provideConvexAuth` (or within a <ConvexAuthProvider>).',
    )
  }
  return signInApi
}

/** The value exposed by {@link useAuthActions}. */
export type ConvexAuthActionsContextType = {
  /**
   * Initialize or refresh a session.
   *
   * A SPA client will receive a full {@link TokenBundle} so it can access the
   * refresh token for direct session refreshing. An SSR client will receive a
   * {@link SlimTokenBundle} which doesn't include the refresh token (that
   * value is in an httpOnly cookie, not reachable by client JS code).
   */
  setSession: (session: TokenBundle | SlimTokenBundle) => Promise<void>
  /** Sign out: revoke the session on the server and clear it locally. */
  signOut: () => Promise<void>
}

export const ConvexAuthActionsKey: InjectionKey<ConvexAuthActionsContextType> = Symbol('ConvexAuthActions')

/** The current access token (a JWT), or null when signed out. */
export const ConvexAuthTokenKey: InjectionKey<ComputedRef<string | null>> = Symbol('ConvexAuthToken')

/**
 * Watches the app's `isAuthenticated` query and signs the client out when its
 * session is revoked server-side.
 *
 * The subscription (only active once the client itself authenticates) makes
 * revocation reactive: when a session is deleted, the query re-runs, the
 * result flips to `false`, and the local session is cleared without waiting
 * for the access token to expire.
 *
 * Upon `false`, it triggers a full `signOut`. In addition to clearing client
 * signed-in state, under SSR it clears the cookies holding the dead tokens.
 * On an already-revoked session the Convex `signOut` call is a no-op.
 *
 * Upstream's `<SessionWatcher>` reads the auth client and the Convex auth
 * state from context. A Vue component cannot inject what it provides itself,
 * and the provider calls this in its own `setup`, so both arrive as arguments.
 */
export function useSessionWatcher(
  authClient: AuthClient,
  isAuthenticated: IsAuthenticatedFn,
  { isAuthenticated: isClientAuthenticated }: ConvexAuthState,
): void {
  const hasLiveSession = useQuery(
    isAuthenticated,
    () => isClientAuthenticated.value ? {} : 'skip',
  )
  if (!import.meta.server) {
    watch(
      () => hasLiveSession.value === false,
      (revoked) => {
        if (revoked) void authClient.signOut()
      },
    )
  }
}

/**
 * Binds an {@link AuthClient} to Vue and provides the sign-in api, the
 * actions, and the token. Called by `provideConvexAuth`, which passes the
 * returned auth state to `provideConvexWithAuth`.
 *
 * Upstream's `<AuthProvider>` puts that state in a context for a module-level
 * `useAuth` to read. Here it is the return value, for the same reason as in
 * {@link useSessionWatcher}.
 */
export function provideAuth({
  authClient,
  signInApi,
}: {
  authClient: AuthClient
  /** How the sign-in composables execute their sign-in functions. See {@link AuthSignInApi}. */
  signInApi: AuthSignInApi
}): {
  isLoading: () => boolean
  isAuthenticated: () => boolean
  fetchAccessToken: AuthTokenFetcher
} {
  // Before `init()` reads storage the snapshot is the loading state, on the
  // server and in the browser alike. `init()` runs after mount, so the first
  // client render matches the server's.
  const state = shallowRef(authClient.getSnapshot())

  if (!import.meta.server) {
    const unsubscribe = authClient.subscribe(() => {
      state.value = authClient.getSnapshot()
    })
    onMounted(() => {
      void authClient.init()
    })
    onScopeDispose(() => {
      unsubscribe()
      authClient.dispose()
    })
  }

  const fetchAccessToken: AuthTokenFetcher = args => authClient.fetchAccessToken(args)

  const authState = {
    isLoading: () => state.value.isLoading,
    isAuthenticated: () => state.value.isAuthenticated,
    fetchAccessToken,
  }

  const actions: ConvexAuthActionsContextType = {
    setSession: authClient.setSession,
    signOut: authClient.signOut,
  }

  provide(ConvexAuthSignInApiKey, signInApi)
  provide(ConvexAuthActionsKey, actions)
  provide(ConvexAuthTokenKey, computed(() => state.value.token))

  return authState
}
