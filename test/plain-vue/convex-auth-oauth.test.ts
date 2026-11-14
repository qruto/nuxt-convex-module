import type { TokenBundle } from '@convex-dev/auth'
import { AuthClient, InMemoryStorage } from '@convex-dev/auth/browser'
import { flushPromises, mount } from '@vue/test-utils'
import { getFunctionName, makeFunctionReference } from 'convex/server'
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { provideAuth, useAuth, type AuthSignInApi } from '../../src/runtime/convex-auth/vue/client'
import { useAuthToken } from '../../src/runtime/convex-auth/vue/index'
import { useAmbientSignInValue } from '../../src/runtime/convex-auth/vue/methods'
import { useSignInWithApple } from '../../src/runtime/convex-auth/vue/methods/apple'
import { useSignInWithGithub } from '../../src/runtime/convex-auth/vue/methods/github'
import { useSignInWithGoogle } from '../../src/runtime/convex-auth/vue/methods/google'
import {
  oauth,
  useOauth,
  useOauthSignIn,
  type OauthCompleteResult,
  type OauthProviderApi,
  type OauthProviderRefs,
  type OauthStartResult,
  type SignInOptions,
  type UseOauthSignInReturn,
} from '../../src/runtime/convex-auth/vue/methods/oauth'

// The Vue counterparts of upstream's `react/methods.test.tsx` and
// `methods/oauth/react.test.tsx`, in the project with no `define`. The
// helpers follow upstream's `methods/oauth/testFlow.ts`.

const NAMESPACE = 'https://happy-animal-123.convex.cloud'
// Where `NamespacedStorage(storage, NAMESPACE).forSignIn("oauth")` keeps the flow.
const FLOW_KEY = '__convexAuthProvider_oauth_flow_httpshappyanimal123convexcloud'

const bundle: TokenBundle = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  refreshTokenExpiresAt: 0,
  userId: 'user-1',
}
const completed = { status: 'complete' as const, tokens: bundle }

const reference = (name: string) => makeFunctionReference<'mutation'>(name) as never
const googleApi = {
  startSignInWithGoogle: reference('auth:startSignInWithGoogle') as OauthProviderApi['startSignIn'],
  completeSignInWithGoogle: reference('auth:completeSignInWithGoogle') as OauthProviderApi['completeSignIn'],
}
const githubApi = {
  startSignInWithGithub: reference('auth:startSignInWithGithub') as OauthProviderApi['startSignIn'],
  completeSignInWithGithub: reference('auth:completeSignInWithGithub') as OauthProviderApi['completeSignIn'],
}
const appleApi = {
  startSignInWithApple: reference('auth:startSignInWithApple') as OauthProviderApi['startSignIn'],
  completeSignInWithApple: reference('auth:completeSignInWithApple') as OauthProviderApi['completeSignIn'],
}
const googleRefs: OauthProviderRefs = {
  providerName: 'google',
  startSignIn: googleApi.startSignInWithGoogle,
  completeSignIn: googleApi.completeSignInWithGoogle,
}
const acmeRefs: OauthProviderRefs = {
  providerName: 'acme',
  startSignIn: reference('auth:startSignInWithAcme'),
  completeSignIn: reference('auth:completeSignInWithAcme'),
}

const readFlow = (storage: InMemoryStorage) => {
  const raw = storage.getItem(FLOW_KEY)
  return raw === null ? null : JSON.parse(raw) as unknown
}
function seedPendingFlow(storage: InMemoryStorage, refs: OauthProviderRefs, state = 'state-1') {
  storage.setItem(FLOW_KEY, JSON.stringify({
    providerName: refs.providerName,
    state,
    completeSignIn: getFunctionName(refs.completeSignIn),
  }))
}

const authApi = {
  refreshSession: async () => ({ kind: 'noSession' as const }),
  signOut: async () => {},
}
const stubSignInApi = () => ({ mutation: vi.fn(), action: vi.fn() }) as unknown as AuthSignInApi

/** An auth client with `oauth()` registered, and the two mutation paths stubbed. */
function oauthClient(storage: InMemoryStorage) {
  const mutation = vi.fn()
  const signInApi = { mutation, action: vi.fn() } as unknown as AuthSignInApi
  const convexMutation = vi.fn()
  const client = new AuthClient({
    mode: 'spa',
    authApi,
    storage,
    storageNamespace: NAMESPACE,
    ambientSignIns: {
      signIns: [oauth()],
      signInApi,
      convex: { mutation: convexMutation },
    },
  })
  return { client, signInApi, mutation, convexMutation }
}

/** Run `useComposable` in a component below `provideAuth`. */
function mountUnder<T>(client: AuthClient, signInApi: AuthSignInApi, useComposable: () => T) {
  const result = {} as { composable: T }
  const Child = defineComponent({
    setup() {
      result.composable = useComposable()
      return () => null
    },
  })
  mount(defineComponent({
    setup() {
      provideAuth({ authClient: client, signInApi })
      return () => h(Child)
    },
  }))
  return result
}

function mountOAuth<T>(useComposable: () => T, { storage = new InMemoryStorage(), onMutation = (_mutation: ReturnType<typeof vi.fn>) => {} } = {}) {
  const { client, signInApi, mutation, convexMutation } = oauthClient(storage)
  onMutation(mutation)
  const result = mountUnder(client, signInApi, useComposable)
  return { result, mutation, convexMutation, storage }
}

const useGoogleFlow = () => ({
  auth: useAuth(),
  token: useAuthToken(),
  oauth: useSignInWithGoogle(googleApi),
  flowError: useOauth().flowError,
})

/** React Native has no page to leave, so a started flow returns its URL instead of navigating. */
function stubReactNative() {
  Object.defineProperty(window.navigator, 'product', { value: 'ReactNative', configurable: true })
}

afterEach(() => {
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
  delete (window.navigator as { product?: string }).product
})

describe('useAmbientSignInValue', () => {
  const makeClient = () => new AuthClient({ mode: 'spa', authApi, storage: new InMemoryStorage(), storageNamespace: NAMESPACE })

  /** An auth client with a probe ambient sign-in, plus the values view its setup received. */
  function makeProbeClient() {
    const probe: { values?: { set: (key: string, value: unknown) => void } } = {}
    const client = new AuthClient({
      mode: 'spa',
      authApi,
      storage: new InMemoryStorage(),
      storageNamespace: NAMESPACE,
      ambientSignIns: {
        signIns: [{
          id: 'probe',
          setup: (ctx) => {
            probe.values = ctx.values
          },
        }],
        signInApi: stubSignInApi(),
        convex: { mutation: vi.fn() },
      },
    })
    if (probe.values === undefined) throw new Error('probe setup did not run')
    return { client, probeValues: probe.values }
  }

  it('throws when used outside a provider', () => {
    expect(() => mount(defineComponent({
      setup() {
        useAmbientSignInValue('probe', 'greeting')
        return () => null
      },
    }))).toThrow(/useAmbientSignInValue must be used below `provideConvexAuth`/)
  })

  it('holds undefined for an unregistered key', () => {
    const result = mountUnder(makeClient(), stubSignInApi(), () => useAmbientSignInValue('probe', 'missing'))
    expect(result.composable.value).toBeUndefined()
  })

  it('reads a value seeded before setup and follows a set', () => {
    const { client, probeValues } = makeProbeClient()
    probeValues.set('greeting', 'hello')

    const result = mountUnder(client, stubSignInApi(), () => useAmbientSignInValue<string>('probe', 'greeting'))
    expect(result.composable.value).toBe('hello')

    probeValues.set('greeting', 'hi again')
    expect(result.composable.value).toBe('hi again')
  })
})

describe('OAuth Vue client', () => {
  it('the composables throw when oauth() is not registered', () => {
    const client = new AuthClient({ mode: 'spa', authApi, storage: new InMemoryStorage(), storageNamespace: NAMESPACE })
    expect(() => mountUnder(client, stubSignInApi(), () => useSignInWithGoogle(googleApi))).toThrow(/No OAuth setup is registered/)
    expect(() => mountUnder(client, stubSignInApi(), () => useOauth())).toThrow(/No OAuth setup is registered/)
  })

  it('a callback code is redeemed once, and leaves the URL', async () => {
    window.history.replaceState(null, '', '/?convexAuthCode=code-1&keep=1')
    const storage = new InMemoryStorage()
    seedPendingFlow(storage, googleRefs)

    const { result, mutation } = mountOAuth(useGoogleFlow, {
      storage,
      onMutation: mutation => mutation.mockResolvedValueOnce(completed),
    })

    await vi.waitFor(() => expect(result.composable.auth.isAuthenticated()).toBe(true))
    expect(mutation).toHaveBeenCalledOnce()
    expect(getFunctionName(mutation.mock.calls[0]![0] as never)).toBe('auth:completeSignInWithGoogle')
    expect(mutation.mock.calls[0]![1]).toEqual({ code: 'code-1', state: 'state-1' })
    expect(result.composable.token.value).toBe('access-1')
    expect(result.composable.flowError.value).toBeNull()
    expect(window.location.search).toBe('?keep=1')
  })

  it('a callback error param reaches useOauth\'s flowError', async () => {
    window.history.replaceState(null, '', '/?convexAuthError=access_denied')

    const { result, mutation } = mountOAuth(useGoogleFlow)

    await vi.waitFor(() => expect(result.composable.flowError.value?.error).toBe('ACCESS_DENIED'))
    expect(mutation).not.toHaveBeenCalled()
  })

  it('signIn from the composable starts a flow with the picked references', async () => {
    stubReactNative()
    const { result, convexMutation, storage } = mountOAuth(useGoogleFlow)
    await flushPromises()
    convexMutation.mockResolvedValueOnce({
      redirect: 'https://provider.example/auth?client_id=x',
      state: 'state-1',
    })

    const outcome = await result.composable.oauth.signIn({ redirectTo: 'http://localhost/app' })

    expect(convexMutation).toHaveBeenCalledExactlyOnceWith(googleApi.startSignInWithGoogle, { redirectTo: 'http://localhost/app' })
    expectTypeOf(outcome).toEqualTypeOf<OauthStartResult>()
    expect(outcome).toEqual({
      status: 'redirect',
      redirect: new URL('https://provider.example/auth?client_id=x'),
    })
    expect(readFlow(storage)).toEqual({
      providerName: 'google',
      state: 'state-1',
      completeSignIn: 'auth:completeSignInWithGoogle',
    })
  })

  it('signIn with a code from the composable resolves to the completion result', async () => {
    const storage = new InMemoryStorage()
    seedPendingFlow(storage, googleRefs)
    const { result, mutation } = mountOAuth(useGoogleFlow, { storage })
    await flushPromises()
    mutation.mockResolvedValueOnce(completed)

    const outcome = await result.composable.oauth.signIn({ code: 'code-1' })

    expectTypeOf(outcome).toEqualTypeOf<OauthCompleteResult>()
    expect(outcome).toEqual({ status: 'complete' })
    expect(result.composable.auth.isAuthenticated()).toBe(true)
  })

  it.each([
    ['github', () => useSignInWithGithub(githubApi), githubApi.startSignInWithGithub, 'auth:completeSignInWithGithub'],
    ['apple', () => useSignInWithApple(appleApi), appleApi.startSignInWithApple, 'auth:completeSignInWithApple'],
    ['acme', () => useOauthSignIn(acmeRefs), acmeRefs.startSignIn, 'auth:completeSignInWithAcme'],
  ] as const)('the %s composable starts a flow with its own references', async (providerName, useSignIn, startSignIn, completeSignIn) => {
    stubReactNative()
    const { result, convexMutation, storage } = mountOAuth(useSignIn)
    await flushPromises()
    convexMutation.mockResolvedValueOnce({
      redirect: 'https://provider.example/auth',
      state: 'state-2',
    })

    const outcome = await result.composable.signIn({ redirectTo: 'http://localhost/app' })

    expect(convexMutation).toHaveBeenCalledExactlyOnceWith(startSignIn, { redirectTo: 'http://localhost/app' })
    expect(outcome).toEqual({ status: 'redirect', redirect: new URL('https://provider.example/auth') })
    expect(readFlow(storage)).toEqual({ providerName, state: 'state-2', completeSignIn })
  })

  it('the composable params accept the api module structurally', () => {
    type GoogleParam = Parameters<typeof useSignInWithGoogle>[0]
    const apiModule = {
      ...googleApi,
      signOut: undefined as unknown,
      startSignInWithGithub: undefined as unknown,
    }
    const full: GoogleParam = apiModule
    void full
    // @ts-expect-error The Google method also needs its `completeSignInWithGoogle` function.
    const missing: GoogleParam = { startSignInWithGoogle: googleApi.startSignInWithGoogle }
    void missing
  })

  it('signIn is typed by the shape it is called with', () => {
    type SignIn = UseOauthSignInReturn['signIn']
    expectTypeOf<ReturnType<SignIn>>().toEqualTypeOf<Promise<OauthStartResult>>()
    const calls = (signIn: SignIn, options: SignInOptions) => {
      expectTypeOf(signIn()).toEqualTypeOf<Promise<OauthStartResult>>()
      expectTypeOf(signIn({ code: 'code-1' })).toEqualTypeOf<Promise<OauthCompleteResult>>()
      // @ts-expect-error Options that might hold a code match neither shape.
      void signIn(options)
    }
    void calls
  })
})
