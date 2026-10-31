import { ref, type InjectionKey, type Ref } from 'vue'

// Kept apart from `use-better-auth.ts` so the server plugin can provide a store
// without importing `#convex/auth-client`: an app's client with browser-only
// top-level code then still loads only where `useBetterAuth()` is used.

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

/** The version a token holds while the session is still loading. @internal */
export const PENDING_AUTH_VERSION = '__pending__'

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
