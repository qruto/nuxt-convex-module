// Not a copy. See `../../browser/ambientSignInClient.ts`.
import type { SignInComplete, SignInError } from '@convex-dev/auth'

export type CompleteSignInResult = SignInComplete | SignInError<{ error: 'INVALID_CODE' }>
