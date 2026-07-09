// @vitest-environment nuxt
import { describe, expect, it, vi } from 'vitest'
import { computed, defineComponent, h, nextTick, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import type { AuthTokenFetcher } from 'convex/browser'
import type { ConvexVueClient } from '../../../../src/runtime/vue/client'

// The adapter imports `useAuth` from `@clerk/vue` at module load; stub it so the
// real SDK isn't initialized. Each test passes its own `useAuth` override.
vi.mock('@clerk/vue', () => ({ useAuth: vi.fn() }))

const { provideConvexAuthFromClerk, ConvexProviderWithClerk } = await import('../../../../src/runtime/clerk/vue/index')
const { useConvexAuth } = await import('../../../../src/runtime/vue/auth/index')

type ClerkUseAuthOverride = NonNullable<
  Parameters<typeof provideConvexAuthFromClerk>[0]
>['useAuth']

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
  return {
    client,
    confirmAuth: () => onAuthChange?.(true),
    fetchToken: () => fetchToken!,
  }
}

describe('ConvexProviderWithClerk (provideConvexAuthFromClerk)', () => {
  it('maps Clerk loading/signed-in state into Convex auth', async () => {
    const isLoaded = ref(false)
    const isSignedIn = ref<boolean | undefined>(false)
    const getToken = vi.fn(async () => 'jwt')
    const useClerk: ClerkUseAuthOverride = () => ({
      isLoaded: computed(() => isLoaded.value),
      isSignedIn: computed(() => isSignedIn.value),
      getToken: computed(() => getToken),
      orgId: computed(() => null),
      orgRole: computed(() => null),
      sessionClaims: computed(() => null),
    }) as never

    const { client, confirmAuth } = makeClient()

    const App = defineComponent({
      setup() {
        const auth = useConvexAuth()
        return () => h('div', auth.isLoading.value ? 'Loading' : auth.isAuthenticated.value ? 'In' : 'Out')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        provideConvexAuthFromClerk({ client, useAuth: useClerk })
        return () => h(App)
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    expect(wrapper.text()).toBe('Loading')

    isLoaded.value = true
    isSignedIn.value = true
    await nextTick()
    expect(client.setAuth).toHaveBeenCalledTimes(1)

    confirmAuth()
    await nextTick()
    expect(wrapper.text()).toBe('In')

    wrapper.unmount()
  })

  it('fetches the access token via the "convex" template, or skips it when claims already target convex', async () => {
    const isLoaded = ref(true)
    const isSignedIn = ref<boolean | undefined>(true)
    const getToken = vi.fn(async () => 'jwt')
    const sessionClaims = ref<{ aud?: string } | null>(null)
    const useClerk: ClerkUseAuthOverride = () => ({
      isLoaded: computed(() => isLoaded.value),
      isSignedIn: computed(() => isSignedIn.value),
      getToken: computed(() => getToken),
      orgId: computed(() => null),
      orgRole: computed(() => null),
      sessionClaims: computed(() => sessionClaims.value),
    }) as never

    const { client, fetchToken } = makeClient()
    const Wrapper = defineComponent({
      setup() {
        provideConvexAuthFromClerk({ client, useAuth: useClerk })
        return () => h('div')
      },
    })
    await mountSuspended(Wrapper)
    await nextTick()

    await fetchToken()({ forceRefreshToken: true })
    expect(getToken).toHaveBeenLastCalledWith({ template: 'convex', skipCache: true })

    sessionClaims.value = { aud: 'convex' }
    await fetchToken()({ forceRefreshToken: false })
    expect(getToken).toHaveBeenLastCalledWith({ skipCache: false })
  })

  it('resolves a null token instead of throwing when Clerk getToken rejects', async () => {
    const getToken = vi.fn(async () => {
      throw new Error('clerk is down')
    })
    const useClerk: ClerkUseAuthOverride = () => ({
      isLoaded: computed(() => true),
      isSignedIn: computed(() => true),
      getToken: computed(() => getToken),
      orgId: computed(() => null),
      orgRole: computed(() => null),
      sessionClaims: computed(() => null),
    }) as never

    const { client, fetchToken } = makeClient()
    const Wrapper = defineComponent({
      setup() {
        provideConvexAuthFromClerk({ client, useAuth: useClerk })
        return () => h('div')
      },
    })
    await mountSuspended(Wrapper)
    await nextTick()

    await expect(fetchToken()({ forceRefreshToken: false })).resolves.toBeNull()
    expect(getToken).toHaveBeenCalledTimes(1)
  })

  it('re-runs setAuth when the active organization changes', async () => {
    const orgId = ref<string | null>('org-1')
    const useClerk: ClerkUseAuthOverride = () => ({
      isLoaded: computed(() => true),
      isSignedIn: computed(() => true),
      getToken: computed(() => vi.fn(async () => 'jwt')),
      orgId: computed(() => orgId.value),
      orgRole: computed(() => null),
      sessionClaims: computed(() => null),
    }) as never

    const { client } = makeClient()
    const Wrapper = defineComponent({
      setup() {
        provideConvexAuthFromClerk({ client, useAuth: useClerk })
        return () => h('div')
      },
    })
    const wrapper = await mountSuspended(Wrapper)
    await nextTick()
    expect(client.setAuth).toHaveBeenCalledTimes(1)

    orgId.value = 'org-2'
    await nextTick()
    expect(client.clearAuth).toHaveBeenCalledTimes(1)
    expect(client.setAuth).toHaveBeenCalledTimes(2)

    wrapper.unmount()
  })

  it('the <ConvexProviderWithClerk> component wires auth and renders its slot', async () => {
    const useClerk: ClerkUseAuthOverride = () => ({
      isLoaded: computed(() => true),
      isSignedIn: computed(() => true),
      getToken: computed(() => vi.fn(async () => 'jwt')),
      orgId: computed(() => null),
      orgRole: computed(() => null),
      sessionClaims: computed(() => null),
    }) as never

    const { client, confirmAuth } = makeClient()
    const Child = defineComponent({
      setup() {
        const auth = useConvexAuth()
        return () => h('span', auth.isAuthenticated.value ? 'In' : 'Out')
      },
    })
    const Wrapper = defineComponent({
      setup() {
        return () => h(
          ConvexProviderWithClerk,
          { client, useAuth: useClerk },
          { default: () => h(Child) },
        )
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    await nextTick()
    expect(client.setAuth).toHaveBeenCalledTimes(1)

    confirmAuth()
    await nextTick()
    expect(wrapper.text()).toBe('In')

    wrapper.unmount()
  })
})
