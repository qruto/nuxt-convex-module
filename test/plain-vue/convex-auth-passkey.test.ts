import type { TokenBundle } from '@convex-dev/auth'
import { AuthClient, InMemoryStorage } from '@convex-dev/auth/browser'
import { flushPromises, mount } from '@vue/test-utils'
import { anyApi, getFunctionName, type FunctionReference } from 'convex/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h, nextTick, provide, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { toBase64URL } from '../../src/runtime/convex-auth/upstream/methods/username-passkey/base64url'
import { browserCeremonies } from '../../src/runtime/convex-auth/upstream/methods/username-passkey/client'
import { provideAuth, type AuthSignInApi } from '../../src/runtime/convex-auth/vue/client'
import { useAuthToken } from '../../src/runtime/convex-auth/vue/index'
import { usePasskeyAutofill, usePasskeyCeremonySlot } from '../../src/runtime/convex-auth/vue/methods/username-passkey/impl'
import {
  useSignInWithUsernamePasskey,
  type SignInWithUsernamePasskeyResult,
  type UsernamePasskeyApi,
} from '../../src/runtime/convex-auth/vue/methods/username-passkey/index'
import { ConvexClientKey, type ConvexVueClient } from '../../src/runtime/vue/client'

// The Vue counterpart of upstream's `methods/username-passkey/react.test.tsx`,
// scenario for scenario, in the project with no `define`.
//
// Two of upstream's scenarios have no counterpart: "signIn keeps one identity
// across re-renders" and "… while the autofill status changes". A composable
// runs once per component, so `signIn` is one function for its whole life.

const noopAutofill = {
  pauseAutofillFlow: () => {},
  resumeAutofillFlow: () => {},
  isAutofillSigningIn: () => false,
}

// The composable calls several different mutations, so both call paths
// dispatch on the name of the reference to one mock per mutation.
const mutations = {
  startSignInWithUsernamePasskey: vi.fn(),
  finishSignInWithUsernamePasskey: vi.fn(),
  finishSignUpWithUsernamePasskey: vi.fn(),
  startAutofillSignInWithUsernamePasskey: vi.fn(),
}
const runMutation = (fn: FunctionReference<'mutation'>, args: unknown) =>
  // `anyApi.auth.startSignInWithUsernamePasskey` is named
  // `auth:startSignInWithUsernamePasskey`.
  mutations[getFunctionName(fn).split(':')[1] as keyof typeof mutations](args)

// The two session-minting mutations run through the injected `AuthSignInApi`,
// which the tests substitute rather than mocking a transport.
const signInApi = { mutation: runMutation } as unknown as AuthSignInApi

// The two challenge mutations run on the Convex client the component tree
// provides, which the tests stand in for with the same dispatcher.
const convexClient = { mutation: runMutation } as unknown as ConvexVueClient

// `anyApi` is what the generated `api` is. It returns a new reference object
// on each property access, as `api.auth` does.
const passkeyApi = () => anyApi.auth as unknown as UsernamePasskeyApi

// ------------------------------------------------------------------------------
// The fake browser ceremonies
// ------------------------------------------------------------------------------
//
// Modal ceremonies run through `@simplewebauthn/browser`, which the tests
// mock; the conditional request runs through `navigator.credentials`, which
// they stub. Both share one ceremony slot, the way the browser does:
// starting any ceremony displaces a pending one, which rejects with an
// `AbortError`. The tests own what each ceremony resolves with through
// `ceremonyCreate` / `ceremonyGet` / `conditionalGet`.

const ceremonyCreate = vi.fn()
const ceremonyGet = vi.fn()
// The conditional request does not go through the library (the composable
// owns its `AbortSignal`), so it has its own control. It resolves with a
// `PublicKeyCredential`, the way `navigator.credentials.get` does, rather
// than with the JSON the library returns.
const conditionalGet = vi.fn()

function abortError() {
  const error = new Error('Ceremony was aborted')
  error.name = 'AbortError'
  return error
}

let abortPending: ((reason: Error) => void) | null = null

function runInCeremonySlot<T>(run: () => Promise<T>): Promise<T> {
  abortPending?.(abortError())
  return new Promise<T>((resolve, reject) => {
    abortPending = reject
    const mine = reject
    run().then(
      (value) => {
        if (abortPending === mine) abortPending = null
        resolve(value)
      },
      (cause) => {
        if (abortPending === mine) abortPending = null
        reject(cause)
      },
    )
  })
}

/**
 * The fake `navigator.credentials`, which the conditional path calls. It
 * shares the ceremony slot with the library fake, the way the browser does,
 * and it honours the caller's signal: an already-aborted one is refused on
 * entry, which is the property the composable relies on.
 */
function stubCredentials() {
  Object.defineProperty(globalThis.navigator, 'credentials', {
    configurable: true,
    value: {
      get: (options: { signal?: AbortSignal }) =>
        runInCeremonySlot(
          () =>
            new Promise((resolve, reject) => {
              const signal = options.signal
              if (signal?.aborted) {
                reject(abortError())
                return
              }
              signal?.addEventListener('abort', () => reject(abortError()), {
                once: true,
              })
              conditionalGet(options).then(resolve, reject)
            }),
        ),
    },
  })
}

vi.mock('@simplewebauthn/browser', () => ({
  startRegistration: (options: unknown) =>
    runInCeremonySlot(() => ceremonyCreate(options)),
  startAuthentication: (options: unknown) =>
    runInCeremonySlot(() => ceremonyGet(options)),
  WebAuthnAbortService: {
    cancelCeremony: () => {
      abortPending?.(abortError())
      abortPending = null
    },
  },
}))

/**
 * A ceremony that stays pending until the slot aborts it, like a real
 * conditional-mediation request until the user picks a passkey.
 */
const pendingForever = () => new Promise<never>(() => {})

const bytes = (text: string) =>
  Uint8Array.from(text, character => character.charCodeAt(0)).buffer

/**
 * The wire form of a short ASCII string: canonical base64url, so that a
 * value decoded from it encodes back to exactly the same string.
 */
const wire = (text: string) => toBase64URL(bytes(text))

const FakePublicKeyCredential = {
  isConditionalMediationAvailable: async () => true,
}

const NAMESPACE = 'https://happy-animal-123.convex.cloud'

const bundle: TokenBundle = {
  accessToken: 'access-1',
  refreshToken: 'refresh-1',
  refreshTokenExpiresAt: 0,
  userId: 'user-1',
}

// The options objects the start mutations return, ready for the browser.
const creationOptions = {
  rp: { id: 'localhost', name: 'Test app' },
  user: { id: 'handle-1', name: 'alice', displayName: 'alice' },
  challenge: 'challenge-1',
  pubKeyCredParams: [{ alg: -7, type: 'public-key' as const }],
  timeout: 600000,
  excludeCredentials: [],
  authenticatorSelection: {
    residentKey: 'required' as const,
    requireResidentKey: true as const,
    userVerification: 'required' as const,
  },
  attestation: 'none' as const,
  extensions: {},
}

const requestOptions = {
  challenge: 'challenge-1',
  timeout: 600000,
  rpId: 'localhost',
  allowCredentials: [
    { id: 'cred-1', type: 'public-key' as const, transports: ['internal'] },
  ],
  userVerification: 'required' as const,
}

// The same assertion in the shape `navigator.credentials.get` resolves
// with: bytes rather than base64url. It encodes back to
// `wireAuthenticationResponse`.
const conditionalCredential = {
  id: wire('cred-1'),
  rawId: bytes('cred-1'),
  response: {
    clientDataJSON: bytes('client-data'),
    authenticatorData: bytes('auth-data'),
    signature: bytes('signature'),
    userHandle: bytes('handle-1'),
  },
  type: 'public-key',
}

const registerStart = {
  success: true,
  step: 'register',
  options: creationOptions,
}

const authenticateStart = {
  success: true,
  step: 'authenticate',
  options: requestOptions,
}

// What the library resolves a `create()` ceremony with, including the
// convenience fields that the composables must prune off the wire.
const registrationResponse = {
  id: 'cred-1',
  rawId: 'cred-1',
  response: {
    clientDataJSON: 'client-data',
    attestationObject: 'attestation',
    transports: ['internal', 'hybrid'],
    publicKey: 'public-key',
    publicKeyAlgorithm: -7,
    authenticatorData: 'auth-data',
  },
  authenticatorAttachment: 'platform',
  clientExtensionResults: { credProps: { rk: true } },
  type: 'public-key',
}

// What the library resolves a `get()` ceremony with.
const authenticationResponse = {
  id: wire('cred-1'),
  rawId: wire('cred-1'),
  response: {
    clientDataJSON: wire('client-data'),
    authenticatorData: wire('auth-data'),
    signature: wire('signature'),
    userHandle: wire('handle-1'),
  },
  clientExtensionResults: {},
  type: 'public-key',
}

// The wire forms of the two responses, as the finish mutations receive them.
const wireRegistrationResponse = {
  id: 'cred-1',
  rawId: 'cred-1',
  response: {
    clientDataJSON: 'client-data',
    attestationObject: 'attestation',
    transports: ['internal', 'hybrid'],
  },
  clientExtensionResults: {},
  type: 'public-key',
}

const wireAuthenticationResponse = {
  id: wire('cred-1'),
  rawId: wire('cred-1'),
  response: {
    clientDataJSON: wire('client-data'),
    authenticatorData: wire('auth-data'),
    signature: wire('signature'),
    userHandle: wire('handle-1'),
  },
  clientExtensionResults: {},
  type: 'public-key',
}

const signedIn = { status: 'complete', tokens: bundle, username: 'alice' }

beforeEach(() => {
  vi.stubGlobal('PublicKeyCredential', FakePublicKeyCredential)
  vi.stubGlobal('isSecureContext', true)
  stubCredentials()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  for (const mock of Object.values(mutations)) {
    mock.mockReset()
  }
  ceremonyCreate.mockReset()
  ceremonyGet.mockReset()
  conditionalGet.mockReset()
  abortPending = null
})

/** Run `useComposable` in a component of its own. */
function mountComposable<T>(useComposable: () => T) {
  const result = {} as { composable: T }
  const wrapper = mount(defineComponent({
    setup() {
      result.composable = useComposable()
      return () => null
    },
  }))
  return { result: result.composable, unmount: () => wrapper.unmount() }
}

/** Mount the sign-in composable below the auth provider and a Convex client. */
function mountPasskey() {
  const authClient = new AuthClient({
    mode: 'spa',
    authApi: {
      refreshSession: async () => ({ kind: 'noSession' as const }),
      signOut: async () => {},
    },
    storage: new InMemoryStorage(),
    storageNamespace: NAMESPACE,
  })
  const result = {} as {
    auth: ReturnType<typeof provideAuth>
    token: ReturnType<typeof useAuthToken>
    passkey: ReturnType<typeof useSignInWithUsernamePasskey>
  }
  const Child = defineComponent({
    setup() {
      result.token = useAuthToken()
      result.passkey = useSignInWithUsernamePasskey(passkeyApi())
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
  return { result, unmount: () => wrapper.unmount() }
}

/** Mount, and wait for the auth client to load. */
async function mountLoaded() {
  const mounted = mountPasskey()
  await flushPromises()
  expect(mounted.result.auth.isLoading()).toBe(false)
  return mounted
}

describe('useSignInWithUsernamePasskey signIn', () => {
  it('sign-up success runs the registration ceremony and adopts the session', async () => {
    mutations.startSignInWithUsernamePasskey.mockResolvedValue(registerStart)
    ceremonyCreate.mockResolvedValue(registrationResponse)
    mutations.finishSignUpWithUsernamePasskey.mockResolvedValue({
      status: 'complete',
      tokens: bundle,
    })
    const { result, unmount } = await mountLoaded()

    const returned = await result.passkey.signIn({ username: 'alice' })

    expect(mutations.startSignInWithUsernamePasskey).toHaveBeenCalledWith({
      username: 'alice',
    })
    // The server-built options go to the browser untouched.
    expect(ceremonyCreate).toHaveBeenCalledWith({
      optionsJSON: creationOptions,
    })
    // The response reaches the finish mutation pruned to the wire shape.
    expect(mutations.finishSignUpWithUsernamePasskey).toHaveBeenCalledWith({
      username: 'alice',
      response: wireRegistrationResponse,
    })
    expect(returned).toEqual({
      status: 'complete',
      tokens: bundle,
      flow: 'signUp',
    })
    expect(result.auth.isAuthenticated()).toBe(true)
    expect(result.token.value).toBe('access-1')
    unmount()
  })

  it('sign-in success runs the authentication ceremony and adopts the session', async () => {
    mutations.startSignInWithUsernamePasskey.mockResolvedValue(authenticateStart)
    ceremonyGet.mockResolvedValue(authenticationResponse)
    mutations.finishSignInWithUsernamePasskey.mockResolvedValue(signedIn)
    const { result, unmount } = await mountLoaded()

    const returned = await result.passkey.signIn({ username: 'alice' })

    expect(ceremonyGet).toHaveBeenCalledWith({
      optionsJSON: requestOptions,
    })
    expect(mutations.finishSignInWithUsernamePasskey).toHaveBeenCalledWith({
      response: wireAuthenticationResponse,
    })
    expect(returned).toEqual({ ...signedIn, flow: 'signIn' })
    expect(result.auth.isAuthenticated()).toBe(true)
    unmount()
  })

  it('a startSignInWithUsernamePasskey userError becomes an error arm without a ceremony', async () => {
    mutations.startSignInWithUsernamePasskey.mockResolvedValue({
      success: false,
      userError: { error: 'USERNAME_INVALID' },
    })
    const { result, unmount } = await mountLoaded()

    const returned = await result.passkey.signIn({ username: 'no' })

    // `startSignInWithUsernamePasskey` answers with its own `success` boolean; the flow re-wraps
    // the failure so callers see the envelope's one discriminant.
    expect(returned).toEqual({
      status: 'error',
      userError: { error: 'USERNAME_INVALID' },
    })
    expect(ceremonyCreate).not.toHaveBeenCalled()
    expect(ceremonyGet).not.toHaveBeenCalled()
    expect(result.auth.isAuthenticated()).toBe(false)
    unmount()
  })

  it('NotAllowedError folds into CEREMONY_ABORTED', async () => {
    mutations.startSignInWithUsernamePasskey.mockResolvedValue(authenticateStart)
    ceremonyGet.mockRejectedValue(
      new DOMException('The operation was cancelled.', 'NotAllowedError'),
    )
    const { result, unmount } = await mountLoaded()

    const returned = await result.passkey.signIn({ username: 'alice' })

    expect(returned).toEqual({
      status: 'error',
      userError: { error: 'CEREMONY_ABORTED' },
    })
    expect(result.auth.isAuthenticated()).toBe(false)
    expect(result.passkey.pending.value).toBe(false)
    unmount()
  })

  it('a second signIn while one runs fails fast and the first completes', async () => {
    mutations.startSignInWithUsernamePasskey.mockResolvedValue(authenticateStart)
    let resolveCeremony!: (value: unknown) => void
    ceremonyGet.mockReturnValue(
      new Promise((resolve) => {
        resolveCeremony = resolve
      }),
    )
    mutations.finishSignInWithUsernamePasskey.mockResolvedValue(signedIn)
    const { result, unmount } = await mountLoaded()

    const first = result.passkey.signIn({ username: 'alice' })
    expect(result.passkey.pending.value).toBe(true)

    // The second call must not start another ceremony or deadlock; it
    // returns a folded failure immediately.
    const second = await result.passkey.signIn({ username: 'alice' })
    expect(second).toEqual({
      status: 'error',
      userError: { error: 'ALREADY_PENDING' },
    })
    expect(mutations.startSignInWithUsernamePasskey).toHaveBeenCalledTimes(1)

    // The first call still completes normally.
    await vi.waitFor(() => expect(ceremonyGet).toHaveBeenCalled())
    resolveCeremony(authenticationResponse)
    expect(await first).toEqual({ ...signedIn, flow: 'signIn' })
    expect(result.passkey.pending.value).toBe(false)
    expect(result.auth.isAuthenticated()).toBe(true)
    unmount()
  })
})

describe('useSignInWithUsernamePasskey autofill', () => {
  it('a rejecting availability check reports available: false and status \'stopped\'', async () => {
    vi.spyOn(FakePublicKeyCredential, 'isConditionalMediationAvailable')
      .mockRejectedValue(new Error('detection failed'))
    const { result, unmount } = mountPasskey()
    await vi.waitFor(() => expect(result.passkey.autofill.status.value).toBe('stopped'))
    expect(result.passkey.autofill.available.value).toBe(false)
    expect(mutations.startAutofillSignInWithUsernamePasskey).not.toHaveBeenCalled()

    unmount()
    await flushPromises()
  })

  it('a picked passkey signs the user in: waiting → signedIn', async () => {
    mutations.startAutofillSignInWithUsernamePasskey.mockResolvedValue({
      options: requestOptions,
    })
    conditionalGet.mockResolvedValue(conditionalCredential)
    mutations.finishSignInWithUsernamePasskey.mockResolvedValue(signedIn)
    const { result, unmount } = mountPasskey()

    await vi.waitFor(() => expect(result.passkey.autofill.status.value).toBe('signedIn'))
    // The request is a conditional one, and it carries the composable's own
    // abort signal rather than one from the library's singleton.
    const call = conditionalGet.mock.calls[0]![0]
    expect(call.mediation).toBe('conditional')
    expect(call.signal).toBeInstanceOf(AbortSignal)
    expect(call.publicKey.rpId).toBe(requestOptions.rpId)
    expect(mutations.finishSignInWithUsernamePasskey).toHaveBeenCalledWith({
      response: wireAuthenticationResponse,
    })
    expect(result.auth.isAuthenticated()).toBe(true)
    expect(result.passkey.autofill.lastError.value).toBe(null)

    unmount()
    await flushPromises()
  })

  it('a success after a failed assertion clears lastError', async () => {
    mutations.startAutofillSignInWithUsernamePasskey.mockResolvedValue({
      options: requestOptions,
    })
    conditionalGet.mockResolvedValue(conditionalCredential)
    // The first assertion fails on the server; the loop retries with a
    // fresh challenge and the second one succeeds.
    mutations.finishSignInWithUsernamePasskey
      .mockResolvedValueOnce({
        status: 'error',
        userError: { error: 'CHALLENGE_EXPIRED' },
      })
      .mockResolvedValueOnce(signedIn)
    const { result, unmount } = mountPasskey()

    await vi.waitFor(() => expect(result.passkey.autofill.status.value).toBe('signedIn'))
    expect(mutations.finishSignInWithUsernamePasskey).toHaveBeenCalledTimes(2)
    expect(result.auth.isAuthenticated()).toBe(true)
    // The failure of the first attempt must not stay visible after the
    // user is signed in.
    expect(result.passkey.autofill.lastError.value).toBe(null)

    unmount()
    await flushPromises()
  })

  it('pending is true while the server verifies an autofill sign-in, and signIn refuses', async () => {
    mutations.startAutofillSignInWithUsernamePasskey.mockResolvedValue({
      options: requestOptions,
    })
    conditionalGet.mockResolvedValue(conditionalCredential)
    let resolveFinish!: (value: unknown) => void
    mutations.finishSignInWithUsernamePasskey.mockReturnValue(
      new Promise((resolve) => {
        resolveFinish = resolve
      }),
    )
    const { result, unmount } = mountPasskey()

    await vi.waitFor(() => expect(result.passkey.autofill.status.value).toBe('signingIn'))
    expect(result.passkey.pending.value).toBe(true)

    // The verification cannot be paused, thus a modal flow must not start.
    const returned: SignInWithUsernamePasskeyResult = await result.passkey.signIn({ username: 'alice' })
    expect(returned).toEqual({
      status: 'error',
      userError: { error: 'ALREADY_PENDING' },
    })
    expect(mutations.startSignInWithUsernamePasskey).not.toHaveBeenCalled()

    resolveFinish(signedIn)
    await vi.waitFor(() => expect(result.passkey.autofill.status.value).toBe('signedIn'))
    expect(result.passkey.pending.value).toBe(false)
    expect(result.auth.isAuthenticated()).toBe(true)

    unmount()
    await flushPromises()
  })

  it('signIn pauses the pending autofill request and resumes it after', async () => {
    mutations.startAutofillSignInWithUsernamePasskey.mockResolvedValue({
      options: requestOptions,
    })
    // The conditional (autofill) request stays pending until aborted; the
    // modal ceremony resolves. A modal ceremony while a conditional
    // request is still pending would displace it (the slot enforces this),
    // and the pause must have aborted it before that.
    let conditionalSignal: AbortSignal | undefined
    conditionalGet.mockImplementation((options: { signal: AbortSignal }) => {
      conditionalSignal = options.signal
      return pendingForever()
    })
    ceremonyGet.mockImplementation(() => {
      // The pause aborted the conditional request before the modal
      // ceremony started. The signal latches, thus this holds whether the
      // pause landed while the request was pending or still starting.
      expect(conditionalSignal?.aborted).toBe(true)
      return Promise.resolve(authenticationResponse)
    })
    mutations.startSignInWithUsernamePasskey.mockResolvedValue(authenticateStart)
    mutations.finishSignInWithUsernamePasskey.mockResolvedValue(signedIn)
    const { result, unmount } = mountPasskey()
    await vi.waitFor(() => expect(result.passkey.autofill.status.value).toBe('waiting'))
    expect(mutations.startAutofillSignInWithUsernamePasskey).toHaveBeenCalledTimes(1)

    const returned = await result.passkey.signIn({ username: 'alice' })

    expect(returned).toEqual({ ...signedIn, flow: 'signIn' })
    // The modal flow resumed the loop afterwards: it asks for a fresh
    // challenge and a new conditional request starts.
    await vi.waitFor(() =>
      expect(mutations.startAutofillSignInWithUsernamePasskey).toHaveBeenCalledTimes(2),
    )
    await vi.waitFor(() => expect(result.passkey.autofill.status.value).toBe('waiting'))

    unmount()
    await flushPromises()
  })
})

describe('usePasskeyCeremonySlot', () => {
  it('run returns the callback\'s result and tracks pending', async () => {
    const { result } = mountComposable(() => usePasskeyCeremonySlot({ autofill: noopAutofill }))
    expect(result.pending.value).toBe(false)

    let resolveCeremony!: (value: string) => void
    const running = result.run(
      () =>
        new Promise<string>((resolve) => {
          resolveCeremony = resolve
        }),
    )
    expect(result.pending.value).toBe(true)

    resolveCeremony('done')
    expect(await running).toBe('done')
    expect(result.pending.value).toBe(false)
  })

  it('a second run while one is running fails fast', async () => {
    const { result } = mountComposable(() => usePasskeyCeremonySlot({ autofill: noopAutofill }))

    let resolveCeremony!: (value: string) => void
    const first = result.run(
      () =>
        new Promise<string>((resolve) => {
          resolveCeremony = resolve
        }),
    )
    expect(result.pending.value).toBe(true)

    const second = vi.fn(async () => 'second')
    expect(await result.run(second)).toEqual({
      success: false,
      userError: { error: 'ALREADY_PENDING' },
    })
    expect(second).not.toHaveBeenCalled()

    resolveCeremony('done')
    await first
    expect(result.pending.value).toBe(false)
  })

  it('a thrown value folds into the failure shape', async () => {
    const { result } = mountComposable(() => usePasskeyCeremonySlot({ autofill: noopAutofill }))
    const cause = new Error('boom')
    const returned = await result.run(async () => {
      throw cause
    })
    expect(returned).toEqual({
      success: false,
      userError: { error: 'OTHER_ERROR', cause },
    })
    expect(result.pending.value).toBe(false)
  })

  it('run refuses while the server verifies an autofill sign-in', async () => {
    const autofill = { ...noopAutofill, isAutofillSigningIn: () => true }
    const fn = vi.fn(async () => 'done')
    const { result } = mountComposable(() => usePasskeyCeremonySlot({ autofill }))
    expect(await result.run(fn)).toEqual({
      success: false,
      userError: { error: 'ALREADY_PENDING' },
    })
    expect(fn).not.toHaveBeenCalled()
    expect(result.pending.value).toBe(false)
  })

  it('run pauses the autofill gates around the callback, also on a throw', async () => {
    const calls: string[] = []
    const autofill = {
      pauseAutofillFlow: () => {
        calls.push('pause')
      },
      resumeAutofillFlow: () => {
        calls.push('resume')
      },
      isAutofillSigningIn: () => false,
    }
    const { result } = mountComposable(() => usePasskeyCeremonySlot({ autofill }))
    await result.run(async () => {
      calls.push('ceremony')
      throw new Error('boom')
    })
    expect(calls).toEqual(['pause', 'ceremony', 'resume'])
  })
})

describe('usePasskeyAutofill', () => {
  const start = vi.fn(async () => requestOptions)
  const succeed = () => vi.fn(async () => ({ success: true as const }))

  beforeEach(() => {
    start.mockClear()
  })

  it('hands the picked response to onAssertion and reports success', async () => {
    conditionalGet.mockResolvedValue(conditionalCredential)
    const onAssertion = succeed()
    const { result, unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion }),
    )

    await vi.waitFor(() => expect(result.status.value).toBe('signedIn'))
    expect(result.available.value).toBe(true)
    expect(result.lastError.value).toBe(null)
    expect(onAssertion).toHaveBeenCalledWith(wireAuthenticationResponse)

    unmount()
    await flushPromises()
  })

  it('stops after three failed assertions in a row', async () => {
    conditionalGet.mockResolvedValue(conditionalCredential)
    const flowError = { error: 'VERIFICATION_FAILED' as const }
    const onAssertion = vi.fn(async () => ({
      success: false as const,
      userError: flowError,
    }))
    const { result, unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion }),
    )

    await vi.waitFor(() => expect(result.status.value).toBe('stopped'))
    expect(start).toHaveBeenCalledTimes(3)
    expect(onAssertion).toHaveBeenCalledTimes(3)
    expect(result.lastError.value).toBe(flowError)

    unmount()
    await flushPromises()
  })

  it('a pause taken before the loop starts holds the first request', async () => {
    conditionalGet.mockImplementation(pendingForever)
    const { result, unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion: succeed() }),
    )

    result.pauseAutofillFlow()
    await flushPromises()
    expect(start).not.toHaveBeenCalled()

    result.resumeAutofillFlow()
    await vi.waitFor(() => expect(result.status.value).toBe('waiting'))
    expect(start).toHaveBeenCalledTimes(1)

    unmount()
    await flushPromises()
  })

  it('a pause while the challenge is being minted holds the request', async () => {
    conditionalGet.mockImplementation(pendingForever)
    let mintChallenge!: () => void
    let mintCalls = 0
    const minting = vi.fn(() => {
      mintCalls += 1
      if (mintCalls > 1) {
        return Promise.resolve(requestOptions)
      }
      return new Promise<typeof requestOptions>((resolve) => {
        mintChallenge = () => resolve(requestOptions)
      })
    })
    const { result, unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start: minting, onAssertion: succeed() }),
    )
    await vi.waitFor(() => expect(minting).toHaveBeenCalledTimes(1))

    result.pauseAutofillFlow()
    mintChallenge()
    await flushPromises()
    expect(conditionalGet).not.toHaveBeenCalled()

    result.resumeAutofillFlow()
    await vi.waitFor(() => expect(conditionalGet).toHaveBeenCalledTimes(1))

    unmount()
    await flushPromises()
  })

  it('a ceremony that takes the slot without pausing stops the flow', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    conditionalGet.mockImplementation(pendingForever)
    const { result, unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion: succeed() }),
    )
    await vi.waitFor(() => expect(result.status.value).toBe('waiting'))
    await vi.waitFor(() => expect(conditionalGet).toHaveBeenCalledTimes(1))

    abortPending?.(abortError())
    abortPending = null
    await vi.waitFor(() => expect(result.status.value).toBe('stopped'))
    expect(result.lastError.value).toEqual({ error: 'CEREMONY_ABORTED' })
    expect(start).toHaveBeenCalledTimes(1)
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0]![0]).toContain('autofill has stopped')

    unmount()
    await flushPromises()
  })

  // Upstream re-renders with `enabled: false`, then `true`, which restarts its
  // effect. Here the same switch restarts the watcher's run.
  it('an autofill effect restart mid-ceremony keeps the pause', async () => {
    conditionalGet.mockImplementation(pendingForever)
    const enabled = ref(true)
    const { result, unmount } = mountComposable(() => {
      const autofill = usePasskeyAutofill({
        ceremonies: browserCeremonies,
        start,
        onAssertion: succeed(),
        enabled,
      })
      const modal = usePasskeyCeremonySlot({ autofill })
      return { autofill, modal }
    })
    await vi.waitFor(() => expect(result.autofill.status.value).toBe('waiting'))

    let finishCeremony!: () => void
    const running = result.modal.run(
      () =>
        new Promise<string>((resolve) => {
          finishCeremony = () => resolve('done')
        }),
    )
    expect(result.modal.pending.value).toBe(true)
    expect(start).toHaveBeenCalledTimes(1)

    // The loop restarts while the modal ceremony holds the slot. The restarted
    // loop must not start a request until the ceremony is done.
    enabled.value = false
    await nextTick()
    enabled.value = true
    await nextTick()
    await flushPromises()
    expect(start).toHaveBeenCalledTimes(1)

    finishCeremony()
    expect(await running).toBe('done')
    expect(result.modal.pending.value).toBe(false)
    await vi.waitFor(() => expect(result.autofill.status.value).toBe('waiting'))
    expect(start).toHaveBeenCalledTimes(2)

    unmount()
    await flushPromises()
  })

  it('a modal ceremony that ends before its abort settles restarts the loop', async () => {
    conditionalGet.mockImplementation(pendingForever)
    const { result, unmount } = mountComposable(() => {
      const autofill = usePasskeyAutofill({
        ceremonies: browserCeremonies,
        start,
        onAssertion: succeed(),
      })
      const modal = usePasskeyCeremonySlot({ autofill })
      return { autofill, modal }
    })
    await vi.waitFor(() => expect(result.autofill.status.value).toBe('waiting'))

    // The callback resolves at once, so the modal flow resumes the loop
    // before the aborted conditional request has rejected.
    expect(await result.modal.run(async () => 'done')).toBe('done')

    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(result.autofill.status.value).toBe('waiting'))

    unmount()
    await flushPromises()
  })

  it('a challenge that aged while no timer ran is refreshed when the user comes back', async () => {
    let now = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    conditionalGet.mockImplementation(pendingForever)
    const { result, unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion: succeed() }),
    )
    await vi.waitFor(() => expect(conditionalGet).toHaveBeenCalledTimes(1))
    expect(start).toHaveBeenCalledTimes(1)

    // A laptop that slept for nine minutes: no timer fired, but the
    // challenge is past the point where it must be refreshed.
    now += 9 * 60 * 1000
    document.dispatchEvent(new Event('focusin'))
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(2))
    await vi.waitFor(() => expect(conditionalGet).toHaveBeenCalledTimes(2))
    expect(result.status.value).toBe('waiting')
    expect(result.lastError.value).toBe(null)

    unmount()
    await flushPromises()
  })

  it('the periodic check refreshes a challenge that aged past the refresh point', async () => {
    let now = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    conditionalGet.mockImplementation(pendingForever)
    const { unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion: succeed() }),
    )
    await vi.waitFor(() => expect(conditionalGet).toHaveBeenCalledTimes(1))

    const check = setIntervalSpy.mock.calls.find(
      ([, ms]) => ms === 10 * 1000,
    )?.[0] as () => void
    expect(check).toBeTypeOf('function')

    // One minute in, the challenge is still fresh: the check leaves it.
    now += 60 * 1000
    check()
    await flushPromises()
    expect(start).toHaveBeenCalledTimes(1)

    // Nine minutes in, it is past the refresh point.
    now += 8 * 60 * 1000
    check()
    await vi.waitFor(() => expect(start).toHaveBeenCalledTimes(2))

    unmount()
    await flushPromises()
  })

  it('coming back to the page keeps a challenge that is still fresh', async () => {
    let now = 1_000_000
    vi.spyOn(Date, 'now').mockImplementation(() => now)
    conditionalGet.mockImplementation(pendingForever)
    const { unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion: succeed() }),
    )
    await vi.waitFor(() => expect(conditionalGet).toHaveBeenCalledTimes(1))

    now += 5 * 60 * 1000
    document.dispatchEvent(new Event('visibilitychange'))
    window.dispatchEvent(new Event('focus'))
    document.dispatchEvent(new Event('focusin'))
    await flushPromises()
    expect(start).toHaveBeenCalledTimes(1)
    expect(conditionalGet).toHaveBeenCalledTimes(1)

    unmount()
    await flushPromises()
  })

  it('disabling the composable stops the pending request for good', async () => {
    conditionalGet.mockImplementation(pendingForever)
    const onAssertion = succeed()
    const enabled = ref(true)
    const { result, unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion, enabled }),
    )

    await vi.waitFor(() => expect(result.status.value).toBe('waiting'))
    enabled.value = false
    await vi.waitFor(() => expect(result.status.value).toBe('idle'))
    expect(result.available.value).toBe(false)
    expect(onAssertion).not.toHaveBeenCalled()
    await flushPromises()
    expect(start).toHaveBeenCalledTimes(1)

    unmount()
    await flushPromises()
  })

  // Upstream's effect cleanup runs on unmount. Here the loop lives in a
  // watcher that starts in `onMounted`, which must end with the component.
  it('unmounting aborts the pending request and ends the loop', async () => {
    let conditionalSignal: AbortSignal | undefined
    conditionalGet.mockImplementation((options: { signal: AbortSignal }) => {
      conditionalSignal = options.signal
      return pendingForever()
    })
    const { result, unmount } = mountComposable(() =>
      usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion: succeed() }),
    )
    await vi.waitFor(() => expect(conditionalGet).toHaveBeenCalledTimes(1))

    unmount()
    await flushPromises()

    expect(conditionalSignal?.aborted).toBe(true)
    expect(start).toHaveBeenCalledTimes(1)
    // The loop saw the cleanup and reported nothing more.
    expect(result.status.value).toBe('waiting')
    expect(result.lastError.value).toBe(null)
  })

  // The loop starts in `onMounted`, which a server render never reaches: the
  // server asks the platform nothing, and the page hydrates on the idle state.
  it('starts nothing during a server render', async () => {
    const isAutofillAvailable = vi.spyOn(browserCeremonies, 'isAutofillAvailable')
    let rendered: { available: boolean | null, status: string } | undefined
    const html = await renderToString(createSSRApp({
      setup() {
        const autofill = usePasskeyAutofill({ ceremonies: browserCeremonies, start, onAssertion: succeed() })
        return () => {
          rendered = { available: autofill.available.value, status: autofill.status.value }
          return h('p', autofill.status.value)
        }
      },
    }))
    await flushPromises()

    expect(html).toBe('<p>idle</p>')
    expect(rendered).toEqual({ available: null, status: 'idle' })
    expect(isAutofillAvailable).not.toHaveBeenCalled()
    expect(start).not.toHaveBeenCalled()
  })
})
