/**
 * Vue client for the `emailMagicLink` method: a port of
 * `@convex-dev/auth/methods/email-magic-link/react`.
 *
 * @module convex-auth/methods/email-magic-link
 */
import type { AuthClient } from '@convex-dev/auth/browser'
import type {
  SendResult as SendMutationResult,
  SignInResult as SignInMutationResult,
} from '@convex-dev/auth/methods/email-magic-link/server'
import type { FunctionReference } from 'convex/server'
import { inject, ref, shallowRef, toValue, watch, type MaybeRefOrGetter, type Ref, type ShallowRef } from 'vue'
import { useMutation } from '../../../vue/composables/use-mutation'
import type { SignInStorage } from '../../upstream/browser/storage'
import type { ClientView } from '../../upstream/lib/types'
import { AuthClientKey, useAuth, useAuthSignInApi } from '../client'
import { useAuthActions } from '../index'

// Two sign-ins in one browser share this key: the second one replaces the
// secret of the first, thus only the newest link works.
const SECRET_STORAGE_KEY = '__convexAuthEmailMagicLinkSecret'

/** The mutation threw rather than resolving to a `userError`. */
type OtherError = { error: 'OTHER_ERROR', cause: unknown }

/**
 * The link was opened in a browser that did not start the sign-in: the
 * secret is not in this browser's storage.
 */
type MissingSecretError = { error: 'MISSING_SECRET' }

type SendMutation = FunctionReference<
  'mutation',
  'public',
  { email: string },
  SendMutationResult
>

type SignInMutation = FunctionReference<
  'mutation',
  'public',
  { emailCode: string, browserSecret: string },
  ClientView<SignInMutationResult>
>

/** The result of the `sendMagicLink` callback from {@link useSendEmailMagicLink}. */
export type SendResult
  = | { success: true }
    | Extract<SendMutationResult, { success: false }>
    | { success: false, userError: OtherError }

/** The state of {@link useSignInWithEmailMagicLink}. */
export type SignInState
  = | { status: 'loading' }
    | { status: 'complete' }
    | {
      status: 'error'
      userError:
        | Extract<
          ClientView<SignInMutationResult>,
          { status: 'error' }
        >['userError']
        | MissingSecretError
        | OtherError
    }

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

/**
 * Client for the one form of the method: send a sign-in link to the address,
 * and keep the returned secret for {@link useSignInWithEmailMagicLink}. The
 * same call serves a person who has an account and a person who has none.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '../convex/_generated/api'
 *
 * const { sendMagicLink, pending } = useSendEmailMagicLink(api.auth)
 * const email = ref('')
 * const sent = ref(false)
 * const error = ref<string | null>(null)
 *
 * async function onSubmit() {
 *   error.value = null
 *   const result = await sendMagicLink({ email: email.value })
 *   if (result.success) {
 *     sent.value = true
 *   }
 *   else {
 *     // map result.userError (INVALID_EMAIL, RATE_LIMITED, …) to a message
 *     error.value = result.userError.error
 *   }
 * }
 * </script>
 * ```
 *
 * @param api The functions of the method, usually `api.auth`.
 * @public
 */
export function useSendEmailMagicLink(api: {
  sendEmailMagicLink: SendMutation
}): {
  sendMagicLink: (args: { email: string }) => Promise<SendResult>
  pending: Ref<boolean>
} {
  // Sending the link mints no session, so it calls Convex directly rather
  // than going through the `AuthSignInApi`.
  const runSend = useMutation(api.sendEmailMagicLink)
  const { storage } = useAuthClient()
  const pending = ref(false)
  // Count the calls in flight, so that `pending` stays true until the last
  // one ends if the app starts a second call before the first one ends.
  let inFlight = 0

  const sendMagicLink = async (args: { email: string }): Promise<SendResult> => {
    inFlight++
    pending.value = true
    try {
      const result = await runSend(args)
      if (result.success) {
        await storage.set(SECRET_STORAGE_KEY, result.browserSecret)
        return { success: true }
      }
      return result
    }
    catch (cause) {
      return { success: false, userError: { error: 'OTHER_ERROR', cause } }
    }
    finally {
      if (--inFlight === 0) pending.value = false
    }
  }

  return { sendMagicLink, pending }
}

/**
 * Client for the landing page of the link: as soon as the page opens,
 * present the code from the link with the secret stored by
 * {@link useSendEmailMagicLink}, and adopt the minted session.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '../convex/_generated/api'
 *
 * const route = useRoute()
 * const state = useSignInWithEmailMagicLink(api.auth, {
 *   emailCode: () => String(route.query.code),
 * })
 * // state.value.status: 'loading' (signing in…), 'complete' (signed in),
 * // or 'error' (map state.value.userError to a message)
 * </script>
 * ```
 *
 * @param api The functions of the method, usually `api.auth`.
 * @param emailCode The `code` query parameter of the link.
 * @public
 */
export function useSignInWithEmailMagicLink(
  api: { signInWithEmailMagicLink: SignInMutation },
  { emailCode }: { emailCode: MaybeRefOrGetter<string> },
): ShallowRef<SignInState> {
  const signInMutation = api.signInWithEmailMagicLink
  const { setSession } = useAuthActions()
  const signInApi = useAuthSignInApi()
  const { storage, withSignInPending } = useAuthClient()
  const { isLoading } = useAuth()
  const state = shallowRef<SignInState>({ status: 'loading' })

  // Present the link once: the watcher fires again when the auth client
  // loads a second time.
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
          // the `emailCode` of the render it started in: a getter read later
          // could return another link's code for this link's secret.
          const code = toValue(emailCode)
          const browserSecret = await storage.get(SECRET_STORAGE_KEY)
          if (browserSecret === null || browserSecret === undefined) {
            state.value = { status: 'error', userError: { error: 'MISSING_SECRET' } }
            return
          }
          // Keep `isLoading` true while the server checks the link and the
          // client stores the new session.
          const result = await withSignInPending(async () => {
            const result = await signInApi.mutation(signInMutation, {
              emailCode: code,
              browserSecret,
            })
            if (result.status === 'complete') {
              await setSession(result.tokens)
            }
            return result
          })
          if (result.status === 'complete') {
            await storage.remove(SECRET_STORAGE_KEY)
            state.value = { status: 'complete' }
          }
          else {
            // A failed sign-in keeps the secret: the person may have opened an
            // older link, and the newest one must still work.
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
