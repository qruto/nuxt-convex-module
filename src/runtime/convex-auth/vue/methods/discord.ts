/**
 * Vue client for the Discord sign-in method: a port of
 * `@convex-dev/auth/methods/discord/react`.
 *
 * {@link useSignInWithDiscord} starts the sign-in. {@link useOauth} returns the
 * state that is shared by all the OAuth methods, for example the error of the
 * last flow.
 *
 * ```ts
 * const { signIn } = useSignInWithDiscord(api.auth)
 * const { flowError } = useOauth()
 * ```
 *
 * @module convex-auth/methods/discord
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

/** What {@link useSignInWithDiscord} returns. */
export type UseSignInWithDiscordReturn = {
  /** Start Discord's OAuth flow. See {@link UseOauthSignInReturn.signIn}. */
  signIn: UseOauthSignInReturn['signIn']
}

/**
 * Sign in with Discord. Pass the module exporting the functions of the method
 * (usually the generated `api.auth`), or an object mapping the canonical keys
 * to renamed exports.
 *
 * @public
 */
export function useSignInWithDiscord(api: {
  startSignInWithDiscord: OauthProviderApi['startSignIn']
  completeSignInWithDiscord: OauthProviderApi['completeSignIn']
}): UseSignInWithDiscordReturn {
  const { signIn } = useOauthSignIn({
    providerName: 'discord',
    startSignIn: api.startSignInWithDiscord,
    completeSignIn: api.completeSignInWithDiscord,
  })
  return { signIn }
}
