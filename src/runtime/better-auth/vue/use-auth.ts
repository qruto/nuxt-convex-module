import type { AuthTokenFetcher } from 'convex/browser'
import { computed, ref, type ComputedRef } from 'vue'
import { authClient, type AuthClient } from '#convex/auth-client'

/**
 * Module-level state, shared across all `useAuth()` calls in the Nuxt app.
 *
 * The cached JWT and in-flight token promise are kept at module scope so
 * concurrent `fetchAccessToken()` callers share the same Better Auth round-trip.
 */
const cachedToken = ref<string | null>(null)
let cachedTokenVersion: string | null = null
let pendingToken: Promise<string | null> | null = null
let pendingTokenVersion: string | null = null
let initialTokenUsed = false

const PENDING_AUTH_VERSION = '__pending__'

type BetterAuthSessionData = {
  session?: {
    id?: string | null
  } | null
  user?: {
    id?: string | null
  } | null
} | null

const useClientSession = () => authClient.useSession()

export type AuthSession = ReturnType<typeof useClientSession>

/** The signed-in user (loose — exact fields depend on your auth schema). */
export type AuthUser = { id: string, email: string, name: string } & Record<string, unknown>

export interface UseAuthService {
  // Upstream's `useAuthFromBetterAuth` return shape, in upstream order.
  isLoading: ComputedRef<boolean>
  isAuthenticated: ComputedRef<boolean>
  fetchAccessToken: AuthTokenFetcher
  // Vue-only service extensions (documented in PARITY.md). Auth *flows*
  // (sign-in, sign-out, OTP, passkeys, ...) are not wrapped here — call them
  // on `client`, which is fully typed by the plugins your auth client installs.
  client: AuthClient
  session: AuthSession
  /** The current user, or `null` when signed out / still loading. */
  user: ComputedRef<AuthUser | null>
  authVersion: ComputedRef<string | null>
}

/**
 * Unified Better Auth service for the Vue/Nuxt runtime.
 *
 * Returns the full Better Auth client, the reactive session wrapper, and the
 * Convex-compatible auth state used by the packaged auth plugin.
 *
 * @param initialToken - Optional preloaded token, used once per app lifetime
 *   to avoid a round-trip on initial load (e.g. from SSR).
 */
export function useAuth(initialToken?: string | null): UseAuthService {
  if (!initialTokenUsed && initialToken) {
    cachedToken.value = initialToken
    cachedTokenVersion = PENDING_AUTH_VERSION
    initialTokenUsed = true
  }

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
      cachedTokenVersion = null
      pendingToken = null
      pendingTokenVersion = null
      return null
    }

    // The trailing version checks replace upstream's `[sessionId]` callback
    // deps: a cache entry from another session never satisfies this caller.
    if (cachedToken.value && !forceRefreshToken && cachedTokenVersion === version) {
      return cachedToken.value
    }
    if (!forceRefreshToken && pendingToken && pendingTokenVersion === version) {
      return pendingToken
    }
    pendingTokenVersion = version
    pendingToken = client.convex
      .token({ fetchOptions: { throw: false } })
      .then(({ data }) => {
        const token = data?.token || null
        cachedToken.value = token
        cachedTokenVersion = version
        return token
      })
      .catch(() => {
        cachedToken.value = null
        cachedTokenVersion = version
        return null
      })
      .finally(() => {
        pendingToken = null
        pendingTokenVersion = null
      })
    return pendingToken
  }

  return {
    isLoading: computed(() => session.value.isPending && !cachedToken.value),
    // Diverges from upstream's `Boolean(session?.session) || cachedToken !== null`:
    // a settled signed-out session must read unauthenticated immediately (Vue has
    // no re-render to run upstream's cache-clearing effect first), and Better Auth
    // session data without a nested `session` still counts as signed in.
    isAuthenticated: computed(
      () => !!session.value.data || (session.value.isPending && cachedToken.value !== null),
    ),
    fetchAccessToken,
    // Vue-only service extensions (documented in PARITY.md).
    client,
    session,
    user: computed<AuthUser | null>(() => {
      const data = session.value.data as { user?: AuthUser } | null | undefined
      return data?.user ?? null
    }),
    authVersion,
  }
}

/** Reset module-level token cache — intended for tests only. */
export function __resetUseAuthForTests() {
  cachedToken.value = null
  cachedTokenVersion = null
  pendingToken = null
  pendingTokenVersion = null
  initialTokenUsed = false
}
