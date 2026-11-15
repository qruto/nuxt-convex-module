// PARITY: D-01
// `import.meta.server` is truthy in this project. Upstream sends its
// heartbeats from an effect, which React never runs on the server.
import { describe, expect, it, vi } from 'vitest'
import { computed, createApp, effectScope } from 'vue'
import { usePresence, type PresenceAPI } from '../../src/runtime/presence/vue/index'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

const heartbeat = vi.fn()
const queryArgs: Array<() => unknown> = []
vi.mock('../../src/runtime/vue/composables/use-mutation', () => ({
  useMutation: () => heartbeat,
}))
vi.mock('../../src/runtime/vue/composables/use-query', () => ({
  useQuery: (_query: unknown, args: () => unknown) => {
    queryArgs.push(args)
    return computed(() => undefined)
  },
}))

describe('usePresence during a server render', () => {
  it('sends no heartbeat and lists nobody', () => {
    const app = createApp({ render: () => null })
    app.provide(ConvexClientKey, { url: 'https://test.convex.cloud' } as unknown as ConvexVueClient)
    const scope = effectScope()
    const presence = { list: 'list', heartbeat: 'heartbeat', disconnect: 'disconnect' } as unknown as PresenceAPI
    const state = app.runWithContext(() => scope.run(() => usePresence(presence, 'room1', 'user1')))!

    expect(state.value).toBeUndefined()
    expect(heartbeat).not.toHaveBeenCalled()
    expect(queryArgs[0]!()).toBe('skip')
    scope.stop()
  })
})
