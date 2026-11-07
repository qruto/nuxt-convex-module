// PARITY: A-04
import { describe, expect, it } from 'vitest'
import { anyApi, type FunctionReference } from 'convex/server'
import { defineComponent, h, nextTick, provide, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createError, useNuxtApp } from '#app'
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

/**
 * Runs `setupFn` the way the browser does after a server read failed: Nuxt
 * hydrates the failure from `payload._errors` and, while hydrating, keeps it
 * instead of fetching again. This environment is a client build that is not
 * hydrating, so both are set for the setup and put back after it.
 */
function afterFailedServerRead(key: string, setupFn: () => AsyncQueryReturn<unknown>) {
  return () => {
    const nuxtApp = useNuxtApp()
    const { isHydrating } = nuxtApp
    const { serverRendered } = nuxtApp.payload
    nuxtApp.payload._errors[key] = createError('server read failed')
    nuxtApp.isHydrating = true
    nuxtApp.payload.serverRendered = true
    try {
      return setupFn()
    }
    finally {
      nuxtApp.isHydrating = isHydrating
      nuxtApp.payload.serverRendered = serverRendered
    }
  }
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

  it('flips status to error when the live subscription errors after success', async () => {
    const client = testClient()
    seed(client, { arg: 'e' }, { x: 1 })

    const { mounted, result } = await mountAsyncQuery(client, () =>
      useAsyncQuery(queryRef, { arg: 'e' }, { key: 'async-query:live-error' }),
    )
    await result
    await nextTick()

    expect(result.status.value).toBe('success')
    expect(result.data.value).toStrictEqual({ x: 1 })

    // The live subscription errors after the initial fetch succeeded.
    seed(client, { arg: 'e' }, new Error('live boom'))
    await nextTick()

    expect(result.status.value).toBe('error')
    expect(result.error.value).toBeInstanceOf(Error)
    expect(String(result.error.value)).toContain('live boom')
    // asyncData still holds the fetched payload, which `data` falls back to.
    expect(result.data.value).toStrictEqual({ x: 1 })

    mounted.unmount()
    await client.close()
  })

  it('stops reporting a failed server read once the live subscription has a value', async () => {
    const client = testClient()
    const key = 'async-query:ssr-failed'

    const { mounted, result } = await mountAsyncQuery(client, afterFailedServerRead(key, () =>
      useAsyncQuery(queryRef, { arg: 's' }, { key }),
    ))
    await nextTick()

    // Before the subscription answers, the server's failure is all there is.
    expect(result.data.value).toBeUndefined()
    expect(result.status.value).toBe('error')
    expect(String(result.error.value)).toContain('server read failed')

    seed(client, { arg: 's' }, { x: 1 })
    await nextTick()

    expect(result.data.value).toStrictEqual({ x: 1 })
    expect(result.status.value).toBe('success')
    expect(result.error.value).toBeNull()

    mounted.unmount()
    await client.close()
  })

  it('counts a live null as recovery from a failed server read', async () => {
    const client = testClient()
    const key = 'async-query:ssr-failed-null'

    const { mounted, result } = await mountAsyncQuery(client, afterFailedServerRead(key, () =>
      useAsyncQuery(queryRef, { arg: 'sn' }, { key }),
    ))
    await nextTick()

    seed(client, { arg: 'sn' }, null)
    await nextTick()

    expect(result.data.value).toBeNull()
    expect(result.status.value).toBe('success')
    expect(result.error.value).toBeNull()

    mounted.unmount()
    await client.close()
  })

  it('reports a live error that follows the recovery from a failed server read', async () => {
    const client = testClient()
    const key = 'async-query:ssr-failed-live-error'

    const { mounted, result } = await mountAsyncQuery(client, afterFailedServerRead(key, () =>
      useAsyncQuery(queryRef, { arg: 'se' }, { key }),
    ))
    await nextTick()

    seed(client, { arg: 'se' }, { x: 1 })
    await nextTick()
    seed(client, { arg: 'se' }, new Error('live boom'))
    await nextTick()

    expect(result.status.value).toBe('error')
    expect(String(result.error.value)).toContain('live boom')

    mounted.unmount()
    await client.close()
  })

  it('live: false keeps reporting a failed server read, with nothing to recover it', async () => {
    const client = testClient()
    const key = 'async-query:ssr-failed-not-live'

    const { mounted, result } = await mountAsyncQuery(client, afterFailedServerRead(key, () =>
      useAsyncQuery(queryRef, { arg: 'sl' }, { key, live: false }),
    ))
    await nextTick()

    seed(client, { arg: 'sl' }, { x: 1 })
    await nextTick()

    expect(result.data.value).toBeUndefined()
    expect(result.status.value).toBe('error')
    expect(String(result.error.value)).toContain('server read failed')

    mounted.unmount()
    await client.close()
  })

  it('refresh yields a null payload once args flip to skip', async () => {
    const client = testClient()
    seed(client, { arg: 'r' }, { x: 1 })
    const args = ref<{ arg: string } | 'skip'>({ arg: 'r' })

    const { mounted, result } = await mountAsyncQuery(client, () =>
      useAsyncQuery(queryRef, args, { key: 'async-query:refresh-skip' }),
    )
    await result
    await nextTick()

    expect(result.data.value).toStrictEqual({ x: 1 })
    expect(result.status.value).toBe('success')

    args.value = 'skip'
    await nextTick()
    await result.refresh()
    await nextTick()

    // The handler saw 'skip' and returned a null payload; with the live
    // subscription also gone, no data remains.
    expect(result.data.value).toBeUndefined()
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
