import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { anyApi, type FunctionReference } from 'convex/server'
import { convexToJson } from 'convex/values'
import { defineComponent, h, nextTick, provide, shallowRef, type ComputedRef } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ConvexVueClient, ConvexClientKey } from '../../src/runtime/vue/client'
import { ConvexAuthStateKey } from '../../src/runtime/vue/auth'
import { usePreloadedAuthQuery } from '../../src/runtime/better-auth/vue/hydration'
import { usePreloadedQuery } from '../../src/runtime/vue/hydration'
import { preloadQuery, preloadedQueryResult } from '../../src/runtime/nuxt/index'
import { nodeWebSocket } from '../helpers/in_memory_web_socket'
import { silentConnectLogger } from '../helpers/silent-logger'
import { mockAuthState } from '../helpers/vue_test_utils'

// Coverage for Nuxt preload + hydration round-trips.

const address = 'https://127.0.0.1:3001'
const queryRef = anyApi.myQuery!.default! as FunctionReference<'query'>
const mutationRef = anyApi.myMutation!.default! as FunctionReference<'mutation'>

function testClient() {
  // `address` is intentionally unreachable; `silentConnectLogger` drops the
  // convex client's connection logs (irrelevant to hydration coverage) while
  // keeping `warn`/`error` intact.
  return new ConvexVueClient(address, {
    webSocketConstructor: nodeWebSocket,
    unsavedChangesWarning: false,
    logger: silentConnectLogger,
  })
}

describe('preloadQuery + usePreloadedQuery round-trip', () => {
  beforeEach(() => {
    process.env.NUXT_PUBLIC_CONVEX_URL = address
    global.fetch = vi.fn(async () => new Response(
      JSON.stringify({ status: 'success', value: convexToJson({ x: 42 }) }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )) as typeof fetch
  })

  afterEach(() => {
    delete process.env.NUXT_PUBLIC_CONVEX_URL
  })

  it('returns the server result before the client has live data', async () => {
    const preloaded = await preloadQuery(queryRef, { arg: 'something' })

    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ cache: 'no-store' }),
    )
    expect(preloadedQueryResult(preloaded)).toStrictEqual({ x: 42 })

    const client = testClient()
    let hydrated!: ComputedRef<unknown>
    const Child = defineComponent({
      setup() {
        hydrated = usePreloadedQuery(preloaded)
        return () => h('div')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        return () => h(Child)
      },
    })

    const mounted = await mountSuspended(Wrapper)
    await nextTick()

    expect(hydrated.value).toStrictEqual({ x: 42 })

    mounted.unmount()
    await client.close()
  })

  it('returns the client result once an optimistic update primes the cache', async () => {
    const preloaded = await preloadQuery(queryRef, { arg: 'something' })
    const client = testClient()

    // Fire an optimistic update to seed the local query store. The mutation
    // RPC itself is irrelevant here — the
    // optimistic callback runs synchronously against the local cache.
    void client.mutation(
      mutationRef,
      {},
      {
        optimisticUpdate: (localStore) => {
          localStore.setQuery(queryRef, { arg: 'something' }, null)
        },
      },
    )

    let hydrated!: ComputedRef<unknown>
    const Child = defineComponent({
      setup() {
        hydrated = usePreloadedQuery(preloaded)
        return () => h('div')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        return () => h(Child)
      },
    })

    const mounted = await mountSuspended(Wrapper)
    await nextTick()

    expect(hydrated.value).toStrictEqual(null)

    mounted.unmount()
    await client.close()
  })

  it('re-subscribes and refreshes the fallback when a new Preloaded payload is passed', async () => {
    const preloadedA = await preloadQuery(queryRef, { arg: 'a' })
    global.fetch = vi.fn(async () => new Response(
      JSON.stringify({ status: 'success', value: convexToJson({ x: 99 }) }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )) as typeof fetch
    const preloadedB = await preloadQuery(queryRef, { arg: 'b' })

    const client = testClient()
    const payload = shallowRef(preloadedA)

    let hydrated!: ComputedRef<unknown>
    const Child = defineComponent({
      setup() {
        hydrated = usePreloadedQuery(payload)
        return () => h('div')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        return () => h(Child)
      },
    })

    const mounted = await mountSuspended(Wrapper)
    await nextTick()

    expect(hydrated.value).toStrictEqual({ x: 42 })

    // Swap in a freshly preloaded payload (e.g. after a route-param change):
    // the fallback follows the new payload while the new subscription loads.
    payload.value = preloadedB
    await nextTick()
    expect(hydrated.value).toStrictEqual({ x: 99 })

    // The live subscription now tracks the new args.
    void client.mutation(
      mutationRef,
      {},
      {
        optimisticUpdate: (localStore) => {
          localStore.setQuery(queryRef, { arg: 'b' }, null)
        },
      },
    )
    await nextTick()
    expect(hydrated.value).toStrictEqual(null)

    mounted.unmount()
    await client.close()
  })

  it('re-subscribes to a different query when the payload swaps query names', async () => {
    // Upstream re-derives `makeFunctionReference(_name)` on every render, so a
    // call site may alternate between Preloaded payloads of different queries.
    const otherQueryRef = anyApi.otherQuery!.default! as FunctionReference<'query'>
    const preloadedA = await preloadQuery(queryRef, { arg: 'a' })
    global.fetch = vi.fn(async () => new Response(
      JSON.stringify({ status: 'success', value: convexToJson({ y: 7 }) }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    )) as typeof fetch
    const preloadedB = await preloadQuery(otherQueryRef, { arg: 'b' })

    const client = testClient()
    const payload = shallowRef(preloadedA)

    let hydrated!: ComputedRef<unknown>
    const Child = defineComponent({
      setup() {
        hydrated = usePreloadedQuery(payload)
        return () => h('div')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        return () => h(Child)
      },
    })

    const mounted = await mountSuspended(Wrapper)
    await nextTick()
    expect(hydrated.value).toStrictEqual({ x: 42 })

    payload.value = preloadedB
    await nextTick()
    expect(hydrated.value).toStrictEqual({ y: 7 })

    // The live subscription follows the NEW query's results, not the old one's.
    void client.mutation(
      mutationRef,
      {},
      {
        optimisticUpdate: (localStore) => {
          localStore.setQuery(otherQueryRef, { arg: 'b' }, 'live-other')
          localStore.setQuery(queryRef, { arg: 'a' }, 'live-old')
        },
      },
    )
    await nextTick()
    expect(hydrated.value).toStrictEqual('live-other')

    mounted.unmount()
    await client.close()
  })

  it('keeps auth-preloaded data while auth loads, then clears for unauthenticated users', async () => {
    const preloaded = await preloadQuery(queryRef, { arg: 'something' })
    const client = testClient()
    const { source: authSource, state: authState } = mockAuthState({ isLoading: true, isAuthenticated: false })

    let hydrated!: ComputedRef<unknown>
    const Child = defineComponent({
      setup() {
        hydrated = usePreloadedAuthQuery(preloaded)
        return () => h('div')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        provide(ConvexAuthStateKey, authState)
        return () => h(Child)
      },
    })

    const mounted = await mountSuspended(Wrapper)
    await nextTick()

    expect(hydrated.value).toStrictEqual({ x: 42 })

    authSource.isLoading = false
    await nextTick()
    await nextTick()

    // Unauthenticated users get `undefined` (not `null`), matching upstream
    // `@convex-dev/better-auth`'s `usePreloadedAuthQuery`.
    expect(hydrated.value).toBeUndefined()

    mounted.unmount()
    await client.close()
  })

  it('switches auth-preloaded data to the live authenticated result', async () => {
    const preloaded = await preloadQuery(queryRef, { arg: 'something' })
    const client = testClient()
    const { state: authState } = mockAuthState({ isLoading: false, isAuthenticated: true })

    void client.mutation(
      mutationRef,
      {},
      {
        optimisticUpdate: (localStore) => {
          localStore.setQuery(queryRef, { arg: 'something' }, null)
        },
      },
    )

    let hydrated!: ComputedRef<unknown>
    const Child = defineComponent({
      setup() {
        hydrated = usePreloadedAuthQuery(preloaded)
        return () => h('div')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        provide(ConvexAuthStateKey, authState)
        return () => h(Child)
      },
    })

    const mounted = await mountSuspended(Wrapper)
    await nextTick()
    await nextTick()

    expect(hydrated.value).toStrictEqual(null)

    mounted.unmount()
    await client.close()
  })
})
