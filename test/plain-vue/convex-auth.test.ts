import type { TokenBundle } from '@convex-dev/auth'
import { AuthClient, InMemoryStorage, JWT_STORAGE_KEY, REFRESH_TOKEN_STORAGE_KEY, type SpaAuthApi } from '@convex-dev/auth/browser'
import { flushPromises, mount } from '@vue/test-utils'
import { anyApi, makeFunctionReference } from 'convex/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { computed, type ComputedRef, defineComponent, h, nextTick, provide, ref } from 'vue'
import { provideAuth, useAuthSignInApi, useSessionWatcher, type AuthSignInApi } from '../../src/runtime/convex-auth/vue/client'
import { ConvexAuthProvider, provideConvexAuth, useAuthActions, useAuthToken } from '../../src/runtime/convex-auth/vue/index'
import {
  useSignInWithUsernamePassword,
  useSignUpWithUsernamePassword,
  type SignInWithUsernamePasswordResult,
  type SignUpWithUsernamePasswordResult,
} from '../../src/runtime/convex-auth/vue/methods/username-password'
import type { ConvexAuthState } from '../../src/runtime/vue/auth/index'
import { ConvexClientKey, ConvexVueClient } from '../../src/runtime/vue/client'
import { useQuery } from '../../src/runtime/vue/composables/use-query'
import { silentConnectLogger } from '../helpers/silent-logger'

// The Vue counterparts of upstream's `react/client.test.tsx`,
// `react/index.test.tsx` and `methods/username-password/react.test.tsx`, run
// in the project with no `define`: `nuxt-convex-module/convex-auth/vue` is
// documented to work in a plain Vue app.

// `useSessionWatcher` subscribes through `useQuery`, which needs a live Convex
// client. The suite stubs it and scripts the server's answers per test.
vi.mock('../../src/runtime/vue/composables/use-query', () => ({ useQuery: vi.fn() }))

const NAMESPACE = 'https://happy-animal-123.convex.cloud'
// Matches NamespacedStorage's `replace(/[^a-zA-Z0-9]/g, "")`.
const SUFFIX = 'httpshappyanimal123convexcloud'

const API = {
  refreshSession: makeFunctionReference<'mutation'>('auth:refreshSession'),
  signOut: makeFunctionReference<'mutation'>('auth:signOut'),
  isAuthenticated: makeFunctionReference<'query'>('auth:isAuthenticated'),
} as never

function bundle(n: number): TokenBundle {
  return {
    accessToken: `access-${n}`,
    refreshToken: `refresh-${n}`,
    refreshTokenExpiresAt: 0,
    userId: 'user-1',
  }
}

function makeClient(authApi: Partial<SpaAuthApi> = {}, storage = new InMemoryStorage()) {
  const client = new AuthClient({
    mode: 'spa',
    authApi: {
      refreshSession: async () => ({ kind: 'noSession' as const }),
      signOut: async () => {},
      ...authApi,
    },
    storage,
    storageNamespace: NAMESPACE,
  })
  return { client, storage }
}

/** Upstream's `stubSignInApi`: the mock stands in for the Convex call. */
function stubSignInApi() {
  const run = vi.fn()
  const signInApi = {
    mutation: (_fn: unknown, args: unknown) => run(args),
    action: (_fn: unknown, args: unknown) => run(args),
  } as unknown as AuthSignInApi
  return { signInApi, run }
}

type Auth = ReturnType<typeof provideAuth>

/**
 * Call `provideAuth` in a parent and `useChild` in a component below it, and
 * expose what both return.
 */
function mountAuth<T>(client: AuthClient, useChild: () => T, signInApi = stubSignInApi().signInApi) {
  const result = {} as { auth: Auth, child: T }
  const Child = defineComponent({
    setup() {
      result.child = useChild()
      return () => null
    },
  })
  const wrapper = mount(defineComponent({
    setup() {
      result.auth = provideAuth({ authClient: client, signInApi })
      return () => h(Child)
    },
  }))
  return { result, wrapper }
}

const useAuthValues = () => ({ token: useAuthToken(), actions: useAuthActions() })

const mountBare = <T>(useValue: () => T) => {
  let value!: T
  mount(defineComponent({
    setup() {
      value = useValue()
      return () => null
    },
  }))
  return value
}

afterEach(() => {
  vi.restoreAllMocks()
  vi.mocked(useQuery).mockReset()
})

describe('Vue bindings', () => {
  it('useAuthActions throws when used outside a provider', () => {
    expect(() => mountBare(() => useAuthActions())).toThrow(/useAuthActions must be used below `provideConvexAuth`/)
  })

  it('useAuthSignInApi throws when used outside a provider', () => {
    expect(() => mountBare(() => useAuthSignInApi())).toThrow(/useAuthSignInApi must be used below `provideConvexAuth`/)
  })

  it('useAuthToken returns null when used outside a provider', () => {
    expect(mountBare(() => useAuthToken()).value).toBeNull()
  })

  it('provideAuth initializes the client on mount and disposes on unmount', () => {
    const { client } = makeClient()
    const init = vi.spyOn(client, 'init')
    const dispose = vi.spyOn(client, 'dispose')

    const { wrapper } = mountAuth(client, () => null)
    expect(init).toHaveBeenCalledTimes(1)
    expect(dispose).not.toHaveBeenCalled()

    wrapper.unmount()
    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('reports loading then unauthenticated for an empty store', async () => {
    const { client } = makeClient()
    const { result } = mountAuth(client, useAuthValues)

    expect(result.auth.isLoading()).toBe(true)

    await flushPromises()
    expect(result.auth.isLoading()).toBe(false)
    expect(result.auth.isAuthenticated()).toBe(false)
    expect(result.child.token.value).toBeNull()
  })

  it('hydrates a persisted session and exposes the token', async () => {
    const storage = new InMemoryStorage()
    storage.setItem(`${JWT_STORAGE_KEY}_${SUFFIX}`, 'access-1')
    storage.setItem(`${REFRESH_TOKEN_STORAGE_KEY}_${SUFFIX}`, 'refresh-1')
    const { client } = makeClient({}, storage)

    const { result } = mountAuth(client, useAuthValues)

    await flushPromises()
    expect(result.auth.isAuthenticated()).toBe(true)
    expect(result.auth.isLoading()).toBe(false)
    expect(result.child.token.value).toBe('access-1')
  })

  it('setSession authenticates and updates consumers', async () => {
    const { client } = makeClient()
    const { result } = mountAuth(client, useAuthValues)
    await flushPromises()

    await result.child.actions.setSession(bundle(1))

    expect(result.auth.isAuthenticated()).toBe(true)
    expect(result.child.token.value).toBe('access-1')
  })

  it('fetchAccessToken from the auth state returns the current token', async () => {
    const { client } = makeClient()
    const { result } = mountAuth(client, useAuthValues)
    await flushPromises()
    await result.child.actions.setSession(bundle(1))

    const token = await result.auth.fetchAccessToken({ forceRefreshToken: false })
    expect(token).toBe('access-1')
  })

  it('signOut revokes on the server and clears consumers', async () => {
    const signOut = vi.fn(async (rt: string) => {
      expect(rt).toBe('refresh-1')
    })
    const { client } = makeClient({ signOut })
    const { result } = mountAuth(client, useAuthValues)
    await flushPromises()
    await result.child.actions.setSession(bundle(1))
    expect(result.auth.isAuthenticated()).toBe(true)

    await result.child.actions.signOut()

    expect(signOut).toHaveBeenCalledTimes(1)
    expect(result.auth.isAuthenticated()).toBe(false)
    expect(result.child.token.value).toBeNull()
  })

  it('propagates a cross-tab sign-out after the provider remounts', async () => {
    const storage = new InMemoryStorage()
    const { client } = makeClient({}, storage)

    // Remounting the same client, as an ordinary route change does, disposes
    // then re-inits it. Cross-tab sign-out must still work afterward, which
    // only holds if the re-init re-attaches the window storage listener the
    // dispose removed.
    mountAuth(client, () => null).wrapper.unmount()
    const { result } = mountAuth(client, useAuthValues)
    await flushPromises()
    await result.child.actions.setSession(bundle(1))
    expect(result.auth.isAuthenticated()).toBe(true)

    // Another tab cleared the JWT key: dispatch the storage event to the window
    // listener the re-init should have re-attached.
    window.dispatchEvent(Object.assign(new Event('storage'), {
      storageArea: storage,
      key: `${JWT_STORAGE_KEY}_${SUFFIX}`,
      newValue: null,
    }))
    await flushPromises()

    expect(result.auth.isAuthenticated()).toBe(false)
    expect(result.child.token.value).toBeNull()
  })
})

describe('useSessionWatcher', () => {
  const isAuthenticatedRef = makeFunctionReference<'query'>('auth:isAuthenticated') as never

  /** A client hydrated as signed-in, with a spy on the server sign-out. */
  function makeAuthenticatedClient() {
    const storage = new InMemoryStorage()
    storage.setItem(`${JWT_STORAGE_KEY}_${SUFFIX}`, 'access-1')
    storage.setItem(`${REFRESH_TOKEN_STORAGE_KEY}_${SUFFIX}`, 'refresh-1')
    const signOut = vi.fn(async () => {})
    const { client } = makeClient({ signOut }, storage)
    return { client, signOut }
  }

  /**
   * Script the stubbed `useQuery`: it behaves like the real one, `"skip"`
   * yielding `undefined` and anything else the given server answer. The
   * returned refs are what the backend reports.
   */
  function mountWatcher(client: AuthClient, served: { convexAuthenticated: boolean, hasLiveSession: boolean | undefined }) {
    const convexAuthenticated = ref(served.convexAuthenticated)
    const hasLiveSession = ref(served.hasLiveSession)
    let args!: () => unknown
    vi.mocked(useQuery).mockImplementation(((_ref: unknown, getArgs: () => unknown) => {
      args = getArgs
      return computed(() => getArgs() === 'skip' ? undefined : hasLiveSession.value)
    }) as unknown as typeof useQuery)
    let auth!: Auth
    mount(defineComponent({
      setup() {
        auth = provideAuth({ authClient: client, signInApi: stubSignInApi().signInApi })
        useSessionWatcher(client, isAuthenticatedRef, { isAuthenticated: convexAuthenticated } as unknown as ConvexAuthState)
        return () => null
      },
    }))
    return { auth: () => auth, convexAuthenticated, hasLiveSession, args: () => args() }
  }

  it('signs out when the server reports the session is gone', async () => {
    const { client, signOut } = makeAuthenticatedClient()
    const watcher = mountWatcher(client, { convexAuthenticated: true, hasLiveSession: true })
    await flushPromises()
    expect(watcher.auth().isAuthenticated()).toBe(true)

    // The session is revoked server-side: the subscription's next answer is
    // `false`, which clears the local session.
    watcher.hasLiveSession.value = false
    await flushPromises()

    expect(watcher.auth().isAuthenticated()).toBe(false)
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('stays signed in while the server reports the session live', async () => {
    const { client, signOut } = makeAuthenticatedClient()
    const watcher = mountWatcher(client, { convexAuthenticated: true, hasLiveSession: true })
    await flushPromises()

    expect(vi.mocked(useQuery).mock.calls[0]![0]).toBe(isAuthenticatedRef)
    expect(watcher.args()).toEqual({})
    expect(signOut).not.toHaveBeenCalled()
    expect(watcher.auth().isAuthenticated()).toBe(true)
  })

  it('does not subscribe until the backend accepts the token', async () => {
    // Signed in locally, but the Convex connection has no accepted token (the
    // handshake is pending, or the client gave up on auth). A query run now
    // would see no identity and answer `false` without the session being
    // gone, so the watcher must not ask.
    const { client, signOut } = makeAuthenticatedClient()
    const watcher = mountWatcher(client, { convexAuthenticated: false, hasLiveSession: false })
    await flushPromises()

    expect(watcher.args()).toBe('skip')
    expect(signOut).not.toHaveBeenCalled()
    expect(watcher.auth().isAuthenticated()).toBe(true)
  })

  it('stops subscribing when the backend drops the token', async () => {
    const { client, signOut } = makeAuthenticatedClient()
    const watcher = mountWatcher(client, { convexAuthenticated: true, hasLiveSession: true })
    await flushPromises()

    // The Convex client cleared its auth (say, a refresh failed on the
    // network): the gate closes, so the no-identity re-run is never read.
    watcher.convexAuthenticated.value = false
    watcher.hasLiveSession.value = false
    await flushPromises()

    expect(watcher.args()).toBe('skip')
    expect(signOut).not.toHaveBeenCalled()
    expect(watcher.auth().isAuthenticated()).toBe(true)
  })
})

describe('provideConvexAuth ambient sign-ins', () => {
  /**
   * A real Convex client against a fake deployment URL. Nothing here
   * authenticates or subscribes, so it never opens a connection.
   */
  const makeConvexClient = () => new ConvexVueClient(NAMESPACE, { logger: silentConnectLogger })

  function mountProvider(options: Partial<Parameters<typeof provideConvexAuth>[0]>, useChild: () => unknown = () => null) {
    vi.mocked(useQuery).mockReturnValue({ value: undefined } as ComputedRef<undefined>)
    const client = options.client ?? makeConvexClient()
    const Child = defineComponent({
      setup() {
        useChild()
        return () => null
      },
    })
    return mount(defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        return () => h(ConvexAuthProvider, { api: API, ...options }, { default: () => h(Child) })
      },
    }))
  }

  it('onInit runs once per client', async () => {
    const onInit = vi.fn()
    mountProvider({ ambientSignIns: [{ id: 'probe', setup: () => ({ onInit }) }] })
    await flushPromises()
    expect(onInit).toHaveBeenCalledTimes(1)
  })

  it('setups and composables receive the same sign-in api', () => {
    const fromSetup: AuthSignInApi[] = []
    const fromComposable: AuthSignInApi[] = []
    mountProvider(
      {
        ambientSignIns: [{
          id: 'probe',
          setup: (ctx) => {
            fromSetup.push(ctx.signInApi)
          },
        }],
      },
      () => fromComposable.push(useAuthSignInApi()),
    )
    expect(fromComposable[0]).toBe(fromSetup[0])
  })

  it('the sign-in api routes through the Convex client', async () => {
    const client = makeConvexClient()
    const mutationSpy = vi.spyOn(client, 'mutation').mockResolvedValue('result' as never)
    const signIn = makeFunctionReference<'mutation'>('auth:signInProbe') as never
    const captured: AuthSignInApi[] = []
    mountProvider({ client }, () => captured.push(useAuthSignInApi()))

    await expect(captured[0]!.mutation(signIn, {} as never)).resolves.toBe('result')
    expect(mutationSpy).toHaveBeenCalledWith(signIn, {})
  })

  it('defaults to the injected Convex client', async () => {
    const client = makeConvexClient()
    const mutationSpy = vi.spyOn(client, 'mutation').mockResolvedValue('result' as never)
    const captured: AuthSignInApi[] = []
    vi.mocked(useQuery).mockReturnValue({ value: undefined } as ComputedRef<undefined>)
    const Child = defineComponent({
      setup() {
        captured.push(useAuthSignInApi())
        return () => null
      },
    })
    mount(defineComponent({
      setup() {
        provide(ConvexClientKey, client)
        return () => h(defineComponent({
          setup() {
            provideConvexAuth({ api: API })
            return () => h(Child)
          },
        }))
      },
    }))

    await captured[0]!.mutation(makeFunctionReference<'mutation'>('auth:signInProbe') as never, {} as never)
    expect(mutationSpy).toHaveBeenCalledTimes(1)
  })

  it('oauth() is registered when no ambient sign-ins are given', async () => {
    // The default OAuth client reads its callback params on init and strips
    // them from the URL, so a stripped URL shows it was registered.
    const replaceState = vi.spyOn(window.history, 'replaceState')
    window.location.href = 'https://app.test/?convexAuthError=access_denied&keep=1'
    mountProvider({})
    await flushPromises()
    expect(replaceState).toHaveBeenCalledWith(window.history.state, '', 'https://app.test/?keep=1')
  })
})

type Result = SignInWithUsernamePasswordResult | SignUpWithUsernamePasswordResult
const credentials = { username: 'alice', password: 'hunter2' }
const authApi = anyApi.auth as never

describe.each([
  {
    name: 'useSignInWithUsernamePassword',
    useFlow: () => {
      const { signIn, pending } = useSignInWithUsernamePassword(authApi)
      return { run: signIn as (c: typeof credentials) => Promise<Result>, pending }
    },
  },
  {
    name: 'useSignUpWithUsernamePassword',
    useFlow: () => {
      const { signUp, pending } = useSignUpWithUsernamePassword(authApi)
      return { run: signUp as (c: typeof credentials) => Promise<Result>, pending }
    },
  },
])('$name', ({ useFlow }) => {
  async function mountFlow() {
    const { signInApi, run: runMutation } = stubSignInApi()
    const { result } = mountAuth(makeClient().client, () => ({ token: useAuthToken(), flow: useFlow() }), signInApi)
    await flushPromises()
    expect(result.auth.isLoading()).toBe(false)
    return { result, runMutation }
  }

  it('success adopts the session and returns the result', async () => {
    const { result, runMutation } = await mountFlow()
    runMutation.mockResolvedValue({ status: 'complete', tokens: bundle(1) })
    expect(result.auth.isAuthenticated()).toBe(false)

    const returned = await result.child.flow.run(credentials)

    expect(runMutation).toHaveBeenCalledWith(credentials)
    expect(returned).toEqual({ status: 'complete', tokens: bundle(1) })
    expect(result.auth.isAuthenticated()).toBe(true)
    expect(result.child.token.value).toBe('access-1')
  })

  it('user error is returned without adopting a session', async () => {
    const failure = { status: 'error', userError: { error: 'USER_NOT_FOUND' } }
    const { result, runMutation } = await mountFlow()
    runMutation.mockResolvedValue(failure)

    const returned = await result.child.flow.run(credentials)

    expect(returned).toEqual(failure)
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('thrown mutation folds into OTHER_ERROR preserving cause', async () => {
    const cause = new Error('network blip')
    const { result, runMutation } = await mountFlow()
    runMutation.mockRejectedValue(cause)

    const returned = await result.child.flow.run(credentials)

    expect(returned).toEqual({ status: 'error', userError: { error: 'OTHER_ERROR', cause } })
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('pending is true while in flight and false after', async () => {
    let resolveMutation!: (value: unknown) => void
    const { result, runMutation } = await mountFlow()
    runMutation.mockReturnValue(new Promise((resolve) => {
      resolveMutation = resolve
    }))
    expect(result.child.flow.pending.value).toBe(false)

    const pending = result.child.flow.run(credentials)
    await nextTick()
    expect(result.child.flow.pending.value).toBe(true)

    resolveMutation({ status: 'complete', tokens: bundle(1) })
    await pending
    expect(result.child.flow.pending.value).toBe(false)
  })

  it('pending resets to false when the mutation throws', async () => {
    const { result, runMutation } = await mountFlow()
    runMutation.mockRejectedValue(new Error('boom'))

    await result.child.flow.run(credentials)
    expect(result.child.flow.pending.value).toBe(false)
  })
})
