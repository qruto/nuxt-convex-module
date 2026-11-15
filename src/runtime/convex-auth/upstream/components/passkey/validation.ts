// Not a copy. See `../../browser/ambientSignInClient.ts`. The wire shapes of
// the passkey mutations, read off the method's server entry.
import type { StartSignInResult } from '@convex-dev/auth/methods/username-passkey/server'
import type { PasskeyFunctionArgs } from '../../methods/username-passkey/server'

export type WireRequestOptions = Extract<StartSignInResult, { step: 'authenticate' }>['options']
export type WireCreationOptions = Extract<StartSignInResult, { step: 'register' }>['options']
export type WireRegistrationResponse = PasskeyFunctionArgs<'finishSignUpWithUsernamePasskey'>['response']
export type WireAuthenticationResponse = PasskeyFunctionArgs<'finishSignInWithUsernamePasskey'>['response']
