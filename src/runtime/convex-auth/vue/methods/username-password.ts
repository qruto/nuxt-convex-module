/**
 * Vue client for the `usernamePassword` method: a port of
 * `@convex-dev/auth/methods/username-password/react`.
 *
 * A method's job on the client is to run its own sign-in flow and hand the
 * resulting token bundle to the core client's `setSession` (see {@link
 * useAuthActions}).
 *
 * The `usernamePassword` method has two flows and provides a composable for each:
 *  1. signing in to an existing account ({@link useSignInWithUsernamePassword})
 *  2. signing up a new one ({@link useSignUpWithUsernamePassword})
 *
 * Each composable returns a function for sending up the credentials and a
 * `pending` ref that is flipped to `true` while the credentials are being
 * validated.
 *
 * @module convex-auth/methods/username-password
 */
import type { SignInResult, SignUpResult } from '@convex-dev/auth/methods/username-password/server'
import type { FunctionReference } from 'convex/server'
import { ref, type Ref } from 'vue'
import type { ClientView } from '../../upstream/lib/types'
import { useAuthSignInApi } from '../client'
import { useAuthActions } from '../index'

/** The `(username, password)` pair both flows accept. */
export type Credentials = { username: string, password: string }

/**
 * The `signInWithUsernamePassword` mutation the app re-exports from its `setupUsernamePassword`.
 *
 * Its return value is the access-only {@link ClientView}, which is what both
 * session models have in common. Hand it to `setSession`, the only supported
 * consumer.
 */
type SignInWithUsernamePasswordMutation = FunctionReference<
  'mutation',
  'public',
  Credentials,
  ClientView<SignInResult>
>

/**
 * The `signUpWithUsernamePassword` mutation the app re-exports from its `setupUsernamePassword`.
 */
type SignUpWithUsernamePasswordMutation = FunctionReference<
  'mutation',
  'public',
  Credentials,
  ClientView<SignUpResult>
>

/**
 * A failure the client produces that the server never returns: the mutation
 * threw (a network blip, a bug, an unexpected server error) rather than
 * resolving to a `userError`. The flow composables fold that into the result as
 * `OTHER_ERROR` so callers handle *every* failure through the one `userError`
 * switch and never need their own `try`/`catch`. The thrown value is preserved
 * on `cause` for callers that want to inspect or log it.
 */
type UnexpectedFailure = {
  status: 'error'
  userError: { error: 'OTHER_ERROR', cause: unknown }
}

/** The result of the `signIn` callback from {@link useSignInWithUsernamePassword}. */
export type SignInWithUsernamePasswordResult
  = ClientView<SignInResult> | UnexpectedFailure

/** The result of the `signUp` callback from {@link useSignUpWithUsernamePassword}. */
export type SignUpWithUsernamePasswordResult
  = ClientView<SignUpResult> | UnexpectedFailure

/**
 * Client for the sign-in flow of the `usernamePassword` method: wire the backend's
 * `signInWithUsernamePassword` mutation to the core client.
 *
 * The returned `signIn` runs the mutation with the given credentials and, on
 * success, establishes an authenticated session with your Convex backend.
 *
 * The `pending` ref returned will let you know if the credentials are
 * currently being validated.
 *
 * After calling `signIn`, check the `status` field on the return value to see
 * whether the sign-in was successful or if you need to handle an error.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '../convex/_generated/api'
 *
 * const { signIn, pending } = useSignInWithUsernamePassword(api.auth)
 * const username = ref('')
 * const password = ref('')
 *
 * async function onSubmit() {
 *   const result = await signIn({ username: username.value, password: password.value })
 *   if (result.status !== 'complete') {
 *     // map result.userError to a message
 *   }
 * }
 * </script>
 * ```
 *
 * @param api The functions of the method, usually `api.auth`.
 * @public
 */
export function useSignInWithUsernamePassword(api: {
  signInWithUsernamePassword: SignInWithUsernamePasswordMutation
}) {
  const { run, pending } = usePasswordFlow(api.signInWithUsernamePassword)
  return {
    /**
     * Passes up the given credentials to perform a username/password sign in.
     *
     * Returns an object with a `status` field.
     *
     * If it is `"complete"` the sign-in was successful and the client will
     * establish an authenticated session with the Convex backend server.
     *
     * If it is `"error"` the returned object will have a `userError` field with
     * additional details about why sign-in failed.
     */
    signIn: run,
    /** `true` if the sign-in attempt is being validated. */
    pending,
  }
}

/**
 * Client for the sign-up flow of the `usernamePassword` method: wire the backend's
 * `signUpWithUsernamePassword` mutation to the core client.
 *
 * The returned `signUp` runs the mutation with the given credentials and, on
 * success, establishes an authenticated session with your Convex backend.
 *
 * The `pending` ref returned will let you know if the credentials are
 * currently being validated.
 *
 * After calling `signUp`, check the `status` field on the return value to see
 * whether the sign-up was successful or if you need to handle an error.
 *
 * @param api The functions of the method, usually `api.auth`.
 * @public
 */
export function useSignUpWithUsernamePassword(api: {
  signUpWithUsernamePassword: SignUpWithUsernamePasswordMutation
}) {
  const { run, pending } = usePasswordFlow(api.signUpWithUsernamePassword)
  return {
    /**
     * Passes up the given credentials to perform a username/password sign up.
     *
     * Returns an object with a `status` field.
     *
     * If it is `"complete"` the sign-up was successful and the client will
     * establish an authenticated session with the Convex backend server.
     *
     * If it is `"error"` the returned object will have a `userError` field with
     * additional details about why sign-up failed.
     */
    signUp: run,
    /** `true` if the sign-up attempt is being validated. */
    pending,
  }
}

/**
 * Shared internals for sign-in and sign-up: run the mutation, adopt the
 * session on success, and track in-flight state. The two flows are
 * structurally identical and differ only in the mutation they call and the
 * name they expose the callback under.
 */
function usePasswordFlow<
  Result extends ClientView<SignInResult> | ClientView<SignUpResult>,
>(mutation: FunctionReference<'mutation', 'public', Credentials, Result>): {
  run: (credentials: Credentials) => Promise<Result | UnexpectedFailure>
  pending: Ref<boolean>
} {
  const { setSession } = useAuthActions()
  // Running through the signInApi rather than `useAction` is what lets these
  // composables serve both session models. See {@link useAuthSignInApi}.
  const signInApi = useAuthSignInApi()
  const pending = ref(false)

  const run = async (credentials: Credentials): Promise<Result | UnexpectedFailure> => {
    pending.value = true
    try {
      const result = await signInApi.mutation(mutation, credentials)
      if (result.status === 'complete') {
        await setSession(result.tokens)
      }
      return result
    }
    catch (cause) {
      // The mutation threw instead of resolving to a `userError`. Fold it into
      // the same discriminated result as `OTHER_ERROR`, preserving the thrown
      // value on `cause`, so the caller handles it alongside every other
      // failure and can still inspect or log the original error if it wants.
      return { status: 'error', userError: { error: 'OTHER_ERROR', cause } }
    }
    finally {
      // Reset even when the mutation throws.
      pending.value = false
    }
  }

  return { run, pending }
}
