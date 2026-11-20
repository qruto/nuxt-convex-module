import type { TokenBundle } from '@convex-dev/auth'
import { AuthClient, InMemoryStorage, type TokenStorage } from '@convex-dev/auth/browser'
import { flushPromises, mount } from '@vue/test-utils'
import { makeFunctionReference } from 'convex/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, provide, ref, watchSyncEffect } from 'vue'
import { provideAuth, type AuthSignInApi } from '../../src/runtime/convex-auth/vue/client'
import {
  useSendEmailMagicLink,
  useSignInWithEmailMagicLink,
} from '../../src/runtime/convex-auth/vue/methods/email-magic-link'
import { ConvexClientKey, ConvexVueClient } from '../../src/runtime/vue/client'
import { silentConnectLogger } from '../helpers/silent-logger'

// The Vue counterpart of upstream's `methods/email-magic-link/react.test.tsx`,
// scenario for scenario, in the project with no `define`. Upstream's
// "sendMagicLink keeps its identity across rerenders" has no counterpart: a
// composable's `setup` runs once.

// The composable that mints a session runs its mutation through the injected
// `AuthSignInApi`, so the test substitutes one.
const runSignInMutation = vi.fn()
const signInApi = {
  mutation: (_fn: unknown, args: unknown) => runSignInMutation(args),
  action: (_fn: unknown, args: unknown) => runSignInMutation(args),
} as unknown as AuthSignInApi

const NAMESPACE = 'https://happy-animal-123.convex.cloud'
// Matches NamespacedStorage's `replace(/[^a-zA-Z0-9]/g, "")`.
const SUFFIX = 'httpshappyanimal123convexcloud'

// The composable that does not mint a session runs its mutation through this
// client. It never connects: the tests stub its `mutation` method.
const convexClient = new ConvexVueClient(NAMESPACE, { logger: silentConnectLogger })
const stubConvexMutation = () => vi.spyOn(convexClient, 'mutation')

// The composables keep the secret in the storage passed to the auth
// provider, namespaced like the session tokens.
let storage: InMemoryStorage
const SECRET_KEY = '__convexAuthEmailMagicLinkSecret'
const secretStorage = {
  get: (backing = storage) => backing.getItem(`${SECRET_KEY}_${SUFFIX}`),
  set: (value: string) => storage.setItem(`${SECRET_KEY}_${SUFFIX}`, value),
}

const bundle: TokenBundle = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  refreshTokenExpiresAt: 0,
  userId: 'user-1',
}

const signInMutation = makeFunctionReference<'mutation'>('auth:signIn') as never
const sendMutation = makeFunctionReference<'mutation'>('auth:send') as never

function mountWithProviders<T>(
  useComposable: () => T,
  tokenStorage: TokenStorage = storage,
  // Set to `false` to keep the composable's component out until later.
  shown = ref(true),
) {
  const authClient = new AuthClient({
    mode: 'spa',
    authApi: {
      refreshSession: async () => ({ kind: 'noSession' as const }),
      signOut: async () => {},
    },
    storage: tokenStorage,
    storageNamespace: NAMESPACE,
  })
  const result = {} as { auth: ReturnType<typeof provideAuth>, composable: T }
  const Child = defineComponent({
    setup() {
      result.composable = useComposable()
      return () => null
    },
  })
  const wrapper = mount(defineComponent({
    setup() {
      provide(ConvexClientKey, convexClient)
      result.auth = provideAuth({ authClient, signInApi })
      return () => (shown.value ? h(Child) : null)
    },
  }))
  return { result, wrapper }
}

/** A storage whose read of the `secretKey` secret waits for `release()`. */
function holdSecretRead(secretKey: string) {
  let release!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  const readSecret = vi.fn()
  const tokenStorage: TokenStorage = {
    getItem: async (key: string) => {
      if (key.startsWith(secretKey)) {
        readSecret()
        await held
      }
      return storage.getItem(key)
    },
    setItem: async (key: string, value: string) => storage.setItem(key, value),
    removeItem: async (key: string) => storage.removeItem(key),
  }
  return { tokenStorage, release, readSecret }
}

/**
 * Record the auth state from the moment the sign-in mutation is called, and
 * answer it with a session.
 */
function recordAuthStateFromMutation(auth: () => ReturnType<typeof provideAuth>) {
  const seen: string[] = []
  let stop = () => {}
  runSignInMutation.mockImplementation(async () => {
    stop = watchSyncEffect(() => {
      seen.push(`${auth().isLoading() ? 'loading' : 'loaded'}, ${auth().isAuthenticated() ? 'signed in' : 'signed out'}`)
    })
    return { status: 'complete', tokens: bundle }
  })
  return { seen, stop: () => stop() }
}

/** Mount, and wait for the auth client to load. */
async function mountLoaded<T>(useComposable: () => T) {
  const mounted = mountWithProviders(useComposable)
  await flushPromises()
  expect(mounted.result.auth.isLoading()).toBe(false)
  return mounted.result
}

beforeEach(() => {
  storage = new InMemoryStorage()
})

afterEach(() => {
  vi.restoreAllMocks()
  runSignInMutation.mockReset()
})

describe('useSendEmailMagicLink', () => {
  const args = { email: 'alice@example.com' }
  const use = () => useSendEmailMagicLink({ sendEmailMagicLink: sendMutation })

  it('success stores the secret and does not sign in', async () => {
    const mutation = stubConvexMutation().mockResolvedValue({
      success: true,
      browserSecret: 'secret-1',
    } as never)
    const result = await mountLoaded(use)

    const returned = await result.composable.sendMagicLink(args)

    // Sending the link mints no session, so it goes straight to Convex: under
    // cookie sessions the signInApi is the auth proxy, which refuses a
    // non-envelope result.
    expect(mutation.mock.calls[0]?.[1]).toEqual(args)
    expect(runSignInMutation).not.toHaveBeenCalled()
    // The secret stays out of the result: the composable keeps it for the
    // landing page.
    expect(returned).toEqual({ success: true })
    expect(secretStorage.get()).toBe('secret-1')
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('a second link replaces the secret of the first', async () => {
    stubConvexMutation()
      .mockResolvedValueOnce({ success: true, browserSecret: 'secret-1' } as never)
      .mockResolvedValueOnce({ success: true, browserSecret: 'secret-2' } as never)
    const result = await mountLoaded(use)

    await result.composable.sendMagicLink(args)
    await result.composable.sendMagicLink(args)

    expect(secretStorage.get()).toBe('secret-2')
  })

  it('a user error stores nothing', async () => {
    const failure = {
      success: false,
      userError: { error: 'RATE_LIMITED', retryAfterMs: 1000 },
    }
    stubConvexMutation().mockResolvedValue(failure as never)
    const result = await mountLoaded(use)

    const returned = await result.composable.sendMagicLink(args)

    expect(returned).toEqual(failure)
    expect(secretStorage.get()).toBeNull()
  })

  it('a thrown mutation folds into OTHER_ERROR preserving cause', async () => {
    const cause = new Error('network blip')
    stubConvexMutation().mockRejectedValue(cause)
    const result = await mountLoaded(use)

    const returned = await result.composable.sendMagicLink(args)

    expect(returned).toEqual({
      success: false,
      userError: { error: 'OTHER_ERROR', cause },
    })
    expect(result.composable.pending.value).toBe(false)
  })

  it('stays pending until the last overlapping call ends', async () => {
    const resolvers: Array<(value: unknown) => void> = []
    stubConvexMutation().mockImplementation(
      () => new Promise(resolve => resolvers.push(resolve)) as never,
    )
    const result = await mountLoaded(use)
    expect(result.composable.pending.value).toBe(false)

    const first = result.composable.sendMagicLink(args)
    const second = result.composable.sendMagicLink(args)
    expect(result.composable.pending.value).toBe(true)

    resolvers[0]!({ success: true, browserSecret: 'secret-1' })
    await first
    expect(result.composable.pending.value).toBe(true)

    resolvers[1]!({ success: true, browserSecret: 'secret-2' })
    await second
    expect(result.composable.pending.value).toBe(false)
  })

  it('needs an auth provider above it', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const Child = defineComponent({
      setup() {
        use()
        return () => null
      },
    })
    expect(() => mount(defineComponent({
      setup() {
        provide(ConvexClientKey, convexClient)
        return () => h(Child)
      },
    }))).toThrow('Must be used below `provideConvexAuth`')
  })
})

describe('useSignInWithEmailMagicLink', () => {
  const use = (emailCode: string | (() => string) = 'code-1') => () =>
    useSignInWithEmailMagicLink(
      { signInWithEmailMagicLink: signInMutation },
      { emailCode },
    )

  it('presents the link once as the page opens, adopts the session, clears the secret', async () => {
    secretStorage.set('secret-1')
    runSignInMutation.mockResolvedValue({ status: 'complete', tokens: bundle })
    const { result } = mountWithProviders(use())
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))

    // The mutation received the code from the link plus the stored secret.
    expect(runSignInMutation).toHaveBeenCalledTimes(1)
    expect(runSignInMutation).toHaveBeenCalledWith({
      emailCode: 'code-1',
      browserSecret: 'secret-1',
    })
    expect(result.auth.isAuthenticated()).toBe(true)
    // The secret is cleared once it has served its purpose.
    expect(secretStorage.get()).toBeNull()
  })

  // Upstream's "when the effect runs again": here, when the code changes
  // while the first presentation is in flight.
  it('presents the link once when the code changes', async () => {
    secretStorage.set('secret-1')
    // Keep the mutation in flight, so the secret is still stored when the
    // code changes.
    let resolveMutation!: (value: unknown) => void
    runSignInMutation.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve
      }),
    )
    const emailCode = ref('code-1')
    const { result } = mountWithProviders(use(() => emailCode.value))
    await vi.waitFor(() => expect(runSignInMutation).toHaveBeenCalledTimes(1))

    emailCode.value = 'code-2'
    await nextTick()
    resolveMutation({ status: 'complete', tokens: bundle })
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))

    expect(runSignInMutation).toHaveBeenCalledTimes(1)
    expect(runSignInMutation).toHaveBeenCalledWith({
      emailCode: 'code-1',
      browserSecret: 'secret-1',
    })
  })

  // Upstream's effect presents the code of the render it started in. Here the
  // code is a getter, so it must be read before the secret, not after.
  it('presents the code the page opened with when it changes while the secret is read', async () => {
    secretStorage.set('secret-1')
    // Hold the read of the secret, so the code changes before the mutation
    // starts.
    const { tokenStorage, release: releaseSecret, readSecret } = holdSecretRead(SECRET_KEY)
    runSignInMutation.mockResolvedValue({ status: 'complete', tokens: bundle })
    const emailCode = ref('code-1')
    const { result } = mountWithProviders(use(() => emailCode.value), tokenStorage)
    await vi.waitFor(() => expect(readSecret).toHaveBeenCalledTimes(1))
    expect(runSignInMutation).not.toHaveBeenCalled()

    emailCode.value = 'code-2'
    await nextTick()
    releaseSecret()
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))

    expect(runSignInMutation).toHaveBeenCalledTimes(1)
    expect(runSignInMutation).toHaveBeenCalledWith({
      emailCode: 'code-1',
      browserSecret: 'secret-1',
    })
  })

  // A React effect always runs on mount. Here the watcher must also run for a
  // page that opens after the auth client has loaded, as on a client-side
  // navigation.
  it('presents the link on a page that opens after the auth client has loaded', async () => {
    secretStorage.set('secret-1')
    runSignInMutation.mockResolvedValue({ status: 'complete', tokens: bundle })
    const shown = ref(false)
    const { result } = mountWithProviders(use(), storage, shown)
    await flushPromises()
    expect(result.auth.isLoading()).toBe(false)

    shown.value = true
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))
    expect(runSignInMutation).toHaveBeenCalledTimes(1)
  })

  it('reports isLoading while the link is checked', async () => {
    secretStorage.set('secret-1')
    let resolveMutation!: (value: unknown) => void
    runSignInMutation.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve
      }),
    )
    const { result } = mountWithProviders(use())
    await vi.waitFor(() => expect(runSignInMutation).toHaveBeenCalledTimes(1))

    // The app does not see a signed-out user while the mutation runs.
    expect(result.composable.value).toEqual({ status: 'loading' })
    expect([result.auth.isLoading(), result.auth.isAuthenticated()]).toEqual([true, false])

    resolveMutation({ status: 'complete', tokens: bundle })
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))
    expect([result.auth.isLoading(), result.auth.isAuthenticated()]).toEqual([false, true])
  })

  // The `convex-auth` middleware decides on this state: a signed-out user
  // between the server's answer and the stored session would go to the
  // sign-in page.
  it('shows no signed-out user between the server\'s answer and the stored session', async () => {
    secretStorage.set('secret-1')
    const { result } = mountWithProviders(use())
    const { seen, stop } = recordAuthStateFromMutation(() => result.auth)
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))
    stop()

    expect(seen[0]).toBe('loading, signed out')
    expect(seen.at(-1)).toBe('loaded, signed in')
    expect(seen).not.toContain('loaded, signed out')
  })

  it('is MISSING_SECRET when this browser did not ask for the link', async () => {
    const { result } = mountWithProviders(use())
    await vi.waitFor(() =>
      expect(result.composable.value).toEqual({
        status: 'error',
        userError: { error: 'MISSING_SECRET' },
      }),
    )

    // The backend was never called: there was nothing to present.
    expect(runSignInMutation).not.toHaveBeenCalled()
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('keeps the secret when the sign-in fails', async () => {
    secretStorage.set('secret-1')
    runSignInMutation.mockResolvedValue({
      status: 'error',
      userError: { error: 'INCORRECT_CODE' },
    })
    const { result } = mountWithProviders(use())
    await vi.waitFor(() =>
      expect(result.composable.value).toEqual({
        status: 'error',
        userError: { error: 'INCORRECT_CODE' },
      }),
    )

    // The person may have opened an older link: the newest one still works.
    expect(secretStorage.get()).toBe('secret-1')
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('a thrown mutation becomes an OTHER_ERROR state preserving cause', async () => {
    secretStorage.set('secret-1')
    const cause = new Error('network blip')
    runSignInMutation.mockRejectedValue(cause)
    const { result } = mountWithProviders(use())
    await vi.waitFor(() =>
      expect(result.composable.value).toEqual({
        status: 'error',
        userError: { error: 'OTHER_ERROR', cause },
      }),
    )
  })

  it('a code getter that throws becomes an OTHER_ERROR state preserving cause', async () => {
    secretStorage.set('secret-1')
    const cause = new Error('the link has no code')
    const { result } = mountWithProviders(use(() => {
      throw cause
    }))
    await vi.waitFor(() =>
      expect(result.composable.value).toEqual({
        status: 'error',
        userError: { error: 'OTHER_ERROR', cause },
      }),
    )

    expect(runSignInMutation).not.toHaveBeenCalled()
  })
})

// Upstream's "without localStorage (React Native)". Here the provider's
// storage is asynchronous as well, as a React Native store is.
describe('with an asynchronous storage', () => {
  it('the secret stays in the provider\'s storage, and a later page signs in with it', async () => {
    const backing = new InMemoryStorage()
    // Every call ends on a later task, so a write the composable does not
    // wait for is not there yet when it reports.
    const later = () => new Promise(resolve => setTimeout(resolve, 5))
    const tokenStorage: TokenStorage = {
      getItem: async (key: string) => later().then(() => backing.getItem(key)),
      setItem: async (key: string, value: string) => later().then(() => backing.setItem(key, value)),
      removeItem: async (key: string) => later().then(() => backing.removeItem(key)),
    }
    stubConvexMutation().mockResolvedValue({
      success: true,
      browserSecret: 'secret-1',
    } as never)

    const send = mountWithProviders(
      () => useSendEmailMagicLink({ sendEmailMagicLink: sendMutation }),
      tokenStorage,
    )
    await vi.waitFor(() => expect(send.result.auth.isLoading()).toBe(false))
    await send.result.composable.sendMagicLink({ email: 'alice@example.com' })
    expect(secretStorage.get(backing)).toBe('secret-1')
    send.wrapper.unmount()

    runSignInMutation.mockResolvedValue({ status: 'complete', tokens: bundle })
    const { result } = mountWithProviders(
      () =>
        useSignInWithEmailMagicLink(
          { signInWithEmailMagicLink: signInMutation },
          { emailCode: 'code-1' },
        ),
      tokenStorage,
    )
    // The secret is gone by the time the page reports the sign-in complete.
    let secretAtComplete: string | null | undefined
    watchSyncEffect(() => {
      if (result.composable.value.status === 'complete') {
        secretAtComplete = secretStorage.get(backing)
      }
    })
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))
    expect(runSignInMutation).toHaveBeenCalledWith({
      emailCode: 'code-1',
      browserSecret: 'secret-1',
    })
    expect(secretAtComplete).toBeNull()
  })
})
