// Not a copy. See `../../browser/ambientSignInClient.ts`. The result types
// upstream's `server.ts` exports, and what the functions the method's setup
// returns take and resolve to, for the types its other files keep to themselves.
import type { setupUsernamePasskey } from '@convex-dev/auth/methods/username-passkey/server'
import type { RegisteredMutation, RegisteredQuery } from 'convex/server'

export type {
  FinishSignInResult,
  FinishSignUpResult,
  StartAutofillSignInResult,
  StartSignInResult,
} from '@convex-dev/auth/methods/username-passkey/server'

type PasskeyFunctions = ReturnType<ReturnType<typeof setupUsernamePasskey>['attachUserCallbacks']>

export type PasskeyFunctionArgs<Name extends keyof PasskeyFunctions>
  = PasskeyFunctions[Name] extends RegisteredMutation<'public', infer Args, any> ? Args : never

export type PasskeyFunctionResult<Name extends keyof PasskeyFunctions>
  = PasskeyFunctions[Name] extends RegisteredMutation<'public', any, infer Result> | RegisteredQuery<'public', any, infer Result>
    ? Awaited<Result>
    : never
