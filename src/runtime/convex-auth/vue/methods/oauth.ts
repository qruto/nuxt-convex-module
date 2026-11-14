/**
 * Vue client for the shared OAuth state: a port of
 * `@convex-dev/auth/methods/oauth/react`.
 *
 * OAuth is registered by default in `provideConvexAuth` and in the plugin
 * that starts cookie sessions. If you set `ambientSignIns`, include
 * {@link oauth} yourself. The Google, Apple and GitHub methods have their own
 * composables, at `nuxt-convex-module/convex-auth/methods/<provider>`.
 * {@link useOauth} returns the state that isn't tied to one provider.
 *
 * Under cookie sessions, add each provider's `completeSignIn*` function to
 * the `signIn` list of `setupConvexAuthNuxt`. Its `startSignIn*` function
 * runs on the Convex client and is not listed.
 *
 * Errors come back as typed results for the app to switch on, as with the
 * password composables. Starting a flow resolves to its result, and a failure
 * after the redirect back shows up in {@link useOauth}'s `flowError`.
 *
 * ```ts
 * const { flowError } = useOauth()
 * ```
 *
 * @module convex-auth/methods/oauth
 */
import type { ShallowRef } from 'vue'
import {
  OAUTH_ACTIONS_KEY,
  OAUTH_FLOW_ERROR_KEY,
  OAUTH_SETUP_ID,
  type OauthActions,
  type OauthCompleteResult,
  type OauthFlowError,
  type OauthProviderRefs,
  type OauthStartResult,
  type SignInOptions,
} from '../../upstream/methods/oauth/client'
import { useAmbientSignInValue } from '../methods'

export { oauth } from '../../upstream/methods/oauth/client'
export type {
  OauthActions,
  OauthCompleteResult,
  OauthFlowError,
  OauthProviderApi,
  OauthProviderRefs,
  OauthStartResult,
  SignInOptions,
} from '../../upstream/methods/oauth/client'

/** What every composable here throws when the OAuth setup published nothing. */
const notRegistered = () => new Error('No OAuth setup is registered. `provideConvexAuth` registers oauth() from nuxt-convex-module/convex-auth/methods/oauth by default, so include it yourself if you set the `ambientSignIns` option.')

/** What {@link useOauth} returns. */
export type UseOauthReturn = {
  /**
   * Why the last flow failed after the redirect back, or `null`. Cleared on
   * the next sign-in. Switch on its `error` and supply the text for each code.
   */
  flowError: ShallowRef<OauthFlowError | null>
}

/**
 * Read OAuth state that isn't tied to one provider. A flow completes on
 * whichever page it redirects back to, so `flowError` can appear on a page
 * that never calls a sign-in composable. An app-level error banner can read
 * it here without any provider's function references.
 *
 * @public
 */
export function useOauth(): UseOauthReturn {
  const flowError = useAmbientSignInValue<OauthFlowError | null>(
    OAUTH_SETUP_ID,
    OAUTH_FLOW_ERROR_KEY,
  )
  // The value is published at setup, so `undefined` means oauth() was never
  // registered.
  if (flowError.value === undefined) {
    throw notRegistered()
  }
  return { flowError: flowError as ShallowRef<OauthFlowError | null> }
}

/** What the sign-in composables of the OAuth providers return. */
export type UseOauthSignInReturn = {
  /**
   * Start the provider's OAuth flow (or, with `options.code`, complete one
   * started elsewhere). Navigates away to the identity provider.
   *
   * Starting is declared last so `ReturnType` gives its result. Its `code` is
   * `undefined` so options that might hold a code match neither shape,
   * rather than being typed as a start that could finish a flow.
   */
  signIn: {
    (options: SignInOptions & { code: string }): Promise<OauthCompleteResult>
    (
      options?: Omit<SignInOptions, 'code'> & { code?: undefined },
    ): Promise<OauthStartResult>
  }
}

/**
 * Run one OAuth provider's sign-in flow from its function references. The
 * per-provider composables like `useSignInWithGoogle` call this with their
 * own references.
 *
 * A failure while starting the flow comes back in the result. Failures after
 * the redirect back have no caller left to return to, so they are reported
 * through {@link useOauth}'s `flowError`.
 *
 * Not public until the API for custom OAuth providers is stable.
 *
 * @internal
 */
export function useOauthSignIn(refs: OauthProviderRefs): UseOauthSignInReturn {
  const actions = useAmbientSignInValue<OauthActions>(
    OAUTH_SETUP_ID,
    OAUTH_ACTIONS_KEY,
  )
  if (actions.value === undefined) {
    throw notRegistered()
  }
  const { signIn: run } = actions.value
  // One function serves both call shapes. The action picks the path from
  // whether `code` is set, and the result matches the shape called.
  const signIn = ((options?: SignInOptions) =>
    run(refs, options)) as UseOauthSignInReturn['signIn']
  return { signIn }
}
