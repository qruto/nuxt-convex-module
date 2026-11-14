/**
 * Vue client for the Google sign-in method: a port of
 * `@convex-dev/auth/methods/google/react`.
 *
 * {@link useSignInWithGoogle} starts the sign-in. {@link useOauth} returns the
 * state that is shared by all the OAuth methods, for example the error of the
 * last flow.
 *
 * ```ts
 * const { signIn } = useSignInWithGoogle(api.auth)
 * const { flowError } = useOauth()
 * ```
 *
 * @module convex-auth/methods/google
 */
import type { OauthProviderApi } from '../../upstream/methods/oauth/client'
import { useOauthSignIn, type UseOauthSignInReturn } from './oauth'

export { useOauth, type UseOauthReturn } from './oauth'
export type {
  OauthCompleteResult,
  OauthFlowError,
  OauthStartResult,
  SignInOptions,
} from '../../upstream/methods/oauth/client'

/** What {@link useSignInWithGoogle} returns. */
export type UseSignInWithGoogleReturn = {
  /** Start Google's OAuth flow. See {@link UseOauthSignInReturn.signIn}. */
  signIn: UseOauthSignInReturn['signIn']
}

/**
 * Sign in with Google. Pass the module exporting the functions of the method
 * (usually the generated `api.auth`), or an object mapping the canonical keys
 * to renamed exports.
 *
 * @public
 */
export function useSignInWithGoogle(api: {
  startSignInWithGoogle: OauthProviderApi['startSignIn']
  completeSignInWithGoogle: OauthProviderApi['completeSignIn']
}): UseSignInWithGoogleReturn {
  const { signIn } = useOauthSignIn({
    providerName: 'google',
    startSignIn: api.startSignInWithGoogle,
    completeSignIn: api.completeSignInWithGoogle,
  })
  return { signIn }
}
