// PARITY: A-16
import { describe, expect, it, vi } from 'vitest'
import { anyApi, type FunctionArgs, type FunctionReference } from 'convex/server'
import { defineComponent, h, nextTick, provide, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { useNuxtApp } from '#app'
import { ConvexVueClient, ConvexClientKey } from '../../src/runtime/vue/client'
import {
  defaultAsyncPaginatedQueryKey,
  useAsyncPaginatedQuery,
  type AsyncPaginatedQueryReturn,
} from '../../src/runtime/nuxt/composables/use-async-paginated-query'
import type { PaginatedQueryReference } from '../../src/runtime/vue/composables/use-paginated-query'
import { nodeWebSocket } from '../helpers/in_memory_web_socket'
import { silentConnectLogger } from '../helpers/silent-logger'

// Client-side coverage (the nuxt test environment is a client build): the
// server page arrives through the Nuxt payload, the live page through
// `usePaginatedQuery`. The SSR fetch itself is `fetchQuery`, covered by the
// server helper tests and the e2e fixture app.

const address = 'https://127.0.0.1:3001'
const queryRef = anyApi.messages!.list! as PaginatedQueryReference
const mutationRef = anyApi.myMutation!.default! as FunctionReference<'mutation'>

type Row = { _id: string, body: string }

function testClient() {
  return new ConvexVueClient(address, {
    webSocketConstructor: nodeWebSocket,
    unsavedChangesWarning: false,
    logger: silentConnectLogger,
  })
}

/** The args `usePaginatedQuery` subscribed with — they carry the pagination id. */
function subscribedArgs(watchQuery: { mock: { calls: unknown[][] } }): FunctionArgs<PaginatedQueryReference> {
  const call = watchQuery.mock.calls.find(call => (call[1] as { paginationOpts?: unknown } | undefined)?.paginationOpts)
  if (!call) throw new Error('usePaginatedQuery never subscribed')
  return call[1] as FunctionArgs<PaginatedQueryReference>
}

function seedPage(client: ConvexVueClient, args: FunctionArgs<PaginatedQueryReference>, page: Row[], isDone: boolean) {
  void client.mutation(mutationRef, {}, {
    optimisticUpdate: (localStore) => {
      localStore.setQuery(queryRef, args, { page, isDone, continueCursor: isDone ? '' : 'next' })
    },
  })
}

async function mount(
  client: ConvexVueClient | undefined,
  setupFn: () => AsyncPaginatedQueryReturn<Row>,
  payload?: { key: string, page: Row[], isDone: boolean },
) {
  let result!: AsyncPaginatedQueryReturn<Row>
  const Child = defineComponent({
    setup() {
      result = setupFn()
      return () => h('div')
    },
  })
  const Wrapper = defineComponent({
    setup() {
      if (client) provide(ConvexClientKey, client)
      if (payload) {
        // What SSR would have left behind. Nuxt's default `getCachedData`
        // reads `payload.data` only while hydrating and `static.data`
        // otherwise; this environment is not hydrating.
        useNuxtApp().static.data[payload.key] = { page: payload.page, isDone: payload.isDone }
      }
      return () => h(Child)
    },
  })
  const mounted = await mountSuspended(Wrapper)
  return { mounted, result }
}

describe('useAsyncPaginatedQuery', () => {
  it('renders the server page until the live subscription has its own, then follows it', async () => {
    const client = testClient()
    const watchQuery = vi.spyOn(client, 'watchQuery')
    const key = 'async-paginated:live'

    const { mounted, result } = await mount(
      client,
      () => useAsyncPaginatedQuery(queryRef, {}, { initialNumItems: 2, key }),
      { key, page: [{ _id: '1', body: 'from the server' }], isDone: false },
    )
    await result
    await nextTick()

    // Hydrated: the payload page, with a status derived from `isDone`.
    expect(result.results.value).toStrictEqual([{ _id: '1', body: 'from the server' }])
    expect(result.status.value).toBe('CanLoadMore')
    expect(result.isLoading.value).toBe(false)
    expect(result.error.value).toBeNull()

    // The live first page replaces it.
    seedPage(client, subscribedArgs(watchQuery), [{ _id: '1', body: 'live' }, { _id: '2', body: 'also live' }], true)
    await nextTick()
    expect(result.results.value.map(r => r.body)).toStrictEqual(['live', 'also live'])
    expect(result.status.value).toBe('Exhausted')

    mounted.unmount()
    await client.close()
  })

  it('reports an exhausted server page and no rows while nothing has loaded', async () => {
    const client = testClient()
    const key = 'async-paginated:exhausted'

    const { mounted, result } = await mount(
      client,
      () => useAsyncPaginatedQuery(queryRef, {}, { initialNumItems: 5, key }),
      { key, page: [], isDone: true },
    )
    await result
    expect(result.results.value).toStrictEqual([])
    expect(result.status.value).toBe('Exhausted')
    mounted.unmount()

    const bare = await mount(client, () => useAsyncPaginatedQuery(queryRef, {}, { initialNumItems: 5, key: 'async-paginated:bare' }))
    await bare.result
    expect(bare.result.results.value).toStrictEqual([])
    expect(bare.result.status.value).toBe('LoadingFirstPage')
    expect(bare.result.isLoading.value).toBe(true)
    bare.mounted.unmount()

    await client.close()
  })

  it('captures the live query error instead of throwing', async () => {
    const client = testClient()
    const watchQuery = vi.spyOn(client, 'watchQuery')

    const { mounted, result } = await mount(
      client,
      () => useAsyncPaginatedQuery(queryRef, {}, { initialNumItems: 2, key: 'async-paginated:error' }),
    )
    await result

    const args = subscribedArgs(watchQuery)
    void client.mutation(mutationRef, {}, {
      optimisticUpdate: (localStore) => {
        localStore.setQuery(queryRef, args, new Error('boom') as never)
      },
    })
    await nextTick()

    expect(() => result.results.value).not.toThrow()
    expect(result.error.value?.message).toBe('boom')
    expect(result.results.value).toStrictEqual([])

    mounted.unmount()
    await client.close()
  })

  it('retires the server page when the args move on', async () => {
    const client = testClient()
    const watchQuery = vi.spyOn(client, 'watchQuery')
    const key = 'async-paginated:args'
    const channel = ref('a')

    const { mounted, result } = await mount(
      client,
      () => useAsyncPaginatedQuery(queryRef, () => ({ channel: channel.value }), { initialNumItems: 2, key }),
      { key, page: [{ _id: '1', body: 'server page for a' }], isDone: true },
    )
    await result
    await nextTick()
    expect(result.results.value.map(r => r.body)).toStrictEqual(['server page for a'])
    expect(result.status.value).toBe('Exhausted')

    // New args: the live query restarts from its first page, and the server
    // page — which belongs to `a` — must not stand in for `b`.
    channel.value = 'b'
    await nextTick()
    expect(result.results.value).toStrictEqual([])
    expect(result.status.value).toBe('LoadingFirstPage')
    expect(result.isLoading.value).toBe(true)

    const args = subscribedArgs({ mock: { calls: watchQuery.mock.calls.filter(([, a]) => (a as { channel?: string }).channel === 'b') } })
    seedPage(client, args, [{ _id: '2', body: 'live page for b' }], true)
    await nextTick()
    expect(result.results.value.map(r => r.body)).toStrictEqual(['live page for b'])

    mounted.unmount()
    await client.close()
  })

  it('reports a missing client through `error` and keeps the hydrated page', async () => {
    const key = 'async-paginated:no-client'
    const { mounted, result } = await mount(
      undefined,
      () => useAsyncPaginatedQuery(queryRef, {}, { initialNumItems: 2, key }),
      { key, page: [{ _id: '1', body: 'from the server' }], isDone: false },
    )
    await result

    expect(result.results.value.map(r => r.body)).toStrictEqual(['from the server'])
    expect(result.status.value).toBe('CanLoadMore')
    expect(result.error.value?.message).toMatch(/no Convex client is available/)
    expect(() => result.loadMore(5)).not.toThrow()

    mounted.unmount()
  })

  it('keys the payload on the query, the initial args and the page size', () => {
    expect(defaultAsyncPaginatedQueryKey('messages:list', { channel: 'a' }, 20))
      .toBe('convex:paginated:messages:list:{"channel":"a"}:20')
    expect(defaultAsyncPaginatedQueryKey('messages:list', 'skip', 20))
      .toBe('convex:paginated:messages:list:"skip":20')
  })
})
