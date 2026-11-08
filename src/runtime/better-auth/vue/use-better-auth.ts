import type { AuthTokenFetcher } from 'convex/browser'
import { computed, effectScope, hasInjectionContext, inject, shallowRef, triggerRef, watch, type ComputedRef, type EffectScope, type ShallowRef } from 'vue'
import type { AuthClient } from '#convex/auth-client'
import { __resetAuthClientLoaderForTests, isAuthClientDeferred, lazyAuthClient, loadAuthClient, loadedAuthClient, onAuthClient } from './auth-client-loader'
import { BetterAuthTokenStoreKey, clearToken, createBetterAuthTokenStore, PENDING_AUTH_VERSION, readTokenClaims, seedInitialToken, type BetterAuthTokenStore } from './token-store'

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

// The browser's session ref, subscribed once for the app's lifetime in a scope
// of its own. Subscribing per call left a listener behind on every call made
// outside a component, such as the `convex-auth` middleware on each guarded
// navigation.
let browserSession: BetterAuthSession | undefined
let browserSessionScope: EffectScope | undefined
// PARITY: D-18
// Set once the session settled without the client (no session on the
// request, or a client that could not load): Better Auth's store reads
// pending before its first answer, and a settled session must not drop back
// to loading while it waits.
let settledWithoutClient = false
// Whether the session holds an answer from the client's own store, rather
// than one it settled on without the client.
const clientAnswered = shallowRef(false)

type SessionState = BetterAuthSession['value']

// PARITY: D-18
// Better Auth's session store lives on the client, which loads on first use.
// Until it arrives the session reads pending, as Better Auth's own store reads
// before its first fetch, so the hydrating page matches the server render. Its
// `refetch` loads the client first.
const pendingSessionState = (): SessionState => {
  const refetch = async (...args: unknown[]): Promise<void> => {
    await loadAuthClient()
    const next = browserSession!.value.refetch as (...args: unknown[]) => Promise<void>
    // Still this one: nothing mirrors the client's session.
    if (next === refetch) return
    return next(...args)
  }
  return { data: null, error: null, isPending: true, isRefetching: false, refetch } as unknown as SessionState
}

const useClientSession = (): BetterAuthSession => {
  if (import.meta.server) return serverSession()
  browserSessionScope ??= effectScope(true)
  const scope = browserSessionScope
  return browserSession ??= scope.run(() => {
    const session = shallowRef(pendingSessionState()) as ShallowRef<SessionState>
    // PARITY: D-18
    // Mirror the store once the client is here; ask for it unless the server
    // found no session, in which case the first use asks.
    onAuthClient(client => scope.active && scope.run(() => {
      watch(client.useSession(), (state) => {
        if (settledWithoutClient && state.isPending) {
          // Keep what the session settled on; take the client's refetch.
          if (session.value.refetch !== state.refetch) session.value = { ...session.value, refetch: state.refetch }
          return
        }
        settledWithoutClient = false
        session.value = state
        if (!state.isPending) clientAnswered.value = true
      }, { immediate: true, flush: 'sync' })
    }))
    if (!isAuthClientDeferred()) void loadAtStartup()
    // Maps upstream's `useEffect` that drops the SSR token once the session
    // loads. Better Auth reads pending again when a signed-out session
    // refetches, so a token left here would read as signed in. Only the
    // signed-out case: a signed-in session keeps its token.
    watch(session, ({ data, isPending }) => {
      if (!data && !isPending) clearToken(browserStore)
    }, { flush: 'sync' })
    return session as unknown as BetterAuthSession
  })!
}

// PARITY: D-18
// A chunk that fails to load (a deploy that replaced it, a dropped request)
// is asked for once more; a second failure settles the session signed out,
// with the error, so a page that makes no further use of the client does not
// read loading for good. The next use asks for the chunk again.
async function loadAtStartup(): Promise<void> {
  try {
    await loadAuthClient().catch(() => loadAuthClient())
  }
  catch (error) {
    console.warn('[nuxt-convex-module] Failed to load the Better Auth client:', error)
    settle(error)
  }
}

/**
 * Load the client and wait until its own store has answered for the session:
 * what a guarded navigation or a forced token request decides on, where a
 * session settled without the client (signed out on the server's word)
 * could be stale, as after a sign-in in another tab. A client that fails to
 * load settles the session signed out instead. @internal
 */
export async function clientSessionSettled(): Promise<void> {
  useClientSession()
  try {
    await loadAuthClient()
  }
  catch {
    settle()
    return
  }
  if (clientAnswered.value) return
  await new Promise<void>((resolve) => {
    const stop = watch(clientAnswered, (answered) => {
      if (!answered) return
      stop()
      resolve()
    })
  })
}

/** Settle a session the client has not answered for: signed out, with the load's error when it failed. */
function settle(error: unknown = null): void {
  const session = useClientSession() as unknown as ShallowRef<SessionState>
  if (loadedAuthClient() || !session.value.isPending) return
  settledWithoutClient = true
  session.value = { ...session.value, isPending: false, error } as SessionState
}

/**
 * Settle a deferred session as signed out, without the client: the server
 * found no session on this request, and the page has hydrated. A session the
 * client already reports is left alone. @internal
 */
export function settleSessionWithoutClient(): void {
  settle()
}

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
  /** `true` until the session is known and no prefetched token covers the gap, or while a token from another user is replaced. */
  isLoading: ComputedRef<boolean>
  /** `true` when Better Auth reports a session, or the prefetched token covers the session loading. */
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
  /** The session id (or user id), `null` when signed out, `undefined` until the session settles. */
  authVersion: ComputedRef<string | null | undefined>
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
  // PARITY: D-18
  // The loaded client, or one that loads on its first call until it is.
  const client = loadedAuthClient() ?? lazyAuthClient

  // `undefined` while the session is pending: nothing is known yet, and the
  // session that settles is the one a seeded token was minted for.
  const authVersion = computed<string | null | undefined>(() => {
    const data = session.value.data as BetterAuthSessionData | undefined
    const id = data?.session?.id ?? data?.user?.id ?? null
    return id === null && session.value.isPending ? undefined : id
  })

  const currentAuthVersion = () => authVersion.value === undefined ? PENDING_AUTH_VERSION : authVersion.value

  // A token from before the session settled belongs to whoever the server saw.
  // If another session started during the load, the session settles to it, and
  // the connection must not stay on the old token until its next refresh. The
  // token names its session; a token that doesn't is compared by user.
  const holdsAnotherSessionsToken = computed(() => {
    const data = session.value.data as BetterAuthSessionData | undefined
    if (!data || !cachedToken.value || store.cachedTokenVersion !== PENDING_AUTH_VERSION) return false
    if (store.initialTokenSessionId && data.session?.id) return store.initialTokenSessionId !== data.session.id
    const subject = readTokenClaims(cachedToken.value)?.sub
    return !!data.user?.id && subject !== undefined && subject !== data.user.id
  })

  // The token standing in for a session that hasn't loaded. Maps upstream's
  // `isSsrTokenActive`: a token fetched for a past session never counts.
  const isServerTokenActive = () => session.value.isPending && cachedToken.value !== null && store.cachedTokenVersion === PENDING_AUTH_VERSION

  // PARITY: D-18
  // Signed out on the server's word, without the client: a forced request
  // asks the client, which may know of a session started since.
  const signedInSince = async (forceRefreshToken: boolean): Promise<boolean> => {
    if (!forceRefreshToken || import.meta.server || clientAnswered.value) return false
    await clientSessionSettled()
    return currentAuthVersion() !== null
  }

  const fetchAccessToken: AuthTokenFetcher = async ({
    forceRefreshToken = false,
  }: { forceRefreshToken?: boolean } = {}) => {
    const version = currentAuthVersion()

    // Maps upstream's cache-clearing `useEffect`: the session settled to
    // signed-out, so drop the cached token instead of fetching a new one.
    if (version === null) {
      if (await signedInSince(forceRefreshToken)) return fetchAccessToken({ forceRefreshToken })
      clearToken(store)
      return null
    }

    // The session the prefetched token names has settled: it is that session's
    // token, as upstream's cache entry is from the moment it is seeded.
    if (store.cachedTokenVersion === PENDING_AUTH_VERSION && store.initialTokenSessionId === version) {
      store.cachedTokenVersion = version
    }

    // The version checks replace upstream's `[sessionId]` callback deps: an
    // entry from another session never satisfies this caller.
    if (!forceRefreshToken) {
      // Prefer an in-flight request, which may be refreshing a rejected token,
      // over the cached token.
      if (store.pendingToken && store.pendingTokenVersion === version) {
        return store.pendingToken
      }
      if (cachedToken.value && store.cachedTokenVersion === version) {
        return cachedToken.value
      }
    }
    // PARITY: F-05
    // Fixes an upstream bug: upstream answers every failed fetch with `null`, and
    // on `null` the sync client signs a live connection out and never retries.
    // Only a 401 says the session is gone. Any other failure keeps this session's
    // token, which leaves the connection running until expiry.
    const afterFailure = () => {
      if (cachedToken.value && !holdsAnotherSessionsToken.value && (store.cachedTokenVersion === version || store.cachedTokenVersion === PENDING_AUTH_VERSION)) {
        return cachedToken.value
      }
      if (isLatest()) {
        cachedToken.value = null
        store.cachedTokenVersion = version
      }
      return null
    }
    store.pendingTokenVersion = version
    // PARITY: D-16
    // Only the latest request writes the cache: a newer one replaced this one,
    // or the session ended while it was in flight.
    const isLatest = () => store.pendingToken === pending
    // PARITY: D-18
    // Upstream's client is already here; this one may load first.
    const pending: Promise<string | null> = store.pendingToken = loadAuthClient()
      .then(client => client.convex.token({ fetchOptions: { throw: false } }))
      .then(({ data, error }) => {
        if (error && error.status !== 401) {
          return afterFailure()
        }
        const token = data?.token || null
        if (isLatest()) {
          store.cachedTokenVersion = version
          cachedToken.value = token
          // Tokens minted in the same second are identical, and the version moved.
          triggerRef(cachedToken)
        }
        return token
      })
      .catch(afterFailure)
      .finally(() => {
        if (isLatest()) {
          store.pendingToken = null
          store.pendingTokenVersion = null
        }
      })
    return pending
  }

  return {
    isLoading: computed(() => (session.value.isPending && !isServerTokenActive()) || holdsAnotherSessionsToken.value),
    // PARITY: D-03
    // Diverges from upstream's `Boolean(session?.session) || isSsrTokenActive`:
    // Better Auth session data without a nested `session` still counts as
    // signed in.
    isAuthenticated: computed(
      () => !!session.value.data || isServerTokenActive(),
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

/**
 * Forget what the Better Auth integration keeps for the app's lifetime: the
 * browser's token cache and its session subscription. Published from
 * `nuxt-convex-module/testing`; call it between tests that sign in.
 */
export function resetBetterAuthState(): void {
  Object.assign(browserStore, createBetterAuthTokenStore(), { cachedToken: browserStore.cachedToken })
  browserStore.cachedToken.value = null
  browserSessionScope?.stop()
  browserSessionScope = undefined
  browserSession = undefined
  settledWithoutClient = false
  clientAnswered.value = false
  __resetAuthClientLoaderForTests()
}

/**
 * The old name of {@link resetBetterAuthState}, which test helpers reached
 * by this file's path before `nuxt-convex-module/testing` existed.
 *
 * @deprecated Import `resetBetterAuthState` from `nuxt-convex-module/testing`.
 * @internal
 */
export const __resetUseBetterAuthForTests = resetBetterAuthState
