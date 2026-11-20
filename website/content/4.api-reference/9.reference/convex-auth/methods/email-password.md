---
navigation: false
description: "Vue client for the emailPassword method: a port of @convex-dev/auth/methods/email-password/react."
seo:
  title: "API reference: convex-auth/methods/email-password"
---

# convex-auth/methods/email-password

Vue client for the `emailPassword` method: a port of
`@convex-dev/auth/methods/email-password/react`.

## Type Aliases

### PasswordRecoveryApi

```ts
type PasswordRecoveryApi = {
  checkPasswordRecovery: CheckPasswordRecoveryQuery;
  completePasswordRecovery: CompletePasswordRecoveryMutation;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:148](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L148)

The functions that [useCompletePasswordRecovery](#usecompletepasswordrecovery) calls. The app's
`api.auth` has both of them.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="checkpasswordrecovery"></a> `checkPasswordRecovery` | `CheckPasswordRecoveryQuery` | [src/runtime/convex-auth/vue/methods/email-password.ts:149](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L149) |
| <a id="completepasswordrecovery"></a> `completePasswordRecovery` | `CompletePasswordRecoveryMutation` | [src/runtime/convex-auth/vue/methods/email-password.ts:150](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L150) |

***

### SignInResult

```ts
type SignInResult = ClientView<SignInMutationResult> | SignInUnexpectedFailure;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:154](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L154)

The result of the `signIn` callback from [useSignInWithEmailPassword](#usesigninwithemailpassword).

***

### SignUpResult

```ts
type SignUpResult = 
  | WithoutSecret<ClientView<SignUpMutationResult>>
  | UnexpectedFailure;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:158](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L158)

The result of the `signUp` callback from [useSignUpWithEmailPassword](#usesignupwithemailpassword).

***

### StartChangeEmailResult

```ts
type StartChangeEmailResult = WithoutSecret<StartChangeEmailMutationResult> | UnexpectedFailure;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:162](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L162)

The result of the `startChangeEmail` callback from [useStartChangeEmail](#usestartchangeemail).

***

### StartPasswordRecoveryResult

```ts
type StartPasswordRecoveryResult = 
  | WithoutSecret<StartPasswordRecoveryMutationResult>
  | UnexpectedFailure;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:166](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L166)

The result of the `startPasswordRecovery` callback from [useStartPasswordRecovery](#usestartpasswordrecovery).

***

### CompletePasswordRecoveryResult

```ts
type CompletePasswordRecoveryResult = 
  | ClientView<CompletePasswordRecoveryMutationResult>
  | SignInUnexpectedFailure;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:173](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L173)

The result of the `completePasswordRecovery` callback of the `ready` state
of [useCompletePasswordRecovery](#usecompletepasswordrecovery).

***

### LinkFlowState

```ts
type LinkFlowState<UserError> = 
  | {
  status: "loading";
}
  | {
  status: "complete";
}
  | {
  status: "error";
  userError: UserError;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:180](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L180)

The state of a landing page composable: `loading` until the link has been
presented, then `complete` or `error`.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-usererror"></a> `UserError` |

***

### CompleteSignUpState

```ts
type CompleteSignUpState = LinkFlowState<
  | SignInError<ClientView<CompleteSignUpResult>>
  | MissingSecretError
| OtherError>;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:186](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L186)

The state of [useCompleteSignUpWithEmailPassword](#usecompletesignupwithemailpassword).

***

### CompleteChangeEmailState

```ts
type CompleteChangeEmailState = LinkFlowState<
  | ExtractError<CompleteChangeEmailResult>
  | MissingSecretError
| OtherError>;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:193](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L193)

The state of [useCompleteChangeEmail](#usecompletechangeemail).

***

### CompletePasswordRecoveryState

```ts
type CompletePasswordRecoveryState = 
  | {
  status: "loading";
}
  | {
  status: "ready";
  completePasswordRecovery: (args) => Promise<CompletePasswordRecoveryResult>;
  pending: boolean;
}
  | {
  status: "complete";
}
  | {
  status: "error";
  userError: PasswordRecoveryLinkError | MissingSecretError;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:221](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L221)

The state of [useCompletePasswordRecovery](#usecompletepasswordrecovery). Unlike the other landing
page composables, the flow needs input from the user (the new password)
before it can complete, so a `ready` state carries the function to submit it.

#### Union Members

##### Type Literal

```ts
{
  status: "loading";
}
```

***

##### Type Literal

```ts
{
  status: "ready";
  completePasswordRecovery: (args) => Promise<CompletePasswordRecoveryResult>;
  pending: boolean;
}
```

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `status` | `"ready"` | - | [src/runtime/convex-auth/vue/methods/email-password.ts:224](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L224) |
| `completePasswordRecovery()` | (`args`) => `Promise`\<[`CompletePasswordRecoveryResult`](#completepasswordrecoveryresult)\> | Set the new password and sign the user in. Errors about the new password come back in the result and leave the state `ready`, so the user can try another password with the same link. | [src/runtime/convex-auth/vue/methods/email-password.ts:230](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L230) |
| `pending` | `boolean` | `true` while `completePasswordRecovery` is in flight. | [src/runtime/convex-auth/vue/methods/email-password.ts:234](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L234) |

***

##### Type Literal

```ts
{
  status: "complete";
}
```

***

##### Type Literal

```ts
{
  status: "error";
  userError: PasswordRecoveryLinkError | MissingSecretError;
}
```

## Functions

### useSignInWithEmailPassword()

```ts
function useSignInWithEmailPassword(api): {
  signIn: (credentials) => Promise<SignInResult>;
  pending: Ref<boolean>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:405](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L405)

Client for the sign-in flow: run the `signInWithEmailPassword` mutation and, on
success, establish an authenticated session.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `signInWithEmailPassword`: `SignInMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.signInWithEmailPassword` | `SignInMutation` | - |

#### Returns

```ts
{
  signIn: (credentials) => Promise<SignInResult>;
  pending: Ref<boolean>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `signIn()` | (`credentials`) => `Promise`\<[`SignInResult`](#signinresult)\> | [src/runtime/convex-auth/vue/methods/email-password.ts:408](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L408) |
| `pending` | `Ref`\<`boolean`\> | [src/runtime/convex-auth/vue/methods/email-password.ts:409](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L409) |

#### Example

```vue
<script setup lang="ts">
import { api } from '../convex/_generated/api'

const { signIn, pending } = useSignInWithEmailPassword(api.auth)
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)

async function onSubmit() {
  const result = await signIn({ email: email.value, password: password.value })
  // map result.userError (INVALID_CREDENTIALS, …) to a message
  error.value = result.status === 'error' ? result.userError.error : null
}
</script>
```

***

### useSignUpWithEmailPassword()

```ts
function useSignUpWithEmailPassword(api): {
  signUp: (credentials) => Promise<SignUpResult>;
  pending: Ref<boolean>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:474](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L474)

Client for the sign-up flow: run the `signUpWithEmailPassword` mutation and keep
the returned secret for [useCompleteSignUpWithEmailPassword](#usecompletesignupwithemailpassword).

A successful sign-up does *not* sign the user in: it sends the validation
email. Tell the user to open the link (in this same browser).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `signUpWithEmailPassword`: `SignUpMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.signUpWithEmailPassword` | `SignUpMutation` | - |

#### Returns

```ts
{
  signUp: (credentials) => Promise<SignUpResult>;
  pending: Ref<boolean>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `signUp()` | (`credentials`) => `Promise`\<[`SignUpResult`](#signupresult)\> | [src/runtime/convex-auth/vue/methods/email-password.ts:477](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L477) |
| `pending` | `Ref`\<`boolean`\> | [src/runtime/convex-auth/vue/methods/email-password.ts:478](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L478) |

#### Example

```vue
<script setup lang="ts">
import { api } from '../convex/_generated/api'

const { signUp, pending } = useSignUpWithEmailPassword(api.auth)
const email = ref('')
const password = ref('')
const error = ref<string | null>(null)
const sentTo = ref<string | null>(null)

async function onSubmit() {
  const result = await signUp({ email: email.value, password: password.value })
  if (result.success) {
    sentTo.value = email.value
  }
  else {
    // map result.userError (EMAIL_TAKEN, PASSWORD_TOO_SHORT, …) to a message
    error.value = result.userError.error
  }
}
</script>
```

***

### useCompleteSignUpWithEmailPassword()

```ts
function useCompleteSignUpWithEmailPassword(api, emailCode): ShallowRef<CompleteSignUpState>;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:532](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L532)

Client for the landing page of the validation link: as soon as the page
opens, present the code from the link with the secret stored by
[useSignUpWithEmailPassword](#usesignupwithemailpassword), and adopt the minted session.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `completeSignUpWithEmailPassword`: `CompleteSignUpMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.completeSignUpWithEmailPassword` | `CompleteSignUpMutation` | - |
| `emailCode` | `EmailCode` | The `code` query parameter of the link. |

#### Returns

`ShallowRef`\<[`CompleteSignUpState`](#completesignupstate)\>

#### Example

```vue
<script setup lang="ts">
import { api } from '../convex/_generated/api'

const route = useRoute()
const state = useCompleteSignUpWithEmailPassword(api.auth, {
  emailCode: () => String(route.query.code),
})
// state.value.status: 'loading' (validating…), 'complete' (signed in),
// or 'error' (map state.value.userError to a message)
</script>
```

***

### useStartPasswordRecovery()

```ts
function useStartPasswordRecovery(api): {
  startPasswordRecovery: (args) => Promise<StartPasswordRecoveryResult>;
  pending: Ref<boolean>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:578](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L578)

Client for starting a password recovery: run the backend's
`startPasswordRecovery` mutation and keep the returned secret for
[useCompletePasswordRecovery](#usecompletepasswordrecovery). On success, `sentTo` gives the address
that received the link. Show this address to the user, not the typed one:
the two can differ in case or in Unicode form.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `startPasswordRecovery`: `StartPasswordRecoveryMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.startPasswordRecovery` | `StartPasswordRecoveryMutation` | - |

#### Returns

```ts
{
  startPasswordRecovery: (args) => Promise<StartPasswordRecoveryResult>;
  pending: Ref<boolean>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `startPasswordRecovery()` | (`args`) => `Promise`\<[`StartPasswordRecoveryResult`](#startpasswordrecoveryresult)\> | [src/runtime/convex-auth/vue/methods/email-password.ts:581](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L581) |
| `pending` | `Ref`\<`boolean`\> | [src/runtime/convex-auth/vue/methods/email-password.ts:582](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L582) |

***

### useCompletePasswordRecovery()

```ts
function useCompletePasswordRecovery(recoveryApi, emailCode): ComputedRef<CompletePasswordRecoveryState>;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:653](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L653)

Client for the landing page of the password-reset link. As soon as the page
opens, it reads the secret stored by [useStartPasswordRecovery](#usestartpasswordrecovery) and
subscribes to `checkPasswordRecovery` with it and the code from the link.
When the link can be used, the state is `ready`, with the function that
sets the new password and adopts the minted session. When the link cannot
be used, the state is `error`, so the page does not ask for a password.

The check is a subscription, thus the state moves to `error` on its own
when the link dies while the page is open: another tab claims it, or it
expires and the server erases it.

The composable does not complete the flow by itself: the flow needs the new
password, so call `completePasswordRecovery` when the user submits the
form. An error about the password keeps the state `ready`, so show it in
the form. An error about the link moves the state to `error`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `recoveryApi` | [`PasswordRecoveryApi`](#passwordrecoveryapi) | The app's `checkPasswordRecovery` query and `completePasswordRecovery` mutation references, for example `api.auth`. |
| `emailCode` | `EmailCode` | The `code` query parameter of the link. |

#### Returns

`ComputedRef`\<[`CompletePasswordRecoveryState`](#completepasswordrecoverystate)\>

#### Example

```vue
<script setup lang="ts">
import { api } from '../convex/_generated/api'

const route = useRoute()
const state = useCompletePasswordRecovery(api.auth, {
  emailCode: () => String(route.query.code),
})
const newPassword = ref('')
const error = ref<string | null>(null)

async function onSubmit() {
  if (state.value.status !== 'ready') return
  const result = await state.value.completePasswordRecovery({ newPassword: newPassword.value })
  // map result.userError (PASSWORD_TOO_SHORT, …) to a message
  error.value = result.status === 'error' ? result.userError.error : null
}
</script>
```

***

### useStartChangeEmail()

```ts
function useStartChangeEmail(api): {
  startChangeEmail: (args) => Promise<StartChangeEmailResult>;
  pending: Ref<boolean>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:756](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L756)

Client for starting an email change: run the backend's `startChangeEmail`
mutation and keep the returned secret for [useCompleteChangeEmail](#usecompletechangeemail).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `startChangeEmail`: `StartChangeEmailMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.startChangeEmail` | `StartChangeEmailMutation` | - |

#### Returns

```ts
{
  startChangeEmail: (args) => Promise<StartChangeEmailResult>;
  pending: Ref<boolean>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `startChangeEmail()` | (`args`) => `Promise`\<[`StartChangeEmailResult`](#startchangeemailresult)\> | [src/runtime/convex-auth/vue/methods/email-password.ts:759](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L759) |
| `pending` | `Ref`\<`boolean`\> | [src/runtime/convex-auth/vue/methods/email-password.ts:760](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L760) |

***

### useCompleteChangeEmail()

```ts
function useCompleteChangeEmail(api, emailCode): ShallowRef<CompleteChangeEmailState>;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-password.ts:801](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-password.ts#L801)

Client for the landing page of the email-change confirmation link: as soon
as the page opens, present the code from the link with the secret stored by
[useStartChangeEmail](#usestartchangeemail). No session is adopted: the user already has
one, and the backend requires it.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `completeChangeEmail`: `CompleteChangeEmailMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.completeChangeEmail` | `CompleteChangeEmailMutation` | - |
| `emailCode` | `EmailCode` | The `code` query parameter of the link. |

#### Returns

`ShallowRef`\<[`CompleteChangeEmailState`](#completechangeemailstate)\>
