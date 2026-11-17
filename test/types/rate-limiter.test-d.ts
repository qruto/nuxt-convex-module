import type { RateLimiter } from '@convex-dev/rate-limiter'
import type { ApiFromModules } from 'convex/server'
import { describe, it } from 'vitest'
import { useRateLimit } from '../../src/runtime/rate-limiter/vue/index'

// The references `rateLimiter.hookAPI()` gives an app, as codegen types them:
// their config is the validator's type, in which `shards` and
// `applyUpdates` are each optional on their own.
type HookApi = ReturnType<RateLimiter['hookAPI']>
type Api = ApiFromModules<{ example: { getRateLimit: HookApi['getRateLimit'], getServerTime: HookApi['getServerTime'] } }>
declare const api: Api

describe('useRateLimit', () => {
  it('takes the generated getRateLimit and getServerTime references', () => {
    useRateLimit(api.example.getRateLimit, { getServerTimeMutation: api.example.getServerTime })
  })
})
