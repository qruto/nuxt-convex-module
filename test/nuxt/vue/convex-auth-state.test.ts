import { describe, expect, it, vi } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, nextTick, ref } from 'vue'
import type { AuthTokenFetcher } from 'convex/browser'
import { provideConvexAuth, useConvexAuth, type IConvexVueClient } from '../../../src/runtime/vue/auth'
import type { ConvexVueClient } from '../../../src/runtime/vue/client'

describe('ConvexAuthState', () => {
  it('provideConvexAuth works', async () => {
    const isLoading = ref(true)
    const isAuthenticated = ref(false)
    const fetchAccessToken: AuthTokenFetcher = vi.fn(async () => 'token')

    let onAuthChange: ((isAuthenticated: boolean) => void) | undefined
    const client = {
      setAuth: vi.fn((_fetchToken, callback) => {
        onAuthChange = callback
      }),
      clearAuth: vi.fn(),
    } as unknown as ConvexVueClient

    const App = defineComponent({
      setup() {
        const auth = useConvexAuth()
        return () => h('div', auth.isLoading.value ? 'Loading...' : auth.isAuthenticated.value ? 'Authenticated' : 'Unauthenticated')
      },
    })

    const Wrapper = defineComponent({
      setup() {
        provideConvexAuth({
          client,
          useAuth: () => ({
            isLoading,
            isAuthenticated,
            fetchAccessToken,
          }),
        })
        return () => h(App)
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    expect(wrapper.text()).toBe('Loading...')

    isLoading.value = false
    isAuthenticated.value = true
    await nextTick()

    expect(client.setAuth).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toBe('Loading...')

    onAuthChange?.(true)
    await nextTick()

    expect(wrapper.text()).toBe('Authenticated')

    wrapper.unmount()
    expect(client.clearAuth).toHaveBeenCalledTimes(1)
  })

  it('calls setAuth when the provider is authenticated while still loading', async () => {
    // A provider may report a cached session as authenticated while it is
    // still revalidating (isLoading true). Upstream convex/react authenticates
    // the client immediately in that window — the provider's loading flag must
    // not gate setAuth.
    const isLoading = ref(true)
    const isAuthenticated = ref(true)
    const fetchAccessToken: AuthTokenFetcher = vi.fn(async () => 'token')

    let onAuthChange: ((isAuthenticated: boolean) => void) | undefined
    const client = {
      setAuth: vi.fn((_fetchToken, callback) => {
        onAuthChange = callback
      }),
      clearAuth: vi.fn(),
    } as unknown as ConvexVueClient

    const App = defineComponent({
      setup() {
        const auth = useConvexAuth()
        return () => h('div', auth.isLoading.value ? 'Loading...' : auth.isAuthenticated.value ? 'Authenticated' : 'Unauthenticated')
      },
    })

    const Wrapper = defineComponent({
      setup() {
        provideConvexAuth({
          client,
          useAuth: () => ({
            isLoading,
            isAuthenticated,
            fetchAccessToken,
          }),
        })
        return () => h(App)
      },
    })

    const wrapper = await mountSuspended(Wrapper)

    // setAuth fires despite the provider still loading...
    expect(client.setAuth).toHaveBeenCalledTimes(1)
    // ...but the surfaced state stays loading: the reconciliation keeps
    // isConvexAuthenticated null while the provider loads, even if the deployment
    // confirms the token in the meantime.
    expect(wrapper.text()).toBe('Loading...')

    onAuthChange?.(true)
    await nextTick()
    expect(wrapper.text()).toBe('Loading...')

    wrapper.unmount()
  })

  it('resets to loading and unauthenticated when auth provider state changes', async () => {
    const isLoading = ref(false)
    const isAuthenticated = ref(true)
    const fetchAccessToken: AuthTokenFetcher = vi.fn(async () => 'token')

    let onAuthChange: ((isAuthenticated: boolean) => void) | undefined
    const client = {
      setAuth: vi.fn((_fetchToken, callback) => {
        onAuthChange = callback
      }),
      clearAuth: vi.fn(),
    } as unknown as ConvexVueClient

    const App = defineComponent({
      setup() {
        const auth = useConvexAuth()
        return () => h('div', auth.isLoading.value ? 'Loading...' : auth.isAuthenticated.value ? 'Authenticated' : 'Unauthenticated')
      },
    })

    const Wrapper = defineComponent({
      setup() {
        provideConvexAuth({
          client,
          useAuth: () => ({
            isLoading,
            isAuthenticated,
            fetchAccessToken,
          }),
        })
        return () => h(App)
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    onAuthChange?.(true)
    await nextTick()
    expect(wrapper.text()).toBe('Authenticated')

    isLoading.value = true
    await nextTick()
    expect(wrapper.text()).toBe('Loading...')

    isLoading.value = false
    isAuthenticated.value = false
    await nextTick()
    expect(wrapper.text()).toBe('Unauthenticated')
  })

  it('settles to unauthenticated on a live sign-out (authenticated → unauthenticated directly)', async () => {
    // Reproduces the "live sign-out hangs in loading" bug: the provider goes
    // straight from authenticated to not-authenticated in a single tick (no
    // intermediate loading state, as happens on `client.signOut()`). The
    // setAuth() effect cleanup resets Convex state to `null`; without the
    // reconciliation re-running, useConvexAuth() would stay stuck in loading.
    const isLoading = ref(false)
    const isAuthenticated = ref(true)
    const fetchAccessToken: AuthTokenFetcher = vi.fn(async () => 'token')

    let onAuthChange: ((isAuthenticated: boolean) => void) | undefined
    const client = {
      setAuth: vi.fn((_fetchToken, callback) => {
        onAuthChange = callback
      }),
      clearAuth: vi.fn(),
    } as unknown as ConvexVueClient

    const App = defineComponent({
      setup() {
        const auth = useConvexAuth()
        return () => h('div', auth.isLoading.value ? 'Loading...' : auth.isAuthenticated.value ? 'Authenticated' : 'Unauthenticated')
      },
    })

    const Wrapper = defineComponent({
      setup() {
        provideConvexAuth({
          client,
          useAuth: () => ({
            isLoading,
            isAuthenticated,
            fetchAccessToken,
          }),
        })
        return () => h(App)
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    onAuthChange?.(true)
    await nextTick()
    expect(wrapper.text()).toBe('Authenticated')

    // Sign out: the Better Auth session resolves directly to "not authenticated"
    // without ever flipping back to loading.
    isAuthenticated.value = false
    await nextTick()
    expect(wrapper.text()).toBe('Unauthenticated')
    expect(client.clearAuth).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('exposes isRefreshing while re-fetching a server-rejected token (only when authenticated)', async () => {
    const isLoading = ref(false)
    const isAuthenticated = ref(true)
    const fetchAccessToken: AuthTokenFetcher = vi.fn(async () => 'token')

    let onAuthChange: ((isAuthenticated: boolean) => void) | undefined
    let onRefreshChange: ((isRefreshing: boolean) => void) | undefined
    const client = {
      setAuth: vi.fn((_fetchToken, onChange, onRefresh) => {
        onAuthChange = onChange
        onRefreshChange = onRefresh
      }),
      clearAuth: vi.fn(),
    } as unknown as ConvexVueClient

    const App = defineComponent({
      setup() {
        const auth = useConvexAuth()
        return () => h('div', auth.isRefreshing.value
          ? 'Refreshing'
          : auth.isLoading.value
            ? 'Loading...'
            : auth.isAuthenticated.value ? 'Authenticated' : 'Unauthenticated')
      },
    })

    const Wrapper = defineComponent({
      setup() {
        provideConvexAuth({
          client,
          useAuth: () => ({ isLoading, isAuthenticated, fetchAccessToken }),
        })
        return () => h(App)
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    onAuthChange?.(true)
    await nextTick()
    expect(wrapper.text()).toBe('Authenticated')

    // Server rejected the previously-confirmed token; socket paused to fetch a
    // replacement.
    onRefreshChange?.(true)
    await nextTick()
    expect(wrapper.text()).toBe('Refreshing')

    // Refresh completes — back to a settled authenticated state.
    onRefreshChange?.(false)
    await nextTick()
    expect(wrapper.text()).toBe('Authenticated')

    // A live sign-out clears any lingering refreshing flag.
    onRefreshChange?.(true)
    isAuthenticated.value = false
    await nextTick()
    expect(wrapper.text()).toBe('Unauthenticated')

    wrapper.unmount()
  })

  it('re-registers Convex auth when the auth context changes', async () => {
    const isLoading = ref(false)
    const isAuthenticated = ref(true)
    const authVersion = ref('session-1')
    const fetchAccessToken: AuthTokenFetcher = vi.fn(async () => 'token')

    const client = {
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    } as unknown as ConvexVueClient

    const Wrapper = defineComponent({
      setup() {
        provideConvexAuth({
          client,
          useAuth: () => ({
            isLoading,
            isAuthenticated,
            fetchAccessToken,
            authVersion,
          }),
        })
        return () => h('div', 'auth')
      },
    })

    const wrapper = await mountSuspended(Wrapper)

    expect(client.setAuth).toHaveBeenCalledTimes(1)

    authVersion.value = 'session-2'
    await nextTick()

    expect(client.clearAuth).toHaveBeenCalledTimes(1)
    expect(client.setAuth).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('re-registers Convex auth when the fetchAccessToken ref identity changes', async () => {
    // Upstream re-runs its setAuth effect when the `useAuth` prop returns a
    // new `fetchAccessToken` function between renders (e.g. Clerk org switch
    // via useCallback deps). The Vue translation carries the fetcher in a ref.
    const isLoading = ref(false)
    const isAuthenticated = ref(true)
    const fetchAccessToken = ref<AuthTokenFetcher>(vi.fn(async () => 'token-a'))

    // The client option accepts the minimal IConvexVueClient duck type,
    // mirroring upstream's IConvexReactClient.
    const client: IConvexVueClient = {
      setAuth: vi.fn(),
      clearAuth: vi.fn(),
    }

    const Wrapper = defineComponent({
      setup() {
        provideConvexAuth({
          client,
          useAuth: () => ({
            isLoading,
            isAuthenticated,
            fetchAccessToken,
          }),
        })
        return () => h('div', 'auth')
      },
    })

    const wrapper = await mountSuspended(Wrapper)

    expect(client.setAuth).toHaveBeenCalledTimes(1)
    expect(vi.mocked(client.setAuth).mock.calls[0]![0]).toBe(fetchAccessToken.value)

    const newFetcher: AuthTokenFetcher = vi.fn(async () => 'token-b')
    fetchAccessToken.value = newFetcher
    await nextTick()

    expect(client.clearAuth).toHaveBeenCalledTimes(1)
    expect(client.setAuth).toHaveBeenCalledTimes(2)
    expect(vi.mocked(client.setAuth).mock.calls[1]![0]).toBe(newFetcher)

    wrapper.unmount()
  })
})
