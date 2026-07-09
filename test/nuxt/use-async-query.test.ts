import { describe, expect, it } from 'vitest'
import { anyApi, type FunctionReference } from 'convex/server'
import { defineComponent, h, nextTick, provide } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ConvexVueClient, ConvexClientKey } from '../../src/runtime/vue/client'
import { defaultAsyncQueryKey, useAsyncQuery, type AsyncQueryReturn } from '../../src/runtime/nuxt/composables/use-async-query'
import { nodeWebSocket } from '../helpers/in_memory_web_socket'
import { silentConnectLogger } from '../helpers/silent-logger'

// Client-side coverage for `useAsyncQuery` (the nuxt test environment is a
// client build). The SSR fetch path (HTTP + token) is covered by the e2e
// fixture app, which renders a `useAsyncQuery` page during real SSR.

const address = 'https://127.0.0.1:3001'
const queryRef = anyApi.myQuery!.default! as FunctionReference<'query'>
const mutationRef = anyApi.myMutation!.default! as FunctionReference<'mutation'>

function testClient() {
  // `address` is intentionally unreachable; values are seeded into the local
  // query store via optimistic updates, mirroring preload-hydration.test.ts.
  return new ConvexVueClient(address, {
    webSocketConstructor: nodeWebSocket,
    unsavedChangesWarning: false,
    logger: silentConnectLogger,
  })
}

function seed(client: ConvexVueClient, args: Record<string, unknown>, value: unknown) {
  void client.mutation(mutationRef, {}, {
    optimisticUpdate: (localStore) => {
      localStore.setQuery(queryRef, args, value)
    },
  })
}

async function mountAsyncQuery(
  client: ConvexVueClient | undefined,
  setupFn: () => AsyncQueryReturn<unknown>,
) {
  let result!: AsyncQueryReturn<unknown>
  const Child = defineComponent({
    setup() {
      result = setupFn()
      return () => h('div')
    },
  })
  const Wrapper = defineComponent({
    setup() {
      if (client) {
        provide(ConvexClientKey, client)
      }
      return () => h(Child)
    },
  })
  const mounted = await mountSuspended(Wrapper)
  return { mounted, result }
}

describe('useAsyncQuery', () => {
  it('fetches once and upgrades to the live subscription', async () => {
    const client = testClient()
    seed(client, { arg: 'a' }, { x: 1 })

    const { mounted, result } = await mountAsyncQuery(client, () =>
      useAsyncQuery(queryRef, { arg: 'a' }, { key: 'async-query:live' }),
    )
    await result
    await nextTick()

    expect(result.data.value).toStrictEqual({ x: 1 })
    expect(result.status.value).toBe('success')
    expect(result.error.value).toBeNull()

    // A live update replaces the fetched value without a refresh.
    seed(client, { arg: 'a' }, { x: 2 })
    await nextTick()
    expect(result.data.value).toStrictEqual({ x: 2 })

    mounted.unmount()
    await client.close()
  })

  it('live: false keeps the fetched value and ignores live updates', async () => {
    const client = testClient()
    seed(client, { arg: 'b' }, { x: 1 })

    const { mounted, result } = await mountAsyncQuery(client, () =>
      useAsyncQuery(queryRef, { arg: 'b' }, { key: 'async-query:not-live', live: false }),
    )
    await result
    await nextTick()

    expect(result.data.value).toStrictEqual({ x: 1 })
    expect(result.status.value).toBe('success')

    seed(client, { arg: 'b' }, { x: 2 })
    await nextTick()
    expect(result.data.value).toStrictEqual({ x: 1 })

    mounted.unmount()
    await client.close()
  })

  it('preserves a legitimate null query result', async () => {
    const client = testClient()
    seed(client, { arg: 'n' }, null)

    const { mounted, result } = await mountAsyncQuery(client, () =>
      useAsyncQuery(queryRef, { arg: 'n' }, { key: 'async-query:null', live: false }),
    )
    await result
    await nextTick()

    expect(result.data.value).toBeNull()
    expect(result.status.value).toBe('success')

    mounted.unmount()
    await client.close()
  })

  it('skip: stays idle without fetching or subscribing', async () => {
    const client = testClient()

    const { mounted, result } = await mountAsyncQuery(client, () =>
      useAsyncQuery(queryRef, 'skip', { key: 'async-query:skip' }),
    )
    await result
    await nextTick()

    expect(result.data.value).toBeUndefined()
    expect(result.status.value).toBe('idle')
    expect(result.error.value).toBeNull()

    mounted.unmount()
    await client.close()
  })

  it('surfaces a missing client as an error ref instead of throwing', async () => {
    const { mounted, result } = await mountAsyncQuery(undefined, () =>
      useAsyncQuery(queryRef, { arg: 'c' }, { key: 'async-query:no-client' }),
    )
    await result
    await nextTick()

    expect(result.data.value).toBeUndefined()
    expect(result.status.value).toBe('error')
    expect(String(result.error.value)).toContain('no Convex client is available')

    mounted.unmount()
  })
})

describe('defaultAsyncQueryKey', () => {
  it('derives a stable key from query name and args', () => {
    expect(defaultAsyncQueryKey('tasks:list', { completed: false }))
      .toBe('convex:tasks:list:{"completed":false}')
    expect(defaultAsyncQueryKey('tasks:list', undefined))
      .toBe('convex:tasks:list:{}')
    expect(defaultAsyncQueryKey('tasks:list', 'skip'))
      .toBe('convex:tasks:list:"skip"')
  })
})
