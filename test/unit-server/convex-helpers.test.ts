// PARITY: D-01
// `import.meta.server` is truthy in this project. Upstream holds its cached
// subscriptions and creates the session ID in effects, which React never runs
// on the server.
import { makeFunctionReference } from 'convex/server'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, provide } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { provideConvexQueryCache, useQuery } from '../../src/runtime/convex-helpers/vue/cache/index'
import { provideSession, useSessionId } from '../../src/runtime/convex-helpers/vue/sessions'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

describe('convex-helpers during a server render', () => {
  it('opens no cached subscription and creates no session ID', async () => {
    const onUpdate = vi.fn(() => () => {})
    const client = {
      watchQuery: vi.fn(() => ({ localQueryResult: () => undefined, onUpdate, journal: () => undefined })),
      logger: { warn: vi.fn() },
    } as unknown as ConvexVueClient
    const idGenerator = vi.fn(() => 'session-1')
    const query = makeFunctionReference<'query', { id: string }, string>('test:query')
    let sessionId: unknown = 'unset'

    const Child = defineComponent({
      setup() {
        const result = useQuery(query, { id: 'one' })
        sessionId = useSessionId()[0].value
        return () => h('p', String(result.value))
      },
    })
    const Providers = defineComponent({
      setup() {
        provideConvexQueryCache()
        provideSession({ ssrFriendly: true, idGenerator })
        return () => h(Child)
      },
    })
    const html = await renderToString(createSSRApp(defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        return () => h(Providers)
      },
    })))

    expect(html).toBe('<p>undefined</p>')
    expect(onUpdate).not.toHaveBeenCalled()
    expect(sessionId).toBeUndefined()
    expect(idGenerator).not.toHaveBeenCalled()
  })
})
