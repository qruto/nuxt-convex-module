/**
 * The passkey composables on ceremonies that the app provides, for example
 * on a native passkey library: a port of
 * `@convex-dev/auth/methods/username-passkey/react-custom`.
 *
 * @module convex-auth/methods/username-passkey/custom
 */
import type { UsernamePasskeyApi } from '../../../upstream/methods/username-passkey/flows'
import { resolveCeremonies, type PasskeyCeremonies } from '../../../upstream/methods/username-passkey/ceremonies'
import { useSignInWithUsernamePasskeyImpl } from './hooks'
import {
  useAddPasskeyImpl,
  useRemovePasskeyImpl,
  type AddPasskeyApi,
  type RemovePasskeyApi,
} from './management'

export type { SignInWithUsernamePasskeyResult } from './hooks'
export type { RenamePasskeyResult } from '../../../upstream/methods/username-passkey/management/rename'
export type {
  AddPasskeyApi,
  AddPasskeyResult,
  RemovePasskeyApi,
  RemovePasskeyResult,
} from './management'
export type {
  PasskeyAuthenticationResponse,
  PasskeyCeremonies,
  PasskeyClientError,
  PasskeyClientFailure,
  PasskeyRegistrationResponse,
} from '../../../upstream/methods/username-passkey/ceremonies'
export type {
  WireCreationOptions,
  WireRequestOptions,
} from '../../../upstream/components/passkey/validation'
export type {
  UsernamePasskeyApi,
  UsernamePasskeyAutofillError,
} from '../../../upstream/methods/username-passkey/flows'
export type {
  AlreadyPendingFailure,
  PasskeyAutofillStatus,
} from './impl'

/**
 * Make the passkey composables on the given ceremonies. They take the same
 * arguments and return the same results as the composables of
 * `nuxt-convex-module/convex-auth/methods/username-passkey`.
 *
 * Call it once, at the top level of a module:
 *
 * ```ts
 * export const { useSignInWithUsernamePasskey, useAddPasskey, useRemovePasskey }
 *   = createUsernamePasskeyHooks(ceremonies)
 * ```
 *
 * @public
 */
export function createUsernamePasskeyHooks(ceremonies: PasskeyCeremonies) {
  const resolved = resolveCeremonies(ceremonies)
  return {
    useSignInWithUsernamePasskey: (api: UsernamePasskeyApi) =>
      useSignInWithUsernamePasskeyImpl(api, resolved),
    useAddPasskey: (api: AddPasskeyApi) => useAddPasskeyImpl(api, resolved),
    useRemovePasskey: (api: RemovePasskeyApi) =>
      useRemovePasskeyImpl(api, resolved),
  }
}
