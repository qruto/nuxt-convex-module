import type { TokenBundle } from '@convex-dev/auth'
import { AuthClient, InMemoryStorage, type TokenStorage } from '@convex-dev/auth/browser'
import { flushPromises, mount } from '@vue/test-utils'
import { makeFunctionReference } from 'convex/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, provide, ref } from 'vue'
import { provideAuth, type AuthSignInApi } from '../../src/runtime/convex-auth/vue/client'
import {
  useCompleteChangeEmail,
  useCompletePasswordRecovery,
  useCompleteSignUpWithEmailPassword,
  useSignInWithEmailPassword,
  useSignUpWithEmailPassword,
  useStartChangeEmail,
  useStartPasswordRecovery,
} from '../../src/runtime/convex-auth/vue/methods/email-password'
import { ConvexClientKey, ConvexVueClient } from '../../src/runtime/vue/client'
import { silentConnectLogger } from '../helpers/silent-logger'

// The Vue counterpart of upstream's `methods/email-password/react.test.tsx`,
// scenario for scenario, in the project with no `define`.

// The composables that mint a session run their mutation through the injected
// `AuthSignInApi`, so the test substitutes one.
const runSignInMutation = vi.fn()
const signInApi = {
  mutation: (_fn: unknown, args: unknown) => runSignInMutation(args),
  action: (_fn: unknown, args: unknown) => runSignInMutation(args),
} as unknown as AuthSignInApi

const NAMESPACE = 'https://happy-animal-123.convex.cloud'
// Matches NamespacedStorage's `replace(/[^a-zA-Z0-9]/g, "")`.
const SUFFIX = 'httpshappyanimal123convexcloud'

// The composables that do not mint a session run their mutation through this
// client. It never connects: the tests stub its `mutation` method, and the
// one composable that subscribes gets a stubbed `watchQuery`.
const convexClient = new ConvexVueClient(NAMESPACE, { logger: silentConnectLogger })
const stubConvexMutation = () => vi.spyOn(convexClient, 'mutation')

// The composables keep flow secrets in the storage passed to the auth
// provider, namespaced like the session tokens.
let storage: InMemoryStorage
const SIGN_UP_SECRET_KEY = '__convexAuthEmailPasswordSignUpSecret'
const CHANGE_EMAIL_SECRET_KEY = '__convexAuthEmailPasswordChangeEmailSecret'
const RECOVERY_SECRET_KEY = '__convexAuthEmailPasswordRecoverySecret'
const secretStorage = {
  get: (key: string, backing = storage) => backing.getItem(`${key}_${SUFFIX}`),
  set: (key: string, value: string) => storage.setItem(`${key}_${SUFFIX}`, value),
}

const bundle: TokenBundle = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  refreshTokenExpiresAt: 0,
  userId: 'user-1',
}

const signInMutation = makeFunctionReference<'mutation'>('auth:signIn') as never
const convexMutation = makeFunctionReference<'mutation'>('auth:flow') as never
const convexQuery = makeFunctionReference<'query'>('auth:check') as never

// A stand-in for the subscription of a query: the composable that subscribes
// goes through `convexClient.watchQuery`. `emit` gives the subscription a new
// result, or an `Error` when the query fails.
function stubConvexQuery() {
  const listeners = new Set<() => void>()
  let result: unknown = undefined
  const watch = vi.spyOn(convexClient, 'watchQuery').mockImplementation(
    () =>
      ({
        onUpdate: (callback: () => void) => {
          listeners.add(callback)
          return () => listeners.delete(callback)
        },
        localQueryResult: () => {
          if (result instanceof Error) throw result
          return result
        },
        journal: () => undefined,
      }) as never,
  )
  return {
    watch,
    emit: async (next: unknown) => {
      result = next
      for (const listener of listeners) listener()
      await flushPromises()
    },
  }
}

function mountWithProviders<T>(useComposable: () => T, tokenStorage: TokenStorage = storage) {
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
      return () => h(Child)
    },
  }))
  return { result, wrapper }
}

/** Mount, and wait for the auth client to load. */
async function mountLoaded<T>(useComposable: () => T) {
  const mounted = mountWithProviders(useComposable)
  await flushPromises()
  expect(mounted.result.auth.isLoading()).toBe(false)
  return mounted.result
}

/**
 * A storage that holds the read of one secret until `release` is called, so
 * that a test can change the code of the link while the read is pending.
 */
function holdSecretRead(secretKey: string) {
  let release!: () => void
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  const read = vi.fn()
  const tokenStorage: TokenStorage = {
    getItem: async (key: string) => {
      if (key.startsWith(secretKey)) {
        read()
        await held
      }
      return storage.getItem(key)
    },
    setItem: async (key: string, value: string) => storage.setItem(key, value),
    removeItem: async (key: string) => storage.removeItem(key),
  }
  return { tokenStorage, read, release }
}

beforeEach(() => {
  storage = new InMemoryStorage()
})

afterEach(() => {
  vi.restoreAllMocks()
  runSignInMutation.mockReset()
})

describe('useSignInWithEmailPassword', () => {
  const credentials = {
    email: 'alice@example.com',
    password: 'correct horse battery staple',
  }
  const use = () => useSignInWithEmailPassword({ signInWithEmailPassword: signInMutation })

  it('adopts the minted session', async () => {
    runSignInMutation.mockResolvedValue({ status: 'complete', tokens: bundle })
    const result = await mountLoaded(use)

    const returned = await result.composable.signIn(credentials)

    expect(runSignInMutation).toHaveBeenCalledWith(credentials)
    expect(returned).toEqual({ status: 'complete', tokens: bundle })
    expect(result.auth.isAuthenticated()).toBe(true)
  })

  it('returns a user error without a session', async () => {
    const failure = {
      status: 'error',
      userError: { error: 'INVALID_CREDENTIALS' },
    }
    runSignInMutation.mockResolvedValue(failure)
    const result = await mountLoaded(use)

    const returned = await result.composable.signIn(credentials)

    expect(returned).toEqual(failure)
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('a thrown mutation folds into OTHER_ERROR preserving cause', async () => {
    const cause = new Error('network blip')
    runSignInMutation.mockRejectedValue(cause)
    const result = await mountLoaded(use)

    const returned = await result.composable.signIn(credentials)

    expect(returned).toEqual({
      status: 'error',
      userError: { error: 'OTHER_ERROR', cause },
    })
    expect(result.composable.pending.value).toBe(false)
  })

  it('stays pending until the last overlapping call ends', async () => {
    const failure = {
      status: 'error',
      userError: { error: 'INVALID_CREDENTIALS' },
    }
    const resolvers: Array<(value: unknown) => void> = []
    runSignInMutation.mockImplementation(
      () => new Promise(resolve => resolvers.push(resolve)),
    )
    const result = await mountLoaded(use)

    const first = result.composable.signIn(credentials)
    const second = result.composable.signIn(credentials)
    expect(result.composable.pending.value).toBe(true)

    resolvers[0]!(failure)
    await first
    expect(result.composable.pending.value).toBe(true)

    resolvers[1]!(failure)
    await second
    expect(result.composable.pending.value).toBe(false)
  })
})

describe('useSignUpWithEmailPassword', () => {
  const credentials = {
    email: 'alice@example.com',
    password: 'correct horse battery staple',
  }
  const use = () => useSignUpWithEmailPassword({ signUpWithEmailPassword: convexMutation })

  it('success stores the secret and does not sign in', async () => {
    const mutation = stubConvexMutation().mockResolvedValue({
      success: true,
      browserSecret: 'secret-1',
    } as never)
    const result = await mountLoaded(use)

    const returned = await result.composable.signUp(credentials)

    expect(mutation.mock.calls[0]?.[1]).toEqual(credentials)
    expect(runSignInMutation).not.toHaveBeenCalled()
    expect(returned).toEqual({ success: true })
    expect(secretStorage.get(SIGN_UP_SECRET_KEY)).toBe('secret-1')
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('a user error stores nothing', async () => {
    const failure = { success: false, userError: { error: 'EMAIL_TAKEN' } }
    stubConvexMutation().mockResolvedValue(failure as never)
    const result = await mountLoaded(use)

    const returned = await result.composable.signUp(credentials)

    expect(returned).toEqual(failure)
    expect(secretStorage.get(SIGN_UP_SECRET_KEY)).toBeNull()
  })

  it('a thrown mutation folds into OTHER_ERROR preserving cause', async () => {
    const cause = new Error('network blip')
    stubConvexMutation().mockRejectedValue(cause)
    const result = await mountLoaded(use)

    const returned = await result.composable.signUp(credentials)

    expect(returned).toEqual({
      success: false,
      userError: { error: 'OTHER_ERROR', cause },
    })
    expect(result.composable.pending.value).toBe(false)
  })
})

describe('useCompleteSignUpWithEmailPassword', () => {
  const use = (emailCode: string | (() => string) = 'code-1') => () =>
    useCompleteSignUpWithEmailPassword(
      { completeSignUpWithEmailPassword: signInMutation },
      { emailCode },
    )

  it('presents the link once as the page opens, adopts the session, clears the secret', async () => {
    secretStorage.set(SIGN_UP_SECRET_KEY, 'secret-1')
    runSignInMutation.mockResolvedValue({ status: 'complete', tokens: bundle })
    const { result } = mountWithProviders(use())
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))

    expect(runSignInMutation).toHaveBeenCalledTimes(1)
    expect(runSignInMutation).toHaveBeenCalledWith({
      emailCode: 'code-1',
      browserSecret: 'secret-1',
    })
    expect(result.auth.isAuthenticated()).toBe(true)
    expect(secretStorage.get(SIGN_UP_SECRET_KEY)).toBeNull()
  })

  // Upstream's "when the effect runs again": here, when the code changes
  // while the first presentation is in flight.
  it('presents the link once when the code changes', async () => {
    secretStorage.set(SIGN_UP_SECRET_KEY, 'secret-1')
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
    secretStorage.set(SIGN_UP_SECRET_KEY, 'secret-1')
    const secret = holdSecretRead(SIGN_UP_SECRET_KEY)
    runSignInMutation.mockResolvedValue({ status: 'complete', tokens: bundle })
    const emailCode = ref('code-1')
    const { result } = mountWithProviders(use(() => emailCode.value), secret.tokenStorage)
    await vi.waitFor(() => expect(secret.read).toHaveBeenCalledTimes(1))
    expect(runSignInMutation).not.toHaveBeenCalled()

    emailCode.value = 'code-2'
    await nextTick()
    secret.release()
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))

    expect(runSignInMutation).toHaveBeenCalledTimes(1)
    expect(runSignInMutation).toHaveBeenCalledWith({
      emailCode: 'code-1',
      browserSecret: 'secret-1',
    })
  })

  it('reports isLoading while the link is validated', async () => {
    secretStorage.set(SIGN_UP_SECRET_KEY, 'secret-1')
    let resolveMutation!: (value: unknown) => void
    runSignInMutation.mockReturnValue(
      new Promise((resolve) => {
        resolveMutation = resolve
      }),
    )
    const { result } = mountWithProviders(use())
    await vi.waitFor(() => expect(runSignInMutation).toHaveBeenCalledTimes(1))

    expect([result.auth.isLoading(), result.auth.isAuthenticated()]).toEqual([true, false])

    resolveMutation({ status: 'complete', tokens: bundle })
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))
    expect([result.auth.isLoading(), result.auth.isAuthenticated()]).toEqual([false, true])
  })

  it('is MISSING_SECRET when this browser did not start the flow', async () => {
    const { result } = mountWithProviders(use())
    await vi.waitFor(() =>
      expect(result.composable.value).toEqual({
        status: 'error',
        userError: { error: 'MISSING_SECRET' },
      }),
    )

    expect(runSignInMutation).not.toHaveBeenCalled()
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('keeps the secret when the completion fails', async () => {
    secretStorage.set(SIGN_UP_SECRET_KEY, 'secret-1')
    runSignInMutation.mockResolvedValue({
      status: 'error',
      userError: { error: 'INVALID_CHALLENGE' },
    })
    const { result } = mountWithProviders(use())
    await vi.waitFor(() =>
      expect(result.composable.value).toEqual({
        status: 'error',
        userError: { error: 'INVALID_CHALLENGE' },
      }),
    )

    expect(secretStorage.get(SIGN_UP_SECRET_KEY)).toBe('secret-1')
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('a thrown mutation becomes an OTHER_ERROR state preserving cause', async () => {
    secretStorage.set(SIGN_UP_SECRET_KEY, 'secret-1')
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
})

describe('useStartPasswordRecovery', () => {
  const use = () => useStartPasswordRecovery({ startPasswordRecovery: convexMutation })

  it('success stores the secret', async () => {
    const mutation = stubConvexMutation().mockResolvedValue({
      success: true,
      browserSecret: 'secret-9',
      sentTo: 'Alice@example.com',
    } as never)
    const { result } = mountWithProviders(use)

    const returned = await result.composable.startPasswordRecovery({ email: 'alice@example.com' })

    expect(mutation.mock.calls[0]?.[1]).toEqual({ email: 'alice@example.com' })
    expect(returned).toEqual({ success: true, sentTo: 'Alice@example.com' })
    expect(secretStorage.get(RECOVERY_SECRET_KEY)).toBe('secret-9')
  })

  it('a thrown mutation folds into OTHER_ERROR preserving cause', async () => {
    const cause = new Error('network blip')
    stubConvexMutation().mockRejectedValue(cause)
    const { result } = mountWithProviders(use)

    const returned = await result.composable.startPasswordRecovery({ email: 'alice@example.com' })

    expect(returned).toEqual({
      success: false,
      userError: { error: 'OTHER_ERROR', cause },
    })
    expect(secretStorage.get(RECOVERY_SECRET_KEY)).toBeNull()
  })
})

describe('useCompletePasswordRecovery', () => {
  const recoveryApi = {
    checkPasswordRecovery: convexQuery,
    completePasswordRecovery: signInMutation,
  }
  const checkPassed = { success: true }
  const linkDead = {
    success: false,
    userError: { error: 'INVALID_CHALLENGE' },
  }
  const use = () => useCompletePasswordRecovery(recoveryApi, { emailCode: 'code-9' })

  /** Mount with a stored secret and a passing check: the `ready` state. */
  async function mountReady() {
    secretStorage.set(RECOVERY_SECRET_KEY, 'secret-9')
    const query = stubConvexQuery()
    const { result } = mountWithProviders(use)
    await vi.waitFor(() => expect(query.watch).toHaveBeenCalled())
    await query.emit(checkPassed)
    const ready = result.composable.value
    if (ready.status !== 'ready') throw new Error(`expected ready, got ${ready.status}`)
    return { result, ready, ...query }
  }

  it('subscribes to the check, and is ready only after it passes', async () => {
    secretStorage.set(RECOVERY_SECRET_KEY, 'secret-9')
    const { watch, emit } = stubConvexQuery()
    const { result } = mountWithProviders(use)
    await vi.waitFor(() => expect(watch).toHaveBeenCalled())
    expect(result.composable.value).toEqual({ status: 'loading' })
    expect(watch.mock.calls[0]?.[1]).toEqual({
      emailCode: 'code-9',
      browserSecret: 'secret-9',
    })

    await emit(checkPassed)
    expect(result.composable.value.status).toBe('ready')
  })

  it('a failing check ends the flow without a form', async () => {
    secretStorage.set(RECOVERY_SECRET_KEY, 'secret-9')
    const { watch, emit } = stubConvexQuery()
    const { result } = mountWithProviders(use)
    await vi.waitFor(() => expect(watch).toHaveBeenCalled())
    await emit({ success: false, userError: { error: 'INCORRECT_CODE' } })
    expect(result.composable.value).toEqual({
      status: 'error',
      userError: { error: 'INCORRECT_CODE' },
    })
  })

  it('a failing query throws like `useQuery` does', async () => {
    secretStorage.set(RECOVERY_SECRET_KEY, 'secret-9')
    const { watch, emit } = stubConvexQuery()
    const cause = new Error('server bug')
    const { result } = mountWithProviders(use)
    await vi.waitFor(() => expect(watch).toHaveBeenCalled())
    await emit(cause)
    expect(() => result.composable.value).toThrow(cause)
  })

  it('a link that dies while the page is open ends the flow', async () => {
    const { result, emit } = await mountReady()

    await emit(linkDead)
    expect(result.composable.value).toEqual({
      status: 'error',
      userError: { error: 'INVALID_CHALLENGE' },
    })
  })

  it('completing adopts the session and clears the secret', async () => {
    runSignInMutation.mockResolvedValueOnce({
      status: 'complete',
      tokens: bundle,
    })
    const { result, ready, emit } = await mountReady()

    const returned = await ready.completePasswordRecovery({ newPassword: 'brand new horse staple' })

    expect(runSignInMutation).toHaveBeenLastCalledWith({
      emailCode: 'code-9',
      browserSecret: 'secret-9',
      newPassword: 'brand new horse staple',
    })
    expect(returned).toEqual({ status: 'complete', tokens: bundle })
    expect(result.composable.value).toEqual({ status: 'complete' })
    expect(result.auth.isAuthenticated()).toBe(true)
    expect(secretStorage.get(RECOVERY_SECRET_KEY)).toBeNull()

    await emit(linkDead)
    expect(result.composable.value).toEqual({ status: 'complete' })
  })

  it('the claim reaching the subscription during submit keeps the form', async () => {
    let finishSubmit!: (value: unknown) => void
    runSignInMutation.mockReturnValueOnce(
      new Promise((resolve) => {
        finishSubmit = resolve
      }),
    )
    const { result, ready, emit } = await mountReady()

    const submitted = ready.completePasswordRecovery({ newPassword: 'brand new horse staple' })
    expect(result.composable.value).toMatchObject({ status: 'ready', pending: true })

    await emit(linkDead)
    expect(result.composable.value).toMatchObject({ status: 'ready', pending: true })

    finishSubmit({ status: 'complete', tokens: bundle })
    await submitted
    expect(result.composable.value).toEqual({ status: 'complete' })
  })

  it('is MISSING_SECRET without a check when this browser did not start the flow', async () => {
    const { watch } = stubConvexQuery()
    const { result } = mountWithProviders(use)
    await vi.waitFor(() =>
      expect(result.composable.value).toEqual({
        status: 'error',
        userError: { error: 'MISSING_SECRET' },
      }),
    )
    expect(watch).not.toHaveBeenCalled()
  })

  it('a rejected password leaves the flow ready for another try', async () => {
    const failure = {
      status: 'error',
      userError: { error: 'PASSWORD_TOO_SHORT', minimumLength: 8 },
    }
    runSignInMutation.mockResolvedValueOnce(failure)
    const { result, ready } = await mountReady()

    const returned = await ready.completePasswordRecovery({ newPassword: 'short' })

    expect(returned).toEqual(failure)
    expect(result.composable.value.status).toBe('ready')
    expect(secretStorage.get(RECOVERY_SECRET_KEY)).toBe('secret-9')
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('a link that dies after the check ends the flow at submit', async () => {
    runSignInMutation.mockResolvedValueOnce({
      status: 'error',
      userError: { error: 'INVALID_CHALLENGE' },
    })
    const { result, ready } = await mountReady()

    await ready.completePasswordRecovery({ newPassword: 'brand new horse' })

    expect(result.composable.value).toEqual({
      status: 'error',
      userError: { error: 'INVALID_CHALLENGE' },
    })
  })
})

describe('useStartChangeEmail', () => {
  const use = () => useStartChangeEmail({ startChangeEmail: convexMutation })

  it('success stores the secret', async () => {
    const mutation = stubConvexMutation().mockResolvedValue({
      success: true,
      browserSecret: 'secret-5',
    } as never)
    const { result } = mountWithProviders(use)

    const args = {
      newEmail: 'alice@new.example.com',
      currentPassword: 'correct horse battery staple',
    }
    const returned = await result.composable.startChangeEmail(args)

    expect(mutation.mock.calls[0]?.[1]).toEqual(args)
    expect(returned).toEqual({ success: true })
    expect(secretStorage.get(CHANGE_EMAIL_SECRET_KEY)).toBe('secret-5')
  })

  it('a user error stores nothing', async () => {
    const failure = {
      success: false,
      userError: { error: 'INVALID_CREDENTIALS' },
    }
    stubConvexMutation().mockResolvedValue(failure as never)
    const { result } = mountWithProviders(use)

    const returned = await result.composable.startChangeEmail({
      newEmail: 'alice@new.example.com',
      currentPassword: 'wrong',
    })

    expect(returned).toEqual(failure)
    expect(secretStorage.get(CHANGE_EMAIL_SECRET_KEY)).toBeNull()
  })
})

describe('useCompleteChangeEmail', () => {
  const use = () => useCompleteChangeEmail({ completeChangeEmail: convexMutation }, { emailCode: 'code-5' })

  it('presents the link once as the page opens and clears the secret', async () => {
    secretStorage.set(CHANGE_EMAIL_SECRET_KEY, 'secret-5')
    const mutation = stubConvexMutation().mockResolvedValue({ success: true } as never)
    const { result } = mountWithProviders(use)
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))

    expect(mutation).toHaveBeenCalledTimes(1)
    expect(mutation.mock.calls[0]?.[1]).toEqual({
      emailCode: 'code-5',
      browserSecret: 'secret-5',
    })
    expect(secretStorage.get(CHANGE_EMAIL_SECRET_KEY)).toBeNull()
    expect(result.auth.isAuthenticated()).toBe(false)
  })

  it('presents the code the page opened with when it changes while the secret is read', async () => {
    secretStorage.set(CHANGE_EMAIL_SECRET_KEY, 'secret-5')
    const secret = holdSecretRead(CHANGE_EMAIL_SECRET_KEY)
    const mutation = stubConvexMutation().mockResolvedValue({ success: true } as never)
    const emailCode = ref('code-5')
    const { result } = mountWithProviders(
      () => useCompleteChangeEmail({ completeChangeEmail: convexMutation }, { emailCode }),
      secret.tokenStorage,
    )
    await vi.waitFor(() => expect(secret.read).toHaveBeenCalledTimes(1))
    expect(mutation).not.toHaveBeenCalled()

    emailCode.value = 'code-6'
    await nextTick()
    secret.release()
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))

    expect(mutation).toHaveBeenCalledTimes(1)
    expect(mutation.mock.calls[0]?.[1]).toEqual({
      emailCode: 'code-5',
      browserSecret: 'secret-5',
    })
  })

  it('is MISSING_SECRET when this browser did not start the flow', async () => {
    const mutation = stubConvexMutation()
    const { result } = mountWithProviders(use)
    await vi.waitFor(() =>
      expect(result.composable.value).toEqual({
        status: 'error',
        userError: { error: 'MISSING_SECRET' },
      }),
    )
    expect(mutation).not.toHaveBeenCalled()
  })

  it('keeps the secret when the completion fails', async () => {
    secretStorage.set(CHANGE_EMAIL_SECRET_KEY, 'secret-5')
    stubConvexMutation().mockResolvedValue({
      success: false,
      userError: { error: 'NOT_LOGGED_IN' },
    } as never)
    const { result } = mountWithProviders(use)
    await vi.waitFor(() =>
      expect(result.composable.value).toEqual({
        status: 'error',
        userError: { error: 'NOT_LOGGED_IN' },
      }),
    )
    expect(secretStorage.get(CHANGE_EMAIL_SECRET_KEY)).toBe('secret-5')
  })
})

describe('with an asynchronous storage', () => {
  function asyncStorage() {
    const backing = new InMemoryStorage()
    return {
      backing,
      storage: {
        getItem: async (key: string) => backing.getItem(key),
        setItem: async (key: string, value: string) =>
          backing.setItem(key, value),
        removeItem: async (key: string) => backing.removeItem(key),
      } satisfies TokenStorage,
    }
  }

  it('sign-up keeps its secret in the provider\'s storage, and a later page completes it', async () => {
    const { backing, storage: tokenStorage } = asyncStorage()
    stubConvexMutation().mockResolvedValue({
      success: true,
      browserSecret: 'secret-1',
    } as never)

    const signUp = mountWithProviders(
      () => useSignUpWithEmailPassword({ signUpWithEmailPassword: convexMutation }),
      tokenStorage,
    )
    await vi.waitFor(() => expect(signUp.result.auth.isLoading()).toBe(false))
    await signUp.result.composable.signUp({
      email: 'alice@example.com',
      password: 'correct horse battery staple',
    })
    expect(secretStorage.get(SIGN_UP_SECRET_KEY, backing)).toBe('secret-1')
    signUp.wrapper.unmount()

    runSignInMutation.mockResolvedValue({ status: 'complete', tokens: bundle })
    const { result } = mountWithProviders(
      () =>
        useCompleteSignUpWithEmailPassword(
          { completeSignUpWithEmailPassword: signInMutation },
          { emailCode: 'code-1' },
        ),
      tokenStorage,
    )
    await vi.waitFor(() => expect(result.composable.value).toEqual({ status: 'complete' }))
    expect(runSignInMutation).toHaveBeenCalledWith({
      emailCode: 'code-1',
      browserSecret: 'secret-1',
    })
    expect(secretStorage.get(SIGN_UP_SECRET_KEY, backing)).toBeNull()
  })
})
