// PARITY: D-01
// `import.meta.server` is truthy in this project. Upstream syncs the clocks and
// arms the retry timer in effects, which React never runs on the server.
import { describe, expect, it, vi } from 'vitest'
import { computed, createApp, effectScope } from 'vue'
import { useRateLimit, type GetRateLimitValueQuery, type GetServerTimeMutation } from '../../src/runtime/rate-limiter/vue/index'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

vi.mock('../../src/runtime/vue/composables/use-query', () => ({
  useQuery: () => computed(() => ({
    value: 0,
    ts: Date.now(),
    shard: 0,
    config: { kind: 'token bucket', rate: 10, period: 60000 },
  })),
}))

describe('useRateLimit during a server render', () => {
  it('reports the status without syncing the clocks or arming the retry timer', () => {
    const mutation = vi.fn()
    const setTimeout = vi.spyOn(globalThis, 'setTimeout')
    const app = createApp({ render: () => null })
    const scope = effectScope()
    app.provide(ConvexClientKey, { mutation } as unknown as ConvexVueClient)
    const result = app.runWithContext(() => scope.run(() =>
      useRateLimit({} as GetRateLimitValueQuery, { getServerTimeMutation: {} as GetServerTimeMutation }),
    ))!

    expect(result.status.value?.ok).toBe(false)
    expect(mutation).not.toHaveBeenCalled()
    expect(setTimeout).not.toHaveBeenCalled()
    scope.stop()
  })
})
