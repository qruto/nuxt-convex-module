import type { FunctionReference } from 'convex/server'
import { computed, ref, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useConvexAuth } from '../../vue/auth/index'
import { usePreloadedPayload, useReactiveQuery, type Preloaded } from '../../vue/hydration'

// The declared return adds `| undefined`: the live query yields `undefined`
// while loading/skipped (upstream's narrower declaration returns the same values).
const useConvexPreloadedQuery = <Query extends FunctionReference<'query'>>(
  preloadedQuery: MaybeRefOrGetter<Preloaded<Query>>,
  { requireAuth = true }: { requireAuth?: boolean } = {},
): ComputedRef<Query['_returnType'] | undefined> => {
  const { isLoading, isAuthenticated } = useConvexAuth()
  const preloadExpired = ref(false)
  watch(
    [isLoading, isAuthenticated],
    () => {
      if (requireAuth && !isLoading.value && !isAuthenticated.value) {
        preloadExpired.value = true
      }
    },
    { immediate: true },
  )
  const { query, args, preloadedResult } = usePreloadedPayload(preloadedQuery)
  // On the server there is no live query — render the preloaded value and
  // defer the subscription (and auth gating) to the client after hydration.
  if (import.meta.server) {
    return preloadedResult
  }
  const result = useReactiveQuery(
    query,
    computed(() => (requireAuth && !isAuthenticated.value ? ('skip' as const) : args.value)),
  )
  watch(
    result,
    () => {
      if (result.value !== undefined) {
        preloadExpired.value = true
      }
    },
    { immediate: true },
  )
  if (requireAuth) {
    return computed(() => (preloadExpired.value ? result.value : preloadedResult.value))
  }
  return computed(() => (result.value === undefined ? preloadedResult.value : result.value))
}

/**
 * Auth-aware version of {@link usePreloadedQuery} for payloads returned by
 * `convexAuth(event).preloadAuthQuery(...)`.
 *
 * A Vue/Nuxt port of `@convex-dev/better-auth`'s `usePreloadedAuthQuery`
 * (`src/nextjs/client.tsx`): show the preloaded server result until the preload
 * "expires" — i.e. auth settles as unauthenticated, or a live authenticated
 * result arrives — then follow the live query. The last committed value is held
 * while auth is (re)loading so a transient loading state does not flash the
 * (possibly stale) preloaded value. At runtime yields `undefined` for
 * unauthenticated users (as upstream does); the declared type also includes
 * `null` so code annotated against upstream's `| null` signature keeps
 * compiling.
 *
 * @public
 */
export const usePreloadedAuthQuery = <Query extends FunctionReference<'query'>>(
  preloadedQuery: MaybeRefOrGetter<Preloaded<Query>>,
): ComputedRef<Query['_returnType'] | null | undefined> => {
  const { isLoading } = useConvexAuth()
  const latestData = useConvexPreloadedQuery(preloadedQuery)
  const data = ref<Query['_returnType'] | undefined>(latestData.value)
  watch(
    [latestData, isLoading],
    () => {
      if (!isLoading.value) {
        data.value = latestData.value
      }
    },
    { immediate: true },
  )
  return computed(() => data.value)
}
