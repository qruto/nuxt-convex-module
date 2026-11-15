// Not a copy. See `../browser/ambientSignInClient.ts`.
import type { TokenBundle } from '@convex-dev/auth'
import type { AuthClient } from '@convex-dev/auth/browser'

export type SlimTokenBundle = Exclude<Parameters<AuthClient['setSession']>[0], TokenBundle>

export type ClientView<T> = T extends { tokens: TokenBundle }
  ? Omit<T, 'tokens'> & { tokens: SlimTokenBundle }
  : T

export type { SignInError, TokenBundle } from '@convex-dev/auth'
