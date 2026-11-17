import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, provide, ref } from 'vue'
import { isRateLimitError as fromPackage } from '@convex-dev/rate-limiter'
import { isRateLimitError, useRateLimit, type GetRateLimitValueQuery, type GetServerTimeMutation } from '../../src/runtime/rate-limiter/vue/index'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

// The Vue counterpart of upstream's `src/react/index.test.ts`, scenario for
// scenario. Upstream mocks `convex/react`'s `useQuery`; here the module's own
// `useQuery` is mocked, and the client is a stand-in with `mutation`.

const queryResult = ref<unknown>(undefined)
const useQueryArgs: unknown[] = []
vi.mock('../../src/runtime/vue/composables/use-query', () => ({
  useQuery: (_query: unknown, args: () => unknown) => {
    useQueryArgs.push(args)
    return computed(() => queryResult.value)
  },
}))

type Data = { value: number, ts: number, shard: number, config: { kind: 'token bucket' | 'fixed window', rate: number, period: number } }

const mutation = vi.fn()
const convexClient = { mutation } as unknown as ConvexVueClient

function mountRateLimit(data: Data, ...args: Parameters<typeof useRateLimit> extends [unknown, ...infer Rest] ? Rest : never) {
  queryResult.value = data
  const result = {} as { current: ReturnType<typeof useRateLimit> }
  const Child = defineComponent({
    setup() {
      result.current = useRateLimit({} as GetRateLimitValueQuery, ...args)
      return () => null
    },
  })
  const wrapper = mount(defineComponent({
    setup() {
      provide(ConvexClientKey, convexClient)
      return () => h(Child)
    },
  }))
  return { result: result.current, wrapper }
}

describe('useRateLimit', () => {
  beforeEach(() => {
    mutation.mockResolvedValue(Date.now())
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    useQueryArgs.length = 0
  })

  it('returns correct status when rate limit is available', () => {
    const { result } = mountRateLimit({
      value: 8,
      ts: Date.now(),
      shard: 0,
      config: { kind: 'token bucket', rate: 10, period: 60000 },
    })

    expect(result.status.value?.ok).toBe(true)
    expect(result.status.value?.retryAt).toBeUndefined()
    expect(result.check()?.value).toBeCloseTo(8, 1)
  })

  it('returns correct status when rate limit is exceeded', () => {
    const { result } = mountRateLimit({
      value: 0,
      ts: Date.now(),
      shard: 0,
      config: { kind: 'token bucket', rate: 10, period: 60000 },
    })

    expect(result.status.value?.ok).toBe(false)
    expect(result.status.value?.retryAt).toBeDefined()
    expect(result.check()?.value).toBeCloseTo(0, 1)
  })

  it('handles clock skew correctly', () => {
    vi.useFakeTimers()
    const serverTime = Date.now() + 5000 // Server is 5 seconds ahead
    const { result } = mountRateLimit({
      value: 5,
      ts: serverTime,
      shard: 0,
      config: { kind: 'token bucket', rate: 10, period: 60000 },
    })

    vi.runAllTimers()

    expect(result.status.value?.ok).toBe(true)

    const checkResult = result.check(undefined, 6)
    expect(checkResult?.retryAt).toBeDefined()

    const expectedRetryTime = serverTime + (6 - 5) / (10 / 60000)
    expect(checkResult?.retryAt).toBeCloseTo(expectedRetryTime, -2)
  })

  it('handles fixed window rate limits correctly', () => {
    const windowStart = Date.now() - 30000 // Window started 30 seconds ago
    const { result } = mountRateLimit({
      value: 2,
      ts: windowStart,
      shard: 0,
      config: { kind: 'fixed window', rate: 10, period: 60000 },
    })

    expect(result.status.value?.ok).toBe(true)

    // For fixed window, when there are tokens available, retryAt should still be defined
    // because it indicates when the next window starts
    const checkResult = result.check(undefined, 12) // Request more than available
    expect(checkResult?.retryAt).toBeDefined()

    const expectedRetryTime = windowStart + 60000
    expect(checkResult?.retryAt).toBeCloseTo(expectedRetryTime, -2)
  })

  // The two effects of upstream's hook, which upstream's tests leave out.

  it('syncs the clocks through getServerTimeMutation, once', async () => {
    const now = Date.now()
    mutation.mockResolvedValue(now + 60_000)
    const getServerTimeMutation = {} as GetServerTimeMutation
    const { result } = mountRateLimit({
      value: 0,
      ts: now,
      shard: 0,
      config: { kind: 'token bucket', rate: 10, period: 60000 },
    }, { getServerTimeMutation })
    await flushPromises()

    expect(mutation).toHaveBeenCalledTimes(1)
    expect(mutation).toHaveBeenCalledWith(getServerTimeMutation, {})
    // The server is a minute ahead, so a minute of tokens has refilled.
    expect(result.check()?.value).toBeCloseTo(10, 0)
    // Twenty tokens take another minute of server time, which is now on the
    // client's clock.
    expect(result.check(now, 20)?.retryAt).toBeCloseTo(now + 60_000, -3)
  })

  it('waits on the count of tokens it was given', () => {
    const data: Data = { value: 5, ts: Date.now(), shard: 0, config: { kind: 'token bucket', rate: 10, period: 60000 } }
    expect(mountRateLimit(data, { count: 6 }).result.status.value?.ok).toBe(false)
    expect(mountRateLimit(data, { count: 5 }).result.status.value?.ok).toBe(true)
  })

  it('reports ok again once retryAt has passed', async () => {
    vi.useFakeTimers()
    const { result } = mountRateLimit({
      value: 0,
      ts: Date.now(),
      shard: 0,
      config: { kind: 'token bucket', rate: 10, period: 60000 },
    })
    expect(result.status.value?.ok).toBe(false)

    await vi.advanceTimersByTimeAsync(result.status.value!.retryAt! - Date.now() + 1)

    expect(result.status.value?.ok).toBe(true)
  })

  // PARITY: F-08
  // A fixed window's `retryAt` is the window's end whenever it is computed.
  // A timer that fires a moment early leaves the status not-ok with the same
  // `retryAt`, and upstream's effect, keyed on the two, never runs again.
  it('keeps waiting when the retry timer fires a moment early', async () => {
    vi.useFakeTimers()
    const setTimeout = vi.spyOn(globalThis, 'setTimeout')
    const windowStart = Date.now() - 30_000
    const { result } = mountRateLimit({
      value: 0,
      ts: windowStart,
      shard: 0,
      config: { kind: 'fixed window', rate: 10, period: 60_000 },
    })
    const retryAt = result.status.value!.retryAt!
    expect(retryAt).toBe(windowStart + 60_000)

    // The timer fires a millisecond early.
    const fire = setTimeout.mock.calls.at(-1)![0] as () => void
    vi.clearAllTimers()
    vi.setSystemTime(retryAt - 1)
    fire()
    await flushPromises()
    expect(result.status.value).toEqual({ ok: false, retryAt })

    await vi.advanceTimersByTimeAsync(2)
    expect(result.status.value?.ok).toBe(true)
  })

  it('re-exports the package\'s isRateLimitError', () => {
    expect(isRateLimitError).toBe(fromPackage)
  })

  it('sends the query its name, key, shards and config, and follows a changed option', () => {
    const opts = ref({ name: 'send', key: 'alice', sampleShards: 2, count: 3 })
    mountRateLimit({
      value: 8,
      ts: Date.now(),
      shard: 0,
      config: { kind: 'token bucket', rate: 10, period: 60000 },
    }, opts)
    const args = useQueryArgs[0] as () => unknown

    expect(args()).toEqual({ name: 'send', key: 'alice', sampleShards: 2, config: undefined })
    opts.value = { ...opts.value, key: 'bob' }
    expect(args()).toEqual({ name: 'send', key: 'bob', sampleShards: 2, config: undefined })
  })
})
