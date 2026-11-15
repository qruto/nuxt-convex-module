---
navigation: false
description: "Vue client for the usernamePasskey method: a port of @convex-dev/auth/methods/username-passkey/react."
seo:
  title: "API reference: convex-auth/methods/username-passkey"
---

# convex-auth/methods/username-passkey

Vue client for the `usernamePasskey` method: a port of
`@convex-dev/auth/methods/username-passkey/react`.

[useSignInWithUsernamePasskey](#usesigninwithusernamepasskey) is the batteries-included composable
for the username + passkey login form. It drives the browser-side WebAuthn
ceremonies (through upstream's client module built on
`@simplewebauthn/browser`) against the mutations of a passkey recipe,
and it handles both the identifier-first modal flow and passkey autofill
(conditional mediation), where the user selects an account directly in
the autocompletion list.

[useAddPasskey](#useaddpasskey) and [useRemovePasskey](#useremovepasskey) drive the passkey
settings page of a signed-in user.

## Interfaces

### PublicKeyCredentialCreationOptionsJSON

Defined in: node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:20

A variant of PublicKeyCredentialCreationOptions suitable for JSON transmission to the browser to
(eventually) get passed into navigator.credentials.create(...) in the browser.

This should eventually get replaced with official TypeScript DOM types when WebAuthn L3 types
eventually make it into the language:

https://w3c.github.io/webauthn/#dictdef-publickeycredentialcreationoptionsjson

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="rp"></a> `rp` | `PublicKeyCredentialRpEntity` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:21 |
| <a id="user"></a> `user` | `PublicKeyCredentialUserEntityJSON` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:22 |
| <a id="challenge"></a> `challenge` | `string` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:23 |
| <a id="pubkeycredparams"></a> `pubKeyCredParams` | `PublicKeyCredentialParameters`[] | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:24 |
| <a id="timeout"></a> `timeout?` | `number` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:25 |
| <a id="excludecredentials"></a> `excludeCredentials?` | `PublicKeyCredentialDescriptorJSON`[] | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:26 |
| <a id="authenticatorselection"></a> `authenticatorSelection?` | `AuthenticatorSelectionCriteria` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:27 |
| <a id="hints"></a> `hints?` | `PublicKeyCredentialHint`[] | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:28 |
| <a id="attestation"></a> `attestation?` | `AttestationConveyancePreference` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:29 |
| <a id="attestationformats"></a> `attestationFormats?` | `AttestationFormat`[] | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:30 |
| <a id="extensions"></a> `extensions?` | `AuthenticationExtensionsClientInputs` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:31 |

***

### PublicKeyCredentialRequestOptionsJSON

Defined in: node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:37

A variant of PublicKeyCredentialRequestOptions suitable for JSON transmission to the browser to
(eventually) get passed into navigator.credentials.get(...) in the browser.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="challenge-1"></a> `challenge` | `string` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:38 |
| <a id="timeout-1"></a> `timeout?` | `number` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:39 |
| <a id="rpid"></a> `rpId?` | `string` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:40 |
| <a id="allowcredentials"></a> `allowCredentials?` | `PublicKeyCredentialDescriptorJSON`[] | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:41 |
| <a id="userverification"></a> `userVerification?` | `UserVerificationRequirement` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:42 |
| <a id="hints-1"></a> `hints?` | `PublicKeyCredentialHint`[] | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:43 |
| <a id="extensions-1"></a> `extensions?` | `AuthenticationExtensionsClientInputs` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:44 |

***

### RegistrationResponseJSON

Defined in: node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:66

A slightly-modified RegistrationCredential to simplify working with ArrayBuffers that
are Base64URL-encoded in the browser so that they can be sent as JSON to the server.

https://w3c.github.io/webauthn/#dictdef-registrationresponsejson

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:67 |
| <a id="rawid"></a> `rawId` | `string` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:68 |
| <a id="response"></a> `response` | `AuthenticatorAttestationResponseJSON` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:69 |
| <a id="authenticatorattachment"></a> `authenticatorAttachment?` | `AuthenticatorAttachment` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:70 |
| <a id="clientextensionresults"></a> `clientExtensionResults` | `AuthenticationExtensionsClientOutputs` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:71 |
| <a id="type"></a> `type` | `"public-key"` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:72 |

***

### AuthenticationResponseJSON

Defined in: node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:86

A slightly-modified AuthenticationCredential to simplify working with ArrayBuffers that
are Base64URL-encoded in the browser so that they can be sent as JSON to the server.

https://w3c.github.io/webauthn/#dictdef-authenticationresponsejson

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="id-1"></a> `id` | `string` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:87 |
| <a id="rawid-1"></a> `rawId` | `string` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:88 |
| <a id="response-1"></a> `response` | `AuthenticatorAssertionResponseJSON` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:89 |
| <a id="authenticatorattachment-1"></a> `authenticatorAttachment?` | `AuthenticatorAttachment` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:90 |
| <a id="clientextensionresults-1"></a> `clientExtensionResults` | `AuthenticationExtensionsClientOutputs` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:91 |
| <a id="type-1"></a> `type` | `"public-key"` | node\_modules/@simplewebauthn/browser/esm/types/index.d.ts:92 |

## Type Aliases

### WireRequestOptions

```ts
type WireRequestOptions = Extract<StartSignInResult, {
  step: "authenticate";
}>["options"];
```

Defined in: [src/runtime/convex-auth/upstream/components/passkey/validation.ts:6](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/components/passkey/validation.ts#L6)

***

### WireCreationOptions

```ts
type WireCreationOptions = Extract<StartSignInResult, {
  step: "register";
}>["options"];
```

Defined in: [src/runtime/convex-auth/upstream/components/passkey/validation.ts:7](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/components/passkey/validation.ts#L7)

***

### WireRegistrationResponse

```ts
type WireRegistrationResponse = PasskeyFunctionArgs<"finishSignUpWithUsernamePasskey">["response"];
```

Defined in: [src/runtime/convex-auth/upstream/components/passkey/validation.ts:8](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/components/passkey/validation.ts#L8)

***

### WireAuthenticationResponse

```ts
type WireAuthenticationResponse = PasskeyFunctionArgs<"finishSignInWithUsernamePasskey">["response"];
```

Defined in: [src/runtime/convex-auth/upstream/components/passkey/validation.ts:9](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/components/passkey/validation.ts#L9)

***

### PasskeyClientError

```ts
type PasskeyClientError = 
  | {
  error: "CEREMONY_ABORTED";
}
  | {
  error: "PASSKEY_ALREADY_REGISTERED";
}
  | {
  error: "WEBAUTHN_UNSUPPORTED";
}
  | {
  error: "OTHER_ERROR";
  cause: unknown;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:34](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L34)

The failures the client side produces (the server never returns these):

- `CEREMONY_ABORTED`: the user dismissed the passkey dialog, the platform
  refused the ceremony (`NotAllowedError`), or another ceremony displaced
  this one. This is the most common failure; show a calm "sign-in was
  cancelled" message.
- `PASSKEY_ALREADY_REGISTERED`: the authenticator refused a registration
  because it already holds a passkey for this account
  (`InvalidStateError`, usually via `excludeCredentials`). Tell the user
  they can sign in with the passkey they already have.
- `WEBAUTHN_UNSUPPORTED`: this runtime cannot run passkey ceremonies.
- `OTHER_ERROR`: everything else thrown (a network blip, a bug, an
  unexpected server error). The thrown value is preserved on `cause` for
  callers that want to inspect or log it.

***

### PasskeyClientFailure

```ts
type PasskeyClientFailure = {
  success: false;
  userError: PasskeyClientError;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:45](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L45)

A failed result with a client-side `userError`. The failure arm all the
ceremony functions and hooks share; it composes with the server's own
`{ success: false, userError }` results into one `userError` switch.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="success"></a> `success` | `false` | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:46](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L46) |
| <a id="usererror"></a> `userError` | [`PasskeyClientError`](#passkeyclienterror) | [src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts:47](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/ceremonies.ts#L47) |

***

### UsernamePasskeyApi

```ts
type UsernamePasskeyApi = {
  startSignInWithUsernamePasskey: StartSignInMutation;
  startAutofillSignInWithUsernamePasskey: StartAutofillSignInMutation;
  finishSignInWithUsernamePasskey: FinishSignInMutation;
  finishSignUpWithUsernamePasskey: FinishSignUpMutation;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts:62](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts#L62)

The mutation references the sign-in flows drive.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="startsigninwithusernamepasskey"></a> `startSignInWithUsernamePasskey` | `StartSignInMutation` | [src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts:63](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts#L63) |
| <a id="startautofillsigninwithusernamepasskey"></a> `startAutofillSignInWithUsernamePasskey` | `StartAutofillSignInMutation` | [src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts:64](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts#L64) |
| <a id="finishsigninwithusernamepasskey"></a> `finishSignInWithUsernamePasskey` | `FinishSignInMutation` | [src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts:65](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts#L65) |
| <a id="finishsignupwithusernamepasskey"></a> `finishSignUpWithUsernamePasskey` | `FinishSignUpMutation` | [src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts:66](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts#L66) |

***

### UsernamePasskeyAutofillError

```ts
type UsernamePasskeyAutofillError = 
  | Extract<FinishSignInResult, {
  status: "error";
}>["userError"]
  | PasskeyClientError;
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts:116](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/flows.ts#L116)

The errors the autofill sign-in flow reports.

***

### AddPasskeyApi

```ts
type AddPasskeyApi = {
  startAddPasskey: StartAddPasskeyMutation;
  verifyAddPasskey: VerifyAddPasskeyMutation;
  finishAddPasskey: FinishAddPasskeyMutation;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts:62](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts#L62)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="startaddpasskey"></a> `startAddPasskey` | `StartAddPasskeyMutation` | [src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts:63](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts#L63) |
| <a id="verifyaddpasskey"></a> `verifyAddPasskey` | `VerifyAddPasskeyMutation` | [src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts:64](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts#L64) |
| <a id="finishaddpasskey"></a> `finishAddPasskey` | `FinishAddPasskeyMutation` | [src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts:65](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts#L65) |

***

### RemovePasskeyApi

```ts
type RemovePasskeyApi = {
  startRemovePasskey: StartRemovePasskeyMutation;
  finishRemovePasskey: FinishRemovePasskeyMutation;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts:68](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts#L68)

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="startremovepasskey"></a> `startRemovePasskey` | `StartRemovePasskeyMutation` | [src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts:69](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts#L69) |
| <a id="finishremovepasskey"></a> `finishRemovePasskey` | `FinishRemovePasskeyMutation` | [src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts:70](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/management/flows.ts#L70) |

***

### RenamePasskeyResult

```ts
type RenamePasskeyResult = PasskeyFunctionResult<"renamePasskey">;
```

Defined in: [src/runtime/convex-auth/upstream/methods/username-passkey/management/rename.ts:4](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/username-passkey/management/rename.ts#L4)

***

### SignInWithUsernamePasskeyResult

```ts
type SignInWithUsernamePasskeyResult = 
  | SignInFlowResult
| SignInError<PasskeyClientError | AlreadyPendingError>;
```

Defined in: [src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts:39](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts#L39)

The result of the `signIn` callback from `useSignInWithUsernamePasskey`.

A completed sign-in carries a `flow` discriminant: `"signUp"` when the
ceremony created a new account, `"signIn"` when it authenticated an existing
one. `ALREADY_PENDING` comes back when a `signIn` call runs while the
previous one still does, or while an autofill sign-in is verified.

***

### PasskeyAutofillStatus

```ts
type PasskeyAutofillStatus = "idle" | "waiting" | "signingIn" | "signedIn" | "stopped";
```

Defined in: [src/runtime/convex-auth/vue/methods/username-passkey/impl.ts:38](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/impl.ts#L38)

The states of the passkey autofill request, `autofill.status`:

- `"idle"`: the flow has not started yet, or autofill is off.
- `"waiting"`: the autofill request is pending in the browser.
- `"signingIn"`: a picked assertion is being handled (`onAssertion` is
  running, usually a server verification).
- `"signedIn"`: `onAssertion` reported success and the flow is done.
- `"stopped"`: the flow is done without a success (failure, or no
  browser support).

***

### AlreadyPendingFailure

```ts
type AlreadyPendingFailure = {
  success: false;
  userError: AlreadyPendingError;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/username-passkey/impl.ts:414](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/impl.ts#L414)

Failure shape for AlreadyPendingError.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="success-1"></a> `success` | `false` | [src/runtime/convex-auth/vue/methods/username-passkey/impl.ts:415](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/impl.ts#L415) |
| <a id="usererror-1"></a> `userError` | `AlreadyPendingError` | [src/runtime/convex-auth/vue/methods/username-passkey/impl.ts:416](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/impl.ts#L416) |

***

### AddPasskeyResult

```ts
type AddPasskeyResult = 
  | AddPasskeyFlowResult
  | AlreadyPendingFailure;
```

Defined in: [src/runtime/convex-auth/vue/methods/username-passkey/management.ts:30](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/management.ts#L30)

***

### RemovePasskeyResult

```ts
type RemovePasskeyResult = 
  | RemovePasskeyFlowResult
  | AlreadyPendingFailure;
```

Defined in: [src/runtime/convex-auth/vue/methods/username-passkey/management.ts:32](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/management.ts#L32)

## Functions

### useSignInWithUsernamePasskey()

```ts
function useSignInWithUsernamePasskey(usernamePasskeyApi): {
  signIn: (args) => Promise<SignInWithUsernamePasskeyResult>;
  pending: ComputedRef<boolean>;
  autofill: {
     available: Ref<boolean | null>;
     status: Ref<PasskeyAutofillStatus>;
     lastError: ShallowRef<UsernamePasskeyAutofillError | null>;
  };
};
```

Defined in: [src/runtime/convex-auth/vue/methods/username-passkey/index.ts:98](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/index.ts#L98)

Client for the log in page in the “username + passkey” auth flow.

This client handles both:
- Manually logging in by providing an identifier (e.g. username)
  then registering a new passkey or logging in
- Passkey autofill (conditional mediation) where the user selects an account
  directly in the autocompletion list.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `usernamePasskeyApi` | [`UsernamePasskeyApi`](#usernamepasskeyapi) | The functions of the method, usually `api.auth`. |

#### Returns

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `signIn()` | (`args`) => `Promise`\<[`SignInWithUsernamePasskeyResult`](#signinwithusernamepasskeyresult)\> | Runs the identifier-first passkey flow for the given username. Returns an object with a `status` field. If it is `"complete"` the sign-in (or the account creation) was successful and the client will establish an authenticated session with the Convex backend server. The `flow` field tells which one it was: `"signUp"` created a new account, `"signIn"` authenticated an existing one. If it is `"error"` the returned object will have a `userError` field with additional details about why sign-in failed. | [src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts:66](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts#L66) |
| `pending` | `ComputedRef`\<`boolean`\> | `true` while a sign-in runs: a `signIn` call, or an autofill sign-in that the server verifies (`autofill.status` is `"signingIn"`). A `signIn` call in this time returns `ALREADY_PENDING`. | [src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts:73](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts#L73) |
| `autofill` | \{ `available`: `Ref`\<`boolean` \| `null`\>; `status`: `Ref`\<[`PasskeyAutofillStatus`](#passkeyautofillstatus)\>; `lastError`: `ShallowRef`\<[`UsernamePasskeyAutofillError`](#usernamepasskeyautofillerror) \| `null`\>; \} | The state of the autofill flow: - `available`: whether the platform can offer passkeys in the autocompletion list; `null` while the detection runs. - `status`: the state of the request; see [PasskeyAutofillStatus](#passkeyautofillstatus). - `lastError`: the most recent failure, for display or logging. | [src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts:83](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts#L83) |
| `autofill.available` | `Ref`\<`boolean` \| `null`\> | - | [src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts:84](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts#L84) |
| `autofill.status` | `Ref`\<[`PasskeyAutofillStatus`](#passkeyautofillstatus)\> | - | [src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts:85](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts#L85) |
| `autofill.lastError` | `ShallowRef`\<[`UsernamePasskeyAutofillError`](#usernamepasskeyautofillerror) \| `null`\> | - | [src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts:86](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/hooks.ts#L86) |

#### Example

```vue
<script setup lang="ts">
import { api } from '../convex/_generated/api'

// While this component is mounted, the browser also shows the stored
// passkeys in the autocompletion list of the username field.
const { signIn, pending, autofill } = useSignInWithUsernamePasskey(api.auth)
const username = ref('')
const error = ref<string | null>(null)

async function onSubmit() {
  const result = await signIn({ username: username.value })
  error.value = result.status === 'error' ? result.userError.error : null
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input v-model="username" autocomplete="username webauthn" required :disabled="pending">
    <p v-if="error">{{ error }}</p>
    <p v-if="autofill.lastError.value">{{ autofill.lastError.value.error }}</p>
    <button type="submit" :disabled="pending">Continue with a passkey</button>
  </form>
</template>
```

***

### useAddPasskey()

```ts
function useAddPasskey(managementApi): {
  addPasskey: () => Promise<AddPasskeyResult>;
  pending: Ref<boolean>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/username-passkey/index.ts:117](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/index.ts#L117)

Composable for the "Add a passkey" button of a settings page.

First asks the user to authenticate with an existing passkey to prove
their identity, then registers a new passkey.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `managementApi` | [`AddPasskeyApi`](#addpasskeyapi) | The app module that re-exports the passkey-management functions of the method, for example `api.auth`. |

#### Returns

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `addPasskey()` | () => `Promise`\<[`AddPasskeyResult`](#addpasskeyresult)\> | Adds a passkey to the account of the signed-in user. Returns an object with a `success` boolean flag. If it is `false`, the object has a `userError` field that tells why. | [src/runtime/convex-auth/vue/methods/username-passkey/management.ts:51](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/management.ts#L51) |
| `pending` | `Ref`\<`boolean`\> | `true` while an `addPasskey` call is running. | [src/runtime/convex-auth/vue/methods/username-passkey/management.ts:53](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/management.ts#L53) |

***

### useRemovePasskey()

```ts
function useRemovePasskey(managementApi): {
  removePasskey: (passkeyId) => Promise<RemovePasskeyResult>;
  pending: Ref<boolean>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/username-passkey/index.ts:131](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/index.ts#L131)

Composable for the "Remove" button of a passkey list.

This asks the user to reauthenticate with another passkey
before deleting the targeted passkey.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `managementApi` | [`RemovePasskeyApi`](#removepasskeyapi) | The app module that re-exports the passkey-management functions of the method, for example `api.auth`. |

#### Returns

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `removePasskey()` | (`passkeyId`) => `Promise`\<[`RemovePasskeyResult`](#removepasskeyresult)\> | Removes the given passkey from the account of the signed-in user. Returns an object with a `success` boolean flag. If it is `false`, the object has a `userError` field that tells why. | [src/runtime/convex-auth/vue/methods/username-passkey/management.ts:90](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/management.ts#L90) |
| `pending` | `Ref`\<`boolean`\> | `true` while a `removePasskey` call is running. | [src/runtime/convex-auth/vue/methods/username-passkey/management.ts:92](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-passkey/management.ts#L92) |
