import { AuthClient, InMemoryStorage } from '@convex-dev/auth/browser'
import { flushPromises, mount } from '@vue/test-utils'
import { anyApi, getFunctionName, type FunctionReference } from 'convex/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import { provideAuth, type AuthSignInApi } from '../../src/runtime/convex-auth/vue/client'
import {
  createUsernamePasskeyHooks,
  type AddPasskeyApi,
  type PasskeyCeremonies,
  type UsernamePasskeyApi,
} from '../../src/runtime/convex-auth/vue/methods/username-passkey/custom'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

// The Vue counterpart of upstream's
// `methods/username-passkey/react-custom.test.tsx`, scenario for scenario.
//
// happy-dom has no `PublicKeyCredential`, so a passing ceremony here can only
// come from the app's ceremonies below, not from the browser ones.

const mutations = {
  startSignInWithUsernamePasskey: vi.fn(),
  finishSignUpWithUsernamePasskey: vi.fn(),
  startAutofillSignInWithUsernamePasskey: vi.fn(),
  startAddPasskey: vi.fn(),
  verifyAddPasskey: vi.fn(),
  finishAddPasskey: vi.fn(),
}
const runMutation = (fn: FunctionReference<'mutation'>, args: unknown) =>
  mutations[getFunctionName(fn).split(':')[1] as keyof typeof mutations](args)
const signInApi = { mutation: runMutation } as unknown as AuthSignInApi
const convexClient = { mutation: runMutation } as unknown as ConvexVueClient
const api = () => anyApi.auth as unknown as UsernamePasskeyApi & AddPasskeyApi

const ceremonies = {
  isSupported: () => true,
  register: vi.fn<PasskeyCeremonies['register']>(),
  authenticate: vi.fn<PasskeyCeremonies['authenticate']>(),
}
const hooks = createUsernamePasskeyHooks(ceremonies)

const registration = {
  id: 'cred-1',
  rawId: 'cred-1',
  response: { clientDataJSON: 'client-data', attestationObject: 'att' },
  type: 'public-key' as const,
}
const authentication = {
  id: 'cred-1',
  rawId: 'cred-1',
  response: {
    clientDataJSON: 'client-data',
    authenticatorData: 'auth-data',
    signature: 'signature',
  },
  type: 'public-key' as const,
}
const wire = <T>(response: T) => ({ ...response, clientExtensionResults: {} })

afterEach(() => {
  for (const mock of Object.values(mutations)) mock.mockReset()
  ceremonies.register.mockReset()
  ceremonies.authenticate.mockReset()
})

/** Run `useComposable` below the auth provider and a Convex client. */
function mountWithProviders<T>(useComposable: () => T) {
  const authClient = new AuthClient({
    mode: 'spa',
    authApi: {
      refreshSession: async () => ({ kind: 'noSession' as const }),
      signOut: async () => {},
    },
    storage: new InMemoryStorage(),
    storageNamespace: 'https://happy-animal-123.convex.cloud',
  })
  const result = {} as { auth: ReturnType<typeof provideAuth>, composable: T }
  const Child = defineComponent({
    setup() {
      result.composable = useComposable()
      return () => null
    },
  })
  mount(defineComponent({
    setup() {
      provide(ConvexClientKey, convexClient)
      result.auth = provideAuth({ authClient, signInApi })
      return () => h(Child)
    },
  }))
  return result
}

describe('createUsernamePasskeyHooks', () => {
  it('useSignInWithUsernamePasskey runs the app\'s ceremonies', async () => {
    const options = { challenge: 'challenge-1' }
    mutations.startSignInWithUsernamePasskey.mockResolvedValue({
      success: true,
      step: 'register',
      options,
    })
    ceremonies.register.mockResolvedValue({
      success: true,
      response: registration,
    })
    mutations.finishSignUpWithUsernamePasskey.mockResolvedValue({
      status: 'complete',
      tokens: {
        accessToken: 'access-1',
        refreshToken: 'refresh-1',
        refreshTokenExpiresAt: 0,
        userId: 'user-1',
      },
    })
    const result = mountWithProviders(() => hooks.useSignInWithUsernamePasskey(api()))
    await flushPromises()
    expect(result.auth.isLoading()).toBe(false)

    await result.composable.signIn({ username: 'alice' })

    expect(ceremonies.register).toHaveBeenCalledWith(options)
    expect(mutations.finishSignUpWithUsernamePasskey).toHaveBeenCalledWith({
      username: 'alice',
      response: wire(registration),
    })
    expect(result.auth.isAuthenticated()).toBe(true)
    // The ceremonies have no `autofill`.
    const { available, status, lastError } = result.composable.autofill
    expect({ available: available.value, status: status.value, lastError: lastError.value }).toEqual({
      available: false,
      status: 'stopped',
      lastError: null,
    })
    expect(mutations.startAutofillSignInWithUsernamePasskey).not.toHaveBeenCalled()
  })

  it('useAddPasskey runs the app\'s ceremonies', async () => {
    mutations.startAddPasskey.mockResolvedValue({ success: true, options: {} })
    ceremonies.authenticate.mockResolvedValue({
      success: true,
      response: authentication,
    })
    mutations.verifyAddPasskey.mockResolvedValue({
      success: true,
      options: {},
    })
    ceremonies.register.mockResolvedValue({
      success: true,
      response: registration,
    })
    mutations.finishAddPasskey.mockResolvedValue({ success: true })
    const result = mountWithProviders(() => hooks.useAddPasskey(api()))

    const returned = await result.composable.addPasskey()

    expect(mutations.verifyAddPasskey).toHaveBeenCalledWith({
      response: wire(authentication),
    })
    expect(mutations.finishAddPasskey).toHaveBeenCalledWith({
      response: wire(registration),
    })
    expect(returned).toEqual({ success: true })
  })
})
