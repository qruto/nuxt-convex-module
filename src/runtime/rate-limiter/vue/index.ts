/**
 * A Vue port of `@convex-dev/rate-limiter/react`: {@link useRateLimit}.
 *
 * @module rate-limiter/client
 */
import { calculateRateLimit, type RateLimitConfig } from '@convex-dev/rate-limiter'
import type { FunctionReference } from 'convex/server'
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useConvex } from '../../vue/client'
import { useQuery } from '../../vue/composables/use-query'

// PARITY: A-20
// What a component handling a rate-limited mutation needs from the package's
// root, so one import (or none, as auto-imports) serves both.
export { isRateLimitError } from '@convex-dev/rate-limiter'
export type { RateLimitConfig, RateLimitError } from '@convex-dev/rate-limiter'

// `GetValueArgs` and `GetValueReturns` live in the package's `shared.ts`,
// which it does not export. Both are rebuilt here from the config type that
// the exported `calculateRateLimit` takes: the validator's, as the generated
// `getRateLimit` reference has it. The root's `RateLimitConfig`, which the
// options take as upstream's do, is stricter (`shards` and `applyUpdates`
// exclude each other), so a reference from codegen would not type-check
// against it.
type ValidatedRateLimitConfig = Parameters<typeof calculateRateLimit>[1]

/** The arguments of the `getRateLimit` query that `rateLimiter.hookAPI()` creates. */
type GetValueArgs = {
  name?: string
  key?: string
  sampleShards?: number
  config?: ValidatedRateLimitConfig
}

/** What the `getRateLimit` query that `rateLimiter.hookAPI()` creates returns. */
type GetValueReturns = {
  value: number
  ts: number
  shard: number
  config: ValidatedRateLimitConfig
}

/**
 * Options of {@link useRateLimit}.
 *
 * @public
 */
export type UseRateLimitOptions = {
  name?: string
  key?: string
  count?: number
  sampleShards?: number
  getServerTimeMutation?: GetServerTimeMutation
  config?: RateLimitConfig
}

/**
 * The `getRateLimit` query that `rateLimiter.hookAPI()` creates.
 *
 * @public
 */
export type GetRateLimitValueQuery = FunctionReference<
  'query',
  'public',
  GetValueArgs,
  GetValueReturns
>

/**
 * The `getServerTime` mutation that `rateLimiter.hookAPI()` creates.
 *
 * @public
 */
export type GetServerTimeMutation = FunctionReference<
  'mutation',
  'public',
  Record<string, never>,
  number
>

/** What {@link useRateLimit}'s `check` returns, in client time. */
type RateLimitCheck = {
  value: number
  ts: number
  config: ValidatedRateLimitConfig
  shard: number
  ok: boolean
  retryAt: number | undefined
}

/**
 * A composable for using rate limits in Vue components.
 * This composable provides information about the current rate limit status,
 * including the ability to check if an action is allowed and when it can be retried.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '~~/convex/_generated/api'
 *
 * const { status, check } = useRateLimit(api.example.getRateLimit, {
 *   getServerTimeMutation: api.example.getServerTime,
 *   count: 1,
 * })
 * </script>
 *
 * <template>
 *   <button :disabled="status?.ok === false">Send</button>
 * </template>
 * ```
 *
 * @param getRateLimitValueQuery The query function returned by rateLimiter.hookAPI().getRateLimit
 * @param opts The options, as a value, a ref or a getter. `getServerTimeMutation`
 *   is a mutation that returns the current server time (Date.now()), and
 *   `sampleShards` the number of shards to sample (default: 1).
 * @returns An object containing:
 *   - status: A ref of the current status of the rate limit (ok, retryAt)
 *     If the rate limit value is below the count (or 0 if unspecified), the
 *     retryAt will be set to the time when the client can retry.
 *   - check: A function that returns the current value of the rate limit
 * @public
 */
export function useRateLimit(
  getRateLimitValueQuery: GetRateLimitValueQuery,
  opts?: MaybeRefOrGetter<UseRateLimitOptions | undefined>,
): {
  status: ComputedRef<{ ok: true, retryAt: undefined } | { ok: false, retryAt: number } | undefined>
  check: (ts?: number, count?: number) => RateLimitCheck | undefined
} {
  // This is the offset between the client and server time.
  // clientTime + timeOffset = serverTime
  const timeOffset = ref(0)
  const refresh = useForceUpdate()

  const convex = useConvex()

  // Based on server time
  const rateLimitData = useQuery(getRateLimitValueQuery, () => {
    const args = toValue(opts) ?? {}
    return {
      name: args.name,
      key: args.key,
      sampleShards: args.sampleShards,
      config: args.config,
    }
  })

  // PARITY: D-01
  // Upstream syncs the clocks in an effect, which React never runs on the
  // server.
  if (!import.meta.server) {
    watch(() => !!toValue(opts)?.getServerTimeMutation, () => {
      const getServerTimeMutation = toValue(opts)?.getServerTimeMutation
      if (!getServerTimeMutation) return
      const clientTime = Date.now()
      void convex!
        .mutation(getServerTimeMutation, {})
        .then((serverTime: number) => {
          const latency = Date.now() - clientTime
          timeOffset.value = serverTime - clientTime - latency / 2
        })
    }, { immediate: true })
  }

  // Takes in and exposes client time
  const check = (ts?: number, count?: number): RateLimitCheck | undefined => {
    const data = rateLimitData.value
    if (!data) return undefined

    const clientTime = ts ?? Date.now()
    const serverTime = clientTime + timeOffset.value
    const value = calculateRateLimit(
      data,
      data.config,
      serverTime,
      count,
    )
    return {
      value: value.value,
      ts: value.ts - timeOffset.value,
      config: data.config,
      shard: data.shard,
      ok: value.value >= 0,
      retryAt: value.retryAfter
        ? serverTime + value.retryAfter - timeOffset.value
        : undefined,
    }
  }

  const status = computed(() => {
    // Read so the retry timer below recomputes the status.
    void refresh.count.value
    const currentValue = check(Date.now(), toValue(opts)?.count ?? 1)
    if (!currentValue) return undefined
    if (currentValue.value < 0) {
      return { ok: false as const, retryAt: currentValue.retryAt! }
    }
    return { ok: true as const, retryAt: undefined }
  })

  if (!import.meta.server) {
    // PARITY: F-08
    // Fixes an upstream bug: a timer can fire just before `retryAt`, and a
    // fixed window recomputes the very same `retryAt`, so upstream's effect
    // never runs again and the status stays not-ok. Each refresh re-runs
    // this.
    watch([() => status.value?.ok, () => status.value?.retryAt, refresh.count], ([ok, retryAt], _previous, onCleanup) => {
      if (ok !== false) return
      const interval = setTimeout(refresh, retryAt! - Date.now())
      onCleanup(() => clearTimeout(interval))
    }, { immediate: true })
  }

  return { status, check }
}

function useForceUpdate() {
  const count = ref(0)
  return Object.assign(() => {
    count.value += 1
  }, { count })
}
