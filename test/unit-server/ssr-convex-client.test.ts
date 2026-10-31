// PARITY: D-14
// Runs in the `unit-server` project, where `import.meta.server` is compiled
// truthy like Nuxt's server bundle. Each request renders with a client of its
// own: reading its connection state must not open a WebSocket from the
// server, and the client is closed once the request is done.
import { describe, expect, it, vi } from 'vitest'
import { ConvexVueClient } from '../../src/runtime/vue/client'
import { closeAfterRender } from '../../src/runtime/nuxt/config'

vi.mock('#imports', () => ({ useRuntimeConfig: () => ({}) }))

describe('the Convex client during SSR', () => {
  it('reports a connection not yet made, without starting one', () => {
    const client = new ConvexVueClient('https://example.convex.cloud')

    expect(client.connectionState()).toMatchObject({ isWebSocketConnected: false, hasEverConnected: false, connectionCount: 0 })
    expect((client as unknown as { cachedSync?: unknown }).cachedSync).toBeUndefined()
  })

  it('closes a render\'s client once the request is rendered or fails', () => {
    const hooks = new Map<string, () => void>()
    const close = vi.fn(async () => {})
    closeAfterRender({ hook: (name: string, fn: () => void) => hooks.set(name, fn) } as never, { close })

    expect([...hooks.keys()].sort()).toEqual(['app:error', 'app:rendered'])
    hooks.get('app:rendered')!()
    expect(close).toHaveBeenCalledTimes(1)
  })
})
