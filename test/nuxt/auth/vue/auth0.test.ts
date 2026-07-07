// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { AuthTokenFetcher } from 'convex/browser'
import type { ConvexVueClient } from '../../../../src/runtime/vue/client'

// Holder shared with the hoisted mock so tests can toggle Auth0 state.
const holder = vi.hoisted(() => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isLoading: undefined as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  isAuthenticated: undefined as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getAccessTokenSilently: undefined as any,
}))

vi.mock('@auth0/auth0-vue', async () => {
  const { ref } = await import('vue')
  holder.isLoading = ref(true)
  holder.isAuthenticated = ref(false)
  holder.getAccessTokenSilently = vi.fn(async () => ({ id_token: 'auth0-id-token' }))
  return {
    useAuth0: () => ({
      isLoading: holder.isLoading,
      isAuthenticated: holder.isAuthenticated,
      getAccessTokenSilently: holder.getAccessTokenSilently,
    }),
  }
})

const { provideConvexAuthFromAuth0 } = await import('../../../../src/runtime/auth0/vue/index')
const { useConvexAuth } = await import('../../../../src/runtime/vue/auth/index')

function makeClient() {
  let onAuthChange: ((isAuthenticated: boolean) => void) | undefined
  let fetchToken: AuthTokenFetcher | undefined
  const client = {
    setAuth: vi.fn((ft: AuthTokenFetcher, onChange: (b: boolean) => void) => {
      fetchToken = ft
      onAuthChange = onChange
    }),
    clearAuth: vi.fn(),
  } as unknown as ConvexVueClient
  return { client, confirmAuth: () => onAuthChange?.(true), fetchToken: () => fetchToken! }
}

describe('ConvexProviderWithAuth0 (provideConvexAuthFromAuth0)', () => {
  it('maps Auth0 state into Convex auth and fetches the id_token', async () => {
    const { client, confirmAuth, fetchToken } = makeClient()

    const App = defineComponent({
      setup() {
        const auth = useConvexAuth()
        return () => h('div', auth.isLoading.value ? 'Loading' : auth.isAuthenticated.value ? 'In' : 'Out')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        provideConvexAuthFromAuth0({ client })
        return () => h(App)
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    expect(wrapper.text()).toBe('Loading')

    holder.isLoading.value = false
    holder.isAuthenticated.value = true
    await nextTick()
    expect(client.setAuth).toHaveBeenCalledTimes(1)

    confirmAuth()
    await nextTick()
    expect(wrapper.text()).toBe('In')

    // forceRefreshToken: true → cacheMode "off"; returns the Auth0 id_token.
    const token = await fetchToken()({ forceRefreshToken: true })
    expect(token).toBe('auth0-id-token')
    expect(holder.getAccessTokenSilently).toHaveBeenLastCalledWith({
      detailedResponse: true,
      cacheMode: 'off',
    })

    await fetchToken()({ forceRefreshToken: false })
    expect(holder.getAccessTokenSilently).toHaveBeenLastCalledWith({
      detailedResponse: true,
      cacheMode: 'on',
    })

    wrapper.unmount()
  })
})
