/**
 * Vue client for the GitHub sign-in method: a port of
 * `@convex-dev/auth/methods/github/react`.
 *
 * {@link useSignInWithGithub} starts the sign-in. {@link useOauth} returns the
 * state that is shared by all the OAuth methods, for example the error of the
 * last flow.
 *
 * ```ts
 * const { signIn } = useSignInWithGithub(api.auth)
 * const { flowError } = useOauth()
 * ```
 *
 * @module convex-auth/methods/github
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

/** What {@link useSignInWithGithub} returns. */
export type UseSignInWithGithubReturn = {
  /** Start GitHub's OAuth flow. See {@link UseOauthSignInReturn.signIn}. */
  signIn: UseOauthSignInReturn['signIn']
}

/**
 * Sign in with GitHub. Pass the module exporting the functions of the method
 * (usually the generated `api.auth`), or an object mapping the canonical keys
 * to renamed exports.
 *
 * @public
 */
export function useSignInWithGithub(api: {
  startSignInWithGithub: OauthProviderApi['startSignIn']
  completeSignInWithGithub: OauthProviderApi['completeSignIn']
}): UseSignInWithGithubReturn {
  const { signIn } = useOauthSignIn({
    providerName: 'github',
    startSignIn: api.startSignInWithGithub,
    completeSignIn: api.completeSignInWithGithub,
  })
  return { signIn }
}
