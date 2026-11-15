/**
 * Vue client for the Apple sign-in method: a port of
 * `@convex-dev/auth/methods/apple/react`.
 *
 * {@link useSignInWithApple} starts the sign-in. {@link useOauth} returns the
 * state that is shared by all the OAuth methods, for example the error of the
 * last flow.
 *
 * ```ts
 * const { signIn } = useSignInWithApple(api.auth)
 * const { flowError } = useOauth()
 * ```
 *
 * @module convex-auth/methods/apple
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

/** What {@link useSignInWithApple} returns. */
export type UseSignInWithAppleReturn = {
  /** Start Apple's OAuth flow. See {@link UseOauthSignInReturn.signIn}. */
  signIn: UseOauthSignInReturn['signIn']
}

/**
 * Sign in with Apple. Pass the module exporting the functions of the method
 * (usually the generated `api.auth`), or an object mapping the canonical keys
 * to renamed exports.
 *
 * @public
 */
export function useSignInWithApple(api: {
  startSignInWithApple: OauthProviderApi['startSignIn']
  completeSignInWithApple: OauthProviderApi['completeSignIn']
}): UseSignInWithAppleReturn {
  const { signIn } = useOauthSignIn({
    providerName: 'apple',
    startSignIn: api.startSignInWithApple,
    completeSignIn: api.completeSignInWithApple,
  })
  return { signIn }
}
