---
navigation: false
description: "Vue client for the emailMagicLink method: a port of @convex-dev/auth/methods/email-magic-link/react."
seo:
  title: "API reference: convex-auth/methods/email-magic-link"
---

# convex-auth/methods/email-magic-link

Vue client for the `emailMagicLink` method: a port of
`@convex-dev/auth/methods/email-magic-link/react`.

## Type Aliases

### SendResult

```ts
type SendResult = 
  | {
  success: true;
}
  | Extract<SendMutationResult, {
  success: false;
}>
  | {
  success: false;
  userError: OtherError;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-magic-link.ts:48](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-magic-link.ts#L48)

The result of the `sendMagicLink` callback from [useSendEmailMagicLink](#usesendemailmagiclink).

***

### SignInState

```ts
type SignInState = 
  | {
  status: "loading";
}
  | {
  status: "complete";
}
  | {
  status: "error";
  userError:   | Extract<ClientView<SignInMutationResult>, {
     status: "error";
   }>["userError"]
     | MissingSecretError
     | OtherError;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-magic-link.ts:54](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-magic-link.ts#L54)

The state of [useSignInWithEmailMagicLink](#usesigninwithemailmagiclink).

## Functions

### useSendEmailMagicLink()

```ts
function useSendEmailMagicLink(api): {
  sendMagicLink: (args) => Promise<SendResult>;
  pending: Ref<boolean>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/email-magic-link.ts:114](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-magic-link.ts#L114)

Client for the one form of the method: send a sign-in link to the address,
and keep the returned secret for [useSignInWithEmailMagicLink](#usesigninwithemailmagiclink). The
same call serves a person who has an account and a person who has none.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `sendEmailMagicLink`: `SendMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.sendEmailMagicLink` | `SendMutation` | - |

#### Returns

```ts
{
  sendMagicLink: (args) => Promise<SendResult>;
  pending: Ref<boolean>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `sendMagicLink()` | (`args`) => `Promise`\<[`SendResult`](#sendresult)\> | [src/runtime/convex-auth/vue/methods/email-magic-link.ts:117](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-magic-link.ts#L117) |
| `pending` | `Ref`\<`boolean`\> | [src/runtime/convex-auth/vue/methods/email-magic-link.ts:118](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-magic-link.ts#L118) |

#### Example

```vue
<script setup lang="ts">
import { api } from '../convex/_generated/api'

const { sendMagicLink, pending } = useSendEmailMagicLink(api.auth)
const email = ref('')
const sent = ref(false)
const error = ref<string | null>(null)

async function onSubmit() {
  error.value = null
  const result = await sendMagicLink({ email: email.value })
  if (result.success) {
    sent.value = true
  }
  else {
    // map result.userError (INVALID_EMAIL, RATE_LIMITED, …) to a message
    error.value = result.userError.error
  }
}
</script>
```

***

### useSignInWithEmailMagicLink()

```ts
function useSignInWithEmailMagicLink(api, emailCode): ShallowRef<SignInState>;
```

Defined in: [src/runtime/convex-auth/vue/methods/email-magic-link.ts:174](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/email-magic-link.ts#L174)

Client for the landing page of the link: as soon as the page opens,
present the code from the link with the secret stored by
[useSendEmailMagicLink](#usesendemailmagiclink), and adopt the minted session.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `signInWithEmailMagicLink`: `SignInMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.signInWithEmailMagicLink` | `SignInMutation` | - |
| `emailCode` | \{ `emailCode`: `MaybeRefOrGetter`\<`string`\>; \} | The `code` query parameter of the link. |
| `emailCode.emailCode` | `MaybeRefOrGetter`\<`string`\> | - |

#### Returns

`ShallowRef`\<[`SignInState`](#signinstate)\>

#### Example

```vue
<script setup lang="ts">
import { api } from '../convex/_generated/api'

const route = useRoute()
const state = useSignInWithEmailMagicLink(api.auth, {
  emailCode: () => String(route.query.code),
})
// state.value.status: 'loading' (signing in…), 'complete' (signed in),
// or 'error' (map state.value.userError to a message)
</script>
```
