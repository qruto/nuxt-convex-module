/**
 * The shared body of the passkey sign-in composable. Each entry point binds
 * it to the {@link ResolvedPasskeyCeremonies} of its platform. A port of
 * `@convex-dev/auth`'s `methods/username-passkey/hooks.tsx`.
 */
import { computed, type ComputedRef, type Ref, type ShallowRef } from 'vue'
import { useConvexOrThrow } from '../../../../vue/client'
import type { SignInError } from '../../../upstream/lib/types'
import type {
  ResolvedPasskeyCeremonies,
  PasskeyClientError,
  PasskeyClientFailure,
} from '../../../upstream/methods/username-passkey/ceremonies'
import {
  runSignInOrSignUpFlow,
  type SignInFlowContext,
  type UsernamePasskeyApi,
  type UsernamePasskeyAutofillError,
  type SignInFlowResult,
} from '../../../upstream/methods/username-passkey/flows'
import { useAuthSignInApi } from '../../client'
import { useAuthActions } from '../../index'
import {
  usePasskeyAutofill,
  usePasskeyCeremonySlot,
  type AlreadyPendingError,
  type AlreadyPendingFailure,
  type PasskeyAutofillStatus,
} from './impl'

/**
 * The result of the `signIn` callback from `useSignInWithUsernamePasskey`.
 *
 * A completed sign-in carries a `flow` discriminant: `"signUp"` when the
 * ceremony created a new account, `"signIn"` when it authenticated an existing
 * one. `ALREADY_PENDING` comes back when a `signIn` call runs while the
 * previous one still does, or while an autofill sign-in is verified.
 */
export type SignInWithUsernamePasskeyResult
  = SignInFlowResult | SignInError<PasskeyClientError | AlreadyPendingError>

/**
 * The body of `useSignInWithUsernamePasskey`, for the given platform.
 *
 * @param usernamePasskeyApi The functions of the method, usually `api.auth`.
 * @param ceremonies The passkey ceremonies of the platform.
 */
export function useSignInWithUsernamePasskeyImpl(
  usernamePasskeyApi: UsernamePasskeyApi,
  ceremonies: ResolvedPasskeyCeremonies,
): {
  /**
   * Runs the identifier-first passkey flow for the given username.
   *
   * Returns an object with a `status` field.
   *
   * If it is `"complete"` the sign-in (or the account creation) was
   * successful and the client will establish an authenticated session
   * with the Convex backend server. The `flow` field tells which one
   * it was: `"signUp"` created a new account, `"signIn"` authenticated
   * an existing one.
   *
   * If it is `"error"` the returned object will have a `userError` field
   * with additional details about why sign-in failed.
   */
  signIn: (args: { username: string }) => Promise<SignInWithUsernamePasskeyResult>
  /**
   * `true` while a sign-in runs: a `signIn` call, or an autofill
   * sign-in that the server verifies (`autofill.status` is
   * `"signingIn"`). A `signIn` call in this time returns
   * `ALREADY_PENDING`.
   */
  pending: ComputedRef<boolean>
  /**
   * The state of the autofill flow:
   *
   * - `available`: whether the platform can offer passkeys in the
   *   autocompletion list; `null` while the detection runs.
   * - `status`: the state of the request; see
   *   {@link PasskeyAutofillStatus}.
   * - `lastError`: the most recent failure, for display or logging.
   */
  autofill: {
    available: Ref<boolean | null>
    status: Ref<PasskeyAutofillStatus>
    lastError: ShallowRef<UsernamePasskeyAutofillError | null>
  }
} {
  const { setSession } = useAuthActions()

  // Using useAuthSignInApi for mutations that return a session to support SSR
  const signInApi = useAuthSignInApi()
  const convex = useConvexOrThrow('useSignInWithUsernamePasskey')

  const startAutofillSignIn = usernamePasskeyApi.startAutofillSignInWithUsernamePasskey
  const finishSignIn = usernamePasskeyApi.finishSignInWithUsernamePasskey
  const ctx: SignInFlowContext = {
    // The flows only call `mutation`, which the Vue client has.
    convex: convex as unknown as SignInFlowContext['convex'],
    api: usernamePasskeyApi,
    signInApi,
    setSession,
    ceremonies,
  }

  const autofill = usePasskeyAutofill<UsernamePasskeyAutofillError>({
    ceremonies,
    start: async () => {
      const { options } = await convex.mutation(startAutofillSignIn, {})
      return options
    },
    onAssertion: async (response) => {
      const result = await signInApi.mutation(finishSignIn, { response })
      if (result.status !== 'complete') {
        // The autofill loop takes its own `success` boolean, not the
        // envelope: it retries on a failed assertion rather than handing
        // the arm back to the caller.
        return { success: false, userError: result.userError }
      }

      await setSession(result.tokens)
      return { success: true }
    },
  })

  const { run, pending } = usePasskeyCeremonySlot({ autofill })

  const signIn = async ({
    username,
  }: {
    username: string
  }): Promise<SignInWithUsernamePasskeyResult> => {
    const signInResult = await run(() =>
      runSignInOrSignUpFlow(ctx, { username }),
    )
    if ('status' in signInResult) {
      // This is the result of `runSignInOrSignUpFlow`. It can be directly
      // returned.
      return signInResult
    }
    // The `run` wrapper is generic and can return a `success: false` error.
    // We handle that here and package it as a sign-in failure with
    // `status: "error"`.
    signInResult satisfies PasskeyClientFailure | AlreadyPendingFailure
    return { status: 'error', userError: signInResult.userError }
  }

  return {
    signIn,
    pending: computed(() => pending.value || autofill.status.value === 'signingIn'),
    autofill: {
      available: autofill.available,
      status: autofill.status,
      lastError: autofill.lastError,
    },
  }
}
