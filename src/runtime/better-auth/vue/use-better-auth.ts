import type { AuthTokenFetcher } from 'convex/browser'
import { computed, hasInjectionContext, inject, ref, shallowRef, type ComputedRef, type InjectionKey, type Ref } from 'vue'
import { authClient, type AuthClient } from '#convex/auth-client'

/**
 * The Convex token state behind `useBetterAuth()`, shared by every call in one
 * app: the cached JWT and the fetch in flight, so concurrent
 * `fetchAccessToken()` callers share the same Better Auth round-trip.
 *
 * @internal
 */
export interface BetterAuthTokenStore {
  cachedToken: Ref<string | null>
  cachedTokenVersion: string | null
  pendingToken: Promise<string | null> | null
  pendingTokenVersion: string | null
  initialTokenUsed: boolean
}

/** A store with no token yet. @internal */
export function createBetterAuthTokenStore(): BetterAuthTokenStore {
  return {
    cachedToken: ref(null),
    cachedTokenVersion: null,
    pendingToken: null,
    pendingTokenVersion: null,
    initialTokenUsed: false,
  }
}

/** The key the server plugin provides each request's store under. @internal */
export const BetterAuthTokenStoreKey: InjectionKey<BetterAuthTokenStore> = Symbol('BetterAuthTokenStore')

const PENDING_AUTH_VERSION = '__pending__'

/**
 * Hand a store its prefetched token, once per store: the token covers the gap
 * until the session loads, so the first render reads signed-in.
 *
 * @internal
 */
export function seedInitialToken(store: BetterAuthTokenStore, initialToken: string | null | undefined): void {
  if (store.initialTokenUsed || !initialToken) return
  store.cachedToken.value = initialToken
  store.cachedTokenVersion = PENDING_AUTH_VERSION
  store.initialTokenUsed = true
}

// The browser runs one app, so its store lives at module scope.
const browserStore = createBetterAuthTokenStore()

// PARITY: D-13
// Upstream keeps the token in React state, one per provider, so each server
// render starts from its own `initialToken`. A Nitro process renders every
// visitor's request with this one module, so a server render takes the store
// its request's plugin provided, and a call outside any app gets a store of
// its own: never one another visitor's render can read.
function useTokenStore(): BetterAuthTokenStore {
  if (!import.meta.server) return browserStore
  return (hasInjectionContext() ? inject(BetterAuthTokenStoreKey, null) : null) ?? createBetterAuthTokenStore()
}

type BetterAuthSessionData = {
  session?: {
    id?: string | null
  } | null
  user?: {
    id?: string | null
  } | null
} | null

// PARITY: D-13
// On the server Better Auth's session store never fetches, so it reads
// pending for the whole render. It is also one store for every request, and
// `useStore` subscribes to it in a scope no server render disposes: one
// listener kept for good per call. A server render reads the same pending
// state from a ref of its own instead.
const serverSession = () => shallowRef({
  data: null,
  error: null,
  isPending: true,
  isRefetching: false,
  refetch: async () => {},
}) as unknown as BetterAuthSession

const useClientSession = (): BetterAuthSession => import.meta.server ? serverSession() : authClient.useSession()

// Read off `AuthClient`, so the published type follows the app's own client
// through `#convex/auth-client`; `typeof useClientSession` would freeze the
// bundled client's session into the declaration file. `useSession` is
// overloaded, and the no-argument form is the one called above.
export type BetterAuthSession = AuthClient['useSession'] extends { (): infer R, (useFetch: any): any } ? R : never

/** The signed-in user (loose — exact fields depend on your auth schema). */
export type BetterAuthUser = { id: string, email: string, name: string } & Record<string, unknown>

/** What `useBetterAuth()` returns. */
export interface UseBetterAuthReturn {
  // Upstream's `useAuthFromBetterAuth` return shape, in upstream order.
  /** `true` until the session is known and no prefetched token covers the gap. */
  isLoading: ComputedRef<boolean>
  /** `true` when Better Auth reports a session, or a token is cached while it reloads. */
  isAuthenticated: ComputedRef<boolean>
  /** Convex's token fetcher: the Better Auth JWT for the current session, or `null`. */
  fetchAccessToken: AuthTokenFetcher
  // Vue-only service extensions (documented in PARITY.md). Auth *flows*
  // (sign-in, sign-out, OTP, passkeys, ...) are not wrapped here — call them
  // on `client`, which is fully typed by the plugins your auth client installs.
  /** The Better Auth client from `#convex/auth-client` — sign-in, sign-out and every plugin flow live here. */
  client: AuthClient
  /** Better Auth's own `useSession()` ref: `{ data, isPending, error }`. */
  session: BetterAuthSession
  /** The current user, or `null` when signed out / still loading. */
  user: ComputedRef<BetterAuthUser | null>
  /** The session id (or user id); changes when the signed-in identity changes. */
  authVersion: ComputedRef<string | null>
}

/**
 * The Better Auth service for the Vue/Nuxt runtime.
 *
 * Returns the full Better Auth client, the reactive session wrapper, and the
 * Convex-compatible auth state used by the packaged auth plugin.
 *
 * @param initialToken - Optional preloaded token, used once per app lifetime
 *   to avoid a round-trip on initial load (e.g. from SSR).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const { user, client, isAuthenticated } = useBetterAuth()
 *
 * const signOut = () => client.signOut()
 * </script>
 * ```
 *
 * @public
 */
export function useBetterAuth(initialToken?: string | null): UseBetterAuthReturn {
  const store = useTokenStore()
  seedInitialToken(store, initialToken)
  const { cachedToken } = store

  const session = useClientSession()
  const client = authClient

  const authVersion = computed<string | null>(() => {
    const data = session.value.data as BetterAuthSessionData | undefined
    return data?.session?.id ?? data?.user?.id ?? null
  })

  const currentAuthVersion = () => authVersion.value ?? (session.value.isPending ? PENDING_AUTH_VERSION : null)

  const fetchAccessToken: AuthTokenFetcher = async ({
    forceRefreshToken = false,
  }: { forceRefreshToken?: boolean } = {}) => {
    const version = currentAuthVersion()

    // Maps upstream's cache-clearing `useEffect`: the session settled to
    // signed-out, so drop the cached token instead of fetching a new one.
    if (version === null) {
      cachedToken.value = null
      store.cachedTokenVersion = null
      store.pendingToken = null
      store.pendingTokenVersion = null
      return null
    }

    // The trailing version checks replace upstream's `[sessionId]` callback
    // deps: a cache entry from another session never satisfies this caller.
    if (cachedToken.value && !forceRefreshToken && store.cachedTokenVersion === version) {
      return cachedToken.value
    }
    if (!forceRefreshToken && store.pendingToken && store.pendingTokenVersion === version) {
      return store.pendingToken
    }
    store.pendingTokenVersion = version
    const pending = store.pendingToken = client.convex
      .token({ fetchOptions: { throw: false } })
      .then(({ data }) => {
        const token = data?.token || null
        cachedToken.value = token
        store.cachedTokenVersion = version
        return token
      })
      .catch(() => {
        cachedToken.value = null
        store.cachedTokenVersion = version
        return null
      })
      .finally(() => {
        store.pendingToken = null
        store.pendingTokenVersion = null
      })
    return pending
  }

  return {
    isLoading: computed(() => session.value.isPending && !cachedToken.value),
    // PARITY: D-03
    // Diverges from upstream's `Boolean(session?.session) || cachedToken !== null`:
    // a settled signed-out session must read unauthenticated immediately (Vue has
    // no re-render to run upstream's cache-clearing effect first), and Better Auth
    // session data without a nested `session` still counts as signed in.
    isAuthenticated: computed(
      () => !!session.value.data || (session.value.isPending && cachedToken.value !== null),
    ),
    fetchAccessToken,
    // PARITY: A-06 — Vue-only service extensions.
    client,
    session,
    user: computed<BetterAuthUser | null>(() => {
      const data = session.value.data as { user?: BetterAuthUser } | null | undefined
      return data?.user ?? null
    }),
    authVersion,
  }
}

/** Reset module-level token cache — intended for tests only. @internal */
export function __resetUseBetterAuthForTests() {
  Object.assign(browserStore, createBetterAuthTokenStore(), { cachedToken: browserStore.cachedToken })
  browserStore.cachedToken.value = null
}
