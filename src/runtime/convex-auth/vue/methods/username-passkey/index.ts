/**
 * Vue client for the `usernamePasskey` method: a port of
 * `@convex-dev/auth/methods/username-passkey/react`.
 *
 * {@link useSignInWithUsernamePasskey} is the batteries-included composable
 * for the username + passkey login form. It drives the browser-side WebAuthn
 * ceremonies (through upstream's client module built on
 * `@simplewebauthn/browser`) against the mutations of a passkey recipe,
 * and it handles both the identifier-first modal flow and passkey autofill
 * (conditional mediation), where the user selects an account directly in
 * the autocompletion list.
 *
 * {@link useAddPasskey} and {@link useRemovePasskey} drive the passkey
 * settings page of a signed-in user.
 *
 * @module convex-auth/methods/username-passkey
 */
import { browserCeremonies } from '../../../upstream/methods/username-passkey/client'
import type { UsernamePasskeyApi } from '../../../upstream/methods/username-passkey/flows'
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
// Apps read the WebAuthn JSON types and the browser-side failure shapes
// from here, so they never depend on `@simplewebauthn/*` directly.
export type {
  AuthenticationResponseJSON,
  PasskeyClientError,
  PasskeyClientFailure,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  WireAuthenticationResponse,
  WireCreationOptions,
  WireRegistrationResponse,
  WireRequestOptions,
} from '../../../upstream/methods/username-passkey/client'
export type {
  UsernamePasskeyApi,
  UsernamePasskeyAutofillError,
} from '../../../upstream/methods/username-passkey/flows'
export type {
  AlreadyPendingFailure,
  PasskeyAutofillStatus,
} from './impl'

/**
 * Client for the log in page in the “username + passkey” auth flow.
 *
 * This client handles both:
 * - Manually logging in by providing an identifier (e.g. username)
 *   then registering a new passkey or logging in
 * - Passkey autofill (conditional mediation) where the user selects an account
 *   directly in the autocompletion list.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '../convex/_generated/api'
 *
 * // While this component is mounted, the browser also shows the stored
 * // passkeys in the autocompletion list of the username field.
 * const { signIn, pending, autofill } = useSignInWithUsernamePasskey(api.auth)
 * const username = ref('')
 * const error = ref<string | null>(null)
 *
 * async function onSubmit() {
 *   const result = await signIn({ username: username.value })
 *   error.value = result.status === 'error' ? result.userError.error : null
 * }
 * </script>
 *
 * <template>
 *   <form @submit.prevent="onSubmit">
 *     <input v-model="username" autocomplete="username webauthn" required :disabled="pending">
 *     <p v-if="error">{{ error }}</p>
 *     <p v-if="autofill.lastError.value">{{ autofill.lastError.value.error }}</p>
 *     <button type="submit" :disabled="pending">Continue with a passkey</button>
 *   </form>
 * </template>
 * ```
 *
 * @param usernamePasskeyApi The functions of the method, usually `api.auth`.
 * @public
 */
export function useSignInWithUsernamePasskey(
  usernamePasskeyApi: UsernamePasskeyApi,
) {
  return useSignInWithUsernamePasskeyImpl(
    usernamePasskeyApi,
    browserCeremonies,
  )
}

/**
 * Composable for the "Add a passkey" button of a settings page.
 *
 * First asks the user to authenticate with an existing passkey to prove
 * their identity, then registers a new passkey.
 *
 * @param managementApi The app module that re-exports the
 *   passkey-management functions of the method, for example `api.auth`.
 * @public
 */
export function useAddPasskey(managementApi: AddPasskeyApi) {
  return useAddPasskeyImpl(managementApi, browserCeremonies)
}

/**
 * Composable for the "Remove" button of a passkey list.
 *
 * This asks the user to reauthenticate with another passkey
 * before deleting the targeted passkey.
 *
 * @param managementApi The app module that re-exports the
 *   passkey-management functions of the method, for example `api.auth`.
 * @public
 */
export function useRemovePasskey(managementApi: RemovePasskeyApi) {
  return useRemovePasskeyImpl(managementApi, browserCeremonies)
}
