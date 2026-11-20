/**
 * Vue client for the `emailPassword` method: a port of
 * `@convex-dev/auth/methods/email-password/react`.
 *
 * @module convex-auth/methods/email-password
 */
import type { AuthClient } from '@convex-dev/auth/browser'
import type {
  SignUpResult as SignUpMutationResult,
  CompleteSignUpResult,
  SignInResult as SignInMutationResult,
  StartChangeEmailResult as StartChangeEmailMutationResult,
  CompleteChangeEmailResult,
  StartPasswordRecoveryResult as StartPasswordRecoveryMutationResult,
  CheckPasswordRecoveryResult as CheckPasswordRecoveryQueryResult,
  CompletePasswordRecoveryResult as CompletePasswordRecoveryMutationResult,
} from '@convex-dev/auth/methods/email-password/server'
import type { FunctionReference } from 'convex/server'
import { computed, inject, ref, shallowRef, toValue, watch, type ComputedRef, type MaybeRefOrGetter, type Ref, type ShallowRef } from 'vue'
import { useMutation } from '../../../vue/composables/use-mutation'
import { useQuery } from '../../../vue/composables/use-query'
import type { SignInStorage } from '../../upstream/browser/storage'
import type { ClientView } from '../../upstream/lib/types'
import { AuthClientKey, useAuth, useAuthSignInApi } from '../client'
import { useAuthActions } from '../index'

/**
 * The flows that the user completes with a link from an email. Each flow keeps
 * a secret in the storage of the browser that started it.
 */
type EmailLinkFlow = 'signUp' | 'changeEmail' | 'passwordRecovery'

// One storage key per type of flow, so flows of different types can run at
// the same time. Two flows of the same type share one key: the second flow
// replaces the secret of the first.
const SECRET_STORAGE_KEYS: Record<EmailLinkFlow, string> = {
  signUp: '__convexAuthEmailPasswordSignUpSecret',
  changeEmail: '__convexAuthEmailPasswordChangeEmailSecret',
  passwordRecovery: '__convexAuthEmailPasswordRecoverySecret',
}

// ------------------------------------------------------------------------------
// Result types
// ------------------------------------------------------------------------------

/** The `userError` of the failure arm of a `success` envelope. */
type ExtractError<Result> = Result extends {
  success: false
  userError: infer UserError
}
  ? UserError
  : never

/** The `userError` of the error arm of a sign-in envelope. */
type SignInError<Result> = Result extends {
  status: 'error'
  userError: infer UserError
}
  ? UserError
  : never

/**
 * The mutation threw rather than resolving to a `userError`. The thrown value
 * is preserved on `cause`.
 */
type OtherError = { error: 'OTHER_ERROR', cause: unknown }

/**
 * A link was opened in a browser that did not start the flow: the flow's
 * secret is not in this browser's storage, so completion cannot proceed. Tell
 * the user to open the link in the browser they started from.
 */
type MissingSecretError = { error: 'MISSING_SECRET' }

type UnexpectedFailure = { success: false, userError: OtherError }

/**
 * The success arm of a "start" result, without the `browserSecret`. The
 * composable stores the secret itself; the caller has no use for it, and
 * keeping it out of the result keeps it out of URLs and logs.
 */
type WithoutSecret<Result> = Result extends { success: true }
  ? Omit<Result, 'browserSecret'>
  : Result

type SignInUnexpectedFailure = { status: 'error', userError: OtherError }

type SignUpMutation = FunctionReference<
  'mutation',
  'public',
  { email: string, password: string },
  ClientView<SignUpMutationResult>
>

type CompleteSignUpMutation = FunctionReference<
  'mutation',
  'public',
  { emailCode: string, browserSecret: string },
  ClientView<CompleteSignUpResult>
>

type SignInMutation = FunctionReference<
  'mutation',
  'public',
  { email: string, password: string },
  ClientView<SignInMutationResult>
>

type StartChangeEmailMutation = FunctionReference<
  'mutation',
  'public',
  { newEmail: string, currentPassword: string },
  StartChangeEmailMutationResult
>

type CompleteChangeEmailMutation = FunctionReference<
  'mutation',
  'public',
  { emailCode: string, browserSecret: string },
  CompleteChangeEmailResult
>

type StartPasswordRecoveryMutation = FunctionReference<
  'mutation',
  'public',
  { email: string },
  StartPasswordRecoveryMutationResult
>

type CheckPasswordRecoveryQuery = FunctionReference<
  'query',
  'public',
  { emailCode: string, browserSecret: string },
  CheckPasswordRecoveryQueryResult
>

type CompletePasswordRecoveryMutation = FunctionReference<
  'mutation',
  'public',
  { emailCode: string, browserSecret: string, newPassword: string },
  ClientView<CompletePasswordRecoveryMutationResult>
>

/**
 * The functions that {@link useCompletePasswordRecovery} calls. The app's
 * `api.auth` has both of them.
 */
export type PasswordRecoveryApi = {
  checkPasswordRecovery: CheckPasswordRecoveryQuery
  completePasswordRecovery: CompletePasswordRecoveryMutation
}

/** The result of the `signIn` callback from {@link useSignInWithEmailPassword}. */
export type SignInResult
  = ClientView<SignInMutationResult> | SignInUnexpectedFailure

/** The result of the `signUp` callback from {@link useSignUpWithEmailPassword}. */
export type SignUpResult
  = WithoutSecret<ClientView<SignUpMutationResult>> | UnexpectedFailure

/** The result of the `startChangeEmail` callback from {@link useStartChangeEmail}. */
export type StartChangeEmailResult
  = WithoutSecret<StartChangeEmailMutationResult> | UnexpectedFailure

/** The result of the `startPasswordRecovery` callback from {@link useStartPasswordRecovery}. */
export type StartPasswordRecoveryResult
  = WithoutSecret<StartPasswordRecoveryMutationResult> | UnexpectedFailure

/**
 * The result of the `completePasswordRecovery` callback of the `ready` state
 * of {@link useCompletePasswordRecovery}.
 */
export type CompletePasswordRecoveryResult
  = ClientView<CompletePasswordRecoveryMutationResult> | SignInUnexpectedFailure

/**
 * The state of a landing page composable: `loading` until the link has been
 * presented, then `complete` or `error`.
 */
export type LinkFlowState<UserError>
  = | { status: 'loading' }
    | { status: 'complete' }
    | { status: 'error', userError: UserError }

/** The state of {@link useCompleteSignUpWithEmailPassword}. */
export type CompleteSignUpState = LinkFlowState<
  | SignInError<ClientView<CompleteSignUpResult>>
  | MissingSecretError
  | OtherError
>

/** The state of {@link useCompleteChangeEmail}. */
export type CompleteChangeEmailState = LinkFlowState<
  ExtractError<CompleteChangeEmailResult> | MissingSecretError | OtherError
>

/**
 * The errors about the link rather than about the new password: the errors
 * of `checkPasswordRecovery`. They end the flow: the user needs a new link.
 */
type PasswordRecoveryLinkError = ExtractError<CheckPasswordRecoveryQueryResult>

// One key for each link error. Thus a new error in the result of
// `checkPasswordRecovery` is a compile error here.
const PASSWORD_RECOVERY_LINK_ERRORS: Record<
  PasswordRecoveryLinkError['error'],
  true
> = { INVALID_CHALLENGE: true, INCORRECT_CODE: true }

function isPasswordRecoveryLinkError(
  userError: SignInError<ClientView<CompletePasswordRecoveryMutationResult>>,
): userError is PasswordRecoveryLinkError {
  return userError.error in PASSWORD_RECOVERY_LINK_ERRORS
}

/**
 * The state of {@link useCompletePasswordRecovery}. Unlike the other landing
 * page composables, the flow needs input from the user (the new password)
 * before it can complete, so a `ready` state carries the function to submit it.
 */
export type CompletePasswordRecoveryState
  = | { status: 'loading' }
    | {
      status: 'ready'
      /**
       * Set the new password and sign the user in. Errors about the new
       * password come back in the result and leave the state `ready`, so the
       * user can try another password with the same link.
       */
      completePasswordRecovery: (args: {
        newPassword: string
      }) => Promise<CompletePasswordRecoveryResult>
      /** `true` while `completePasswordRecovery` is in flight. */
      pending: boolean
    }
    | { status: 'complete' }
    | {
      status: 'error'
      userError: PasswordRecoveryLinkError | MissingSecretError
    }

/** The `code` query parameter of a link, as a value, a ref or a getter. */
type EmailCode = { emailCode: MaybeRefOrGetter<string> }

// ------------------------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------------------------

/**
 * `AuthClient.storage`. Upstream marks it `@internal`, so the published types
 * leave it out, and the client has it at runtime.
 */
type AuthClientWithStorage = AuthClient & { storage: SignInStorage }

function useAuthClient(): AuthClientWithStorage {
  const authClient = inject(AuthClientKey, undefined)
  if (authClient === undefined) {
    throw new Error('Must be used below `provideConvexAuth` (or within a <ConvexAuthProvider>).')
  }
  return authClient as AuthClientWithStorage
}

function useSecretStorage(): SignInStorage {
  return useAuthClient().storage
}

/**
 * The auth client's `withSignInPending`: while its call runs, the auth state
 * reports `isLoading` instead of signed out.
 */
function useWithSignInPending() {
  return useAuthClient().withSignInPending
}

/**
 * Track the in-flight state of async calls.
 */
function usePending() {
  const pending = ref(false)

  // We count the number of pending calls out of safety.
  // Normally apps shouldn’t start concurrent flows (e.g. they should disable
  // form submission when a current submission is ongoing), this is just a layer
  // of extra safey in case they don’t do it correctly.
  let inFlight = 0

  const track = async <T>(work: () => Promise<T>): Promise<T> => {
    inFlight++
    pending.value = true
    try {
      return await work()
    }
    finally {
      if (--inFlight === 0) pending.value = false
    }
  }
  return { pending, track }
}

const foldError = (cause: unknown): UnexpectedFailure => ({
  success: false,
  userError: { error: 'OTHER_ERROR', cause },
})

const foldSignInError = (cause: unknown): SignInUnexpectedFailure => ({
  status: 'error',
  userError: { error: 'OTHER_ERROR', cause },
})

/**
 * Present a link once, as soon as the page opens: wait for the auth client to
 * load, read the code and the flow's secret, run `complete` with them, and
 * clear the secret when the flow is done. A failed completion keeps the secret: the user may
 * have opened an older link, and the newest one must still work.
 *
 * Runs once the page is open in the browser. We want for this to run on page
 * load. This is acceptable: since we use browser secrets, we don’t need an
 * additional user confirmation.
 */
function useLinkFlow<UserError>(
  flow: EmailLinkFlow,
  emailCode: MaybeRefOrGetter<string>,
  complete: (
    browserSecret: string,
    code: string,
  ) => Promise<{ done: true } | { done: false, userError: UserError }>,
): ShallowRef<LinkFlowState<UserError | MissingSecretError | OtherError>> {
  const { isLoading } = useAuth()
  const storage = useSecretStorage()
  const state = shallowRef<
    LinkFlowState<UserError | MissingSecretError | OtherError>
  >({ status: 'loading' })

  // The watcher fires again when the auth client loads a second time.
  let started = false

  if (!import.meta.server) {
    watch(isLoading, (loading) => {
      if (loading || started) {
        return
      }
      started = true
      void (async () => {
        try {
          // Read the code before the first `await`, as upstream's effect uses
          // the `complete` of the render it started in: a getter read later
          // could return another link's code for this link's secret.
          const code = toValue(emailCode)
          const browserSecret = await storage.get(SECRET_STORAGE_KEYS[flow])
          if (browserSecret === null || browserSecret === undefined) {
            state.value = { status: 'error', userError: { error: 'MISSING_SECRET' } }
            return
          }
          const result = await complete(browserSecret, code)
          if (result.done) {
            await storage.remove(SECRET_STORAGE_KEYS[flow])
            state.value = { status: 'complete' }
          }
          else {
            state.value = { status: 'error', userError: result.userError }
          }
        }
        catch (cause) {
          state.value = {
            status: 'error',
            userError: { error: 'OTHER_ERROR', cause },
          }
        }
      })()
    }, { immediate: true })
  }

  return state
}

// ------------------------------------------------------------------------------
// Sign-in
// ------------------------------------------------------------------------------

/**
 * Client for the sign-in flow: run the `signInWithEmailPassword` mutation and, on
 * success, establish an authenticated session.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '../convex/_generated/api'
 *
 * const { signIn, pending } = useSignInWithEmailPassword(api.auth)
 * const email = ref('')
 * const password = ref('')
 * const error = ref<string | null>(null)
 *
 * async function onSubmit() {
 *   const result = await signIn({ email: email.value, password: password.value })
 *   // map result.userError (INVALID_CREDENTIALS, …) to a message
 *   error.value = result.status === 'error' ? result.userError.error : null
 * }
 * </script>
 * ```
 *
 * @param api The functions of the method, usually `api.auth`.
 * @public
 */
export function useSignInWithEmailPassword(api: {
  signInWithEmailPassword: SignInMutation
}): {
  signIn: (credentials: { email: string, password: string }) => Promise<SignInResult>
  pending: Ref<boolean>
} {
  const signInMutation = api.signInWithEmailPassword
  const { setSession } = useAuthActions()
  const signInApi = useAuthSignInApi()
  const { pending, track } = usePending()

  const signIn = async (credentials: {
    email: string
    password: string
  }): Promise<SignInResult> =>
    track(async () => {
      try {
        const result = await signInApi.mutation(signInMutation, credentials)
        if (result.status === 'complete') {
          await setSession(result.tokens)
        }
        return result
      }
      catch (cause) {
        return foldSignInError(cause)
      }
    })

  return { signIn, pending }
}

// ------------------------------------------------------------------------------
// Sign-up
// ------------------------------------------------------------------------------

/**
 * Client for the sign-up flow: run the `signUpWithEmailPassword` mutation and keep
 * the returned secret for {@link useCompleteSignUpWithEmailPassword}.
 *
 * A successful sign-up does *not* sign the user in: it sends the validation
 * email. Tell the user to open the link (in this same browser).
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '../convex/_generated/api'
 *
 * const { signUp, pending } = useSignUpWithEmailPassword(api.auth)
 * const email = ref('')
 * const password = ref('')
 * const error = ref<string | null>(null)
 * const sentTo = ref<string | null>(null)
 *
 * async function onSubmit() {
 *   const result = await signUp({ email: email.value, password: password.value })
 *   if (result.success) {
 *     sentTo.value = email.value
 *   }
 *   else {
 *     // map result.userError (EMAIL_TAKEN, PASSWORD_TOO_SHORT, …) to a message
 *     error.value = result.userError.error
 *   }
 * }
 * </script>
 * ```
 *
 * @param api The functions of the method, usually `api.auth`.
 * @public
 */
export function useSignUpWithEmailPassword(api: {
  signUpWithEmailPassword: SignUpMutation
}): {
  signUp: (credentials: { email: string, password: string }) => Promise<SignUpResult>
  pending: Ref<boolean>
} {
  const signUpMutation = api.signUpWithEmailPassword
  // Sign-up mints no session, so it calls Convex directly rather than going
  // through the `AuthSignInApi`. Under SSR, that API is the auth proxy, which
  // only serves functions returning the sign-in envelope.
  const runSignUp = useMutation(signUpMutation)
  const storage = useSecretStorage()
  const { pending, track } = usePending()

  const signUp = async (credentials: {
    email: string
    password: string
  }): Promise<SignUpResult> =>
    track(async () => {
      try {
        const result = await runSignUp(credentials)
        if (result.success) {
          await storage.set(SECRET_STORAGE_KEYS.signUp, result.browserSecret)
          return { success: true }
        }
        return result
      }
      catch (cause) {
        return foldError(cause)
      }
    })

  return { signUp, pending }
}

/**
 * Client for the landing page of the validation link: as soon as the page
 * opens, present the code from the link with the secret stored by
 * {@link useSignUpWithEmailPassword}, and adopt the minted session.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '../convex/_generated/api'
 *
 * const route = useRoute()
 * const state = useCompleteSignUpWithEmailPassword(api.auth, {
 *   emailCode: () => String(route.query.code),
 * })
 * // state.value.status: 'loading' (validating…), 'complete' (signed in),
 * // or 'error' (map state.value.userError to a message)
 * </script>
 * ```
 *
 * @param api The functions of the method, usually `api.auth`.
 * @param emailCode The `code` query parameter of the link.
 * @public
 */
export function useCompleteSignUpWithEmailPassword(
  api: { completeSignUpWithEmailPassword: CompleteSignUpMutation },
  { emailCode }: EmailCode,
): ShallowRef<CompleteSignUpState> {
  const completeSignUpMutation = api.completeSignUpWithEmailPassword
  const { setSession } = useAuthActions()
  const signInApi = useAuthSignInApi()
  const withSignInPending = useWithSignInPending()

  // Keep `isLoading` true while the server validates the link and the client
  // stores the new session, so the app does not see a signed-out user and
  // go to the sign-in page during this time.
  const complete = (browserSecret: string, code: string) =>
    withSignInPending(async () => {
      const result = await signInApi.mutation(completeSignUpMutation, {
        emailCode: code,
        browserSecret,
      })
      if (result.status === 'complete') {
        await setSession(result.tokens)
        return { done: true } as const
      }
      return { done: false, userError: result.userError } as const
    })

  return useLinkFlow<SignInError<ClientView<CompleteSignUpResult>>>(
    'signUp',
    emailCode,
    complete,
  )
}

// ------------------------------------------------------------------------------
// Password recovery
// ------------------------------------------------------------------------------

/**
 * Client for starting a password recovery: run the backend's
 * `startPasswordRecovery` mutation and keep the returned secret for
 * {@link useCompletePasswordRecovery}. On success, `sentTo` gives the address
 * that received the link. Show this address to the user, not the typed one:
 * the two can differ in case or in Unicode form.
 *
 * @param api The functions of the method, usually `api.auth`.
 * @public
 */
export function useStartPasswordRecovery(api: {
  startPasswordRecovery: StartPasswordRecoveryMutation
}): {
  startPasswordRecovery: (args: { email: string }) => Promise<StartPasswordRecoveryResult>
  pending: Ref<boolean>
} {
  const startPasswordRecoveryMutation = api.startPasswordRecovery
  const runStartPasswordRecovery = useMutation(startPasswordRecoveryMutation)
  const storage = useSecretStorage()
  const { pending, track } = usePending()

  const startPasswordRecovery = async (args: { email: string }): Promise<StartPasswordRecoveryResult> =>
    track(async () => {
      try {
        const result = await runStartPasswordRecovery(args)
        if (result.success) {
          await storage.set(
            SECRET_STORAGE_KEYS.passwordRecovery,
            result.browserSecret,
          )
          return { success: true, sentTo: result.sentTo }
        }
        return result
      }
      catch (cause) {
        return foldError(cause)
      }
    })

  return { startPasswordRecovery, pending }
}

/**
 * Client for the landing page of the password-reset link. As soon as the page
 * opens, it reads the secret stored by {@link useStartPasswordRecovery} and
 * subscribes to `checkPasswordRecovery` with it and the code from the link.
 * When the link can be used, the state is `ready`, with the function that
 * sets the new password and adopts the minted session. When the link cannot
 * be used, the state is `error`, so the page does not ask for a password.
 *
 * The check is a subscription, thus the state moves to `error` on its own
 * when the link dies while the page is open: another tab claims it, or it
 * expires and the server erases it.
 *
 * The composable does not complete the flow by itself: the flow needs the new
 * password, so call `completePasswordRecovery` when the user submits the
 * form. An error about the password keeps the state `ready`, so show it in
 * the form. An error about the link moves the state to `error`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '../convex/_generated/api'
 *
 * const route = useRoute()
 * const state = useCompletePasswordRecovery(api.auth, {
 *   emailCode: () => String(route.query.code),
 * })
 * const newPassword = ref('')
 * const error = ref<string | null>(null)
 *
 * async function onSubmit() {
 *   if (state.value.status !== 'ready') return
 *   const result = await state.value.completePasswordRecovery({ newPassword: newPassword.value })
 *   // map result.userError (PASSWORD_TOO_SHORT, …) to a message
 *   error.value = result.status === 'error' ? result.userError.error : null
 * }
 * </script>
 * ```
 *
 * @param recoveryApi The app's `checkPasswordRecovery` query and
 * `completePasswordRecovery` mutation references, for example `api.auth`.
 * @param emailCode The `code` query parameter of the link.
 * @public
 */
export function useCompletePasswordRecovery(
  recoveryApi: PasswordRecoveryApi,
  { emailCode }: EmailCode,
): ComputedRef<CompletePasswordRecoveryState> {
  const { checkPasswordRecovery } = recoveryApi
  const completeMutation = recoveryApi.completePasswordRecovery
  const { isLoading } = useAuth()
  const { setSession } = useAuthActions()
  const signInApi = useAuthSignInApi()
  const storage = useSecretStorage()
  const { pending, track } = usePending()
  // The secret from storage: not read yet, missing, or found.
  const browserSecret = shallowRef<undefined | null | string>(undefined)
  // The end of the flow, once `completePasswordRecovery` reaches it. It
  // wins over the check: a completed link is a dead link for the check.
  const outcome = shallowRef<
    Extract<CompletePasswordRecoveryState, { status: 'complete' | 'error' }>
  >()

  if (!import.meta.server) {
    watch(isLoading, (loading) => {
      if (loading) {
        return
      }
      void (async () => {
        const secret = await storage.get(SECRET_STORAGE_KEYS.passwordRecovery)
        browserSecret.value = secret ?? null
      })()
    }, { immediate: true })
  }

  const check = useQuery(
    checkPasswordRecovery,
    () => typeof browserSecret.value === 'string'
      ? { emailCode: toValue(emailCode), browserSecret: browserSecret.value }
      : 'skip',
  )

  const completePasswordRecovery = async ({
    newPassword,
  }: {
    newPassword: string
  }): Promise<CompletePasswordRecoveryResult> =>
    track(async () => {
      const secret = browserSecret.value
      if (typeof secret !== 'string') {
        // Only reachable through the `ready` state, which has the secret.
        throw new Error(
          'completePasswordRecovery was called before the flow was ready',
        )
      }
      try {
        const result = await signInApi.mutation(completeMutation, {
          emailCode: toValue(emailCode),
          browserSecret: secret,
          newPassword,
        })
        if (result.status === 'complete') {
          await setSession(result.tokens)
          await storage.remove(SECRET_STORAGE_KEYS.passwordRecovery)
          outcome.value = { status: 'complete' }
        }
        else if (isPasswordRecoveryLinkError(result.userError)) {
          outcome.value = { status: 'error', userError: result.userError }
        }
        return result
      }
      catch (cause) {
        return foldSignInError(cause)
      }
    })

  return computed((): CompletePasswordRecoveryState => {
    if (outcome.value !== undefined) {
      return outcome.value
    }
    if (browserSecret.value === null) {
      return { status: 'error', userError: { error: 'MISSING_SECRET' } }
    }
    if (browserSecret.value === undefined || check.value === undefined) {
      return { status: 'loading' }
    }
    // While `completePasswordRecovery` runs, the claim of the link reaches
    // the subscription before the mutation result reaches the page. Keep the
    // form until the result says what happened to the link.
    if (!check.value.success && !pending.value) {
      return { status: 'error', userError: check.value.userError }
    }
    return { status: 'ready', completePasswordRecovery, pending: pending.value }
  })
}

// ------------------------------------------------------------------------------
// Email change
// ------------------------------------------------------------------------------

/**
 * Client for starting an email change: run the backend's `startChangeEmail`
 * mutation and keep the returned secret for {@link useCompleteChangeEmail}.
 *
 * @param api The functions of the method, usually `api.auth`.
 * @public
 */
export function useStartChangeEmail(api: {
  startChangeEmail: StartChangeEmailMutation
}): {
  startChangeEmail: (args: { newEmail: string, currentPassword: string }) => Promise<StartChangeEmailResult>
  pending: Ref<boolean>
} {
  const startChangeEmailMutation = api.startChangeEmail
  const runStartChangeEmail = useMutation(startChangeEmailMutation)
  const storage = useSecretStorage()
  const { pending, track } = usePending()

  const startChangeEmail = async (args: {
    newEmail: string
    currentPassword: string
  }): Promise<StartChangeEmailResult> =>
    track(async () => {
      try {
        const result = await runStartChangeEmail(args)
        if (result.success) {
          await storage.set(
            SECRET_STORAGE_KEYS.changeEmail,
            result.browserSecret,
          )
          return { success: true }
        }
        return result
      }
      catch (cause) {
        return foldError(cause)
      }
    })

  return { startChangeEmail, pending }
}

/**
 * Client for the landing page of the email-change confirmation link: as soon
 * as the page opens, present the code from the link with the secret stored by
 * {@link useStartChangeEmail}. No session is adopted: the user already has
 * one, and the backend requires it.
 *
 * @param api The functions of the method, usually `api.auth`.
 * @param emailCode The `code` query parameter of the link.
 * @public
 */
export function useCompleteChangeEmail(
  api: { completeChangeEmail: CompleteChangeEmailMutation },
  { emailCode }: EmailCode,
): ShallowRef<CompleteChangeEmailState> {
  const completeChangeEmailMutation = api.completeChangeEmail
  const runCompleteChangeEmail = useMutation(completeChangeEmailMutation)

  const complete = async (browserSecret: string, code: string) => {
    const result = await runCompleteChangeEmail({ emailCode: code, browserSecret })
    if (result.success) {
      return { done: true } as const
    }
    return { done: false, userError: result.userError } as const
  }

  return useLinkFlow<ExtractError<CompleteChangeEmailResult>>(
    'changeEmail',
    emailCode,
    complete,
  )
}
