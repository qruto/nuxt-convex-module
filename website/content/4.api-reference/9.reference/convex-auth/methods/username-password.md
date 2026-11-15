---
navigation: false
description: "Vue client for the usernamePassword method: a port of @convex-dev/auth/methods/username-password/react."
seo:
  title: "API reference: convex-auth/methods/username-password"
---

# convex-auth/methods/username-password

Vue client for the `usernamePassword` method: a port of
`@convex-dev/auth/methods/username-password/react`.

A method's job on the client is to run its own sign-in flow and hand the
resulting token bundle to the core client's `setSession` (see useAuthActions).

The `usernamePassword` method has two flows and provides a composable for each:
 1. signing in to an existing account ([useSignInWithUsernamePassword](#usesigninwithusernamepassword))
 2. signing up a new one ([useSignUpWithUsernamePassword](#usesignupwithusernamepassword))

Each composable returns a function for sending up the credentials and a
`pending` ref that is flipped to `true` while the credentials are being
validated.

## Type Aliases

### Credentials

```ts
type Credentials = {
  username: string;
  password: string;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/username-password.ts:27](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L27)

The `(username, password)` pair both flows accept.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="username"></a> `username` | `string` | [src/runtime/convex-auth/vue/methods/username-password.ts:27](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L27) |
| <a id="password"></a> `password` | `string` | [src/runtime/convex-auth/vue/methods/username-password.ts:27](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L27) |

***

### SignInWithUsernamePasswordResult

```ts
type SignInWithUsernamePasswordResult = ClientView<SignInResult> | UnexpectedFailure;
```

Defined in: [src/runtime/convex-auth/vue/methods/username-password.ts:67](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L67)

The result of the `signIn` callback from [useSignInWithUsernamePassword](#usesigninwithusernamepassword).

***

### SignUpWithUsernamePasswordResult

```ts
type SignUpWithUsernamePasswordResult = ClientView<SignUpResult> | UnexpectedFailure;
```

Defined in: [src/runtime/convex-auth/vue/methods/username-password.ts:71](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L71)

The result of the `signUp` callback from [useSignUpWithUsernamePassword](#usesignupwithusernamepassword).

## Functions

### useSignInWithUsernamePassword()

```ts
function useSignInWithUsernamePassword(api): {
  signIn: (credentials) => Promise<
     | ClientView<
     | {
     status: "complete";
     tokens: {
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: number;
        userId: string;
     };
   }
     | {
     status: "error";
     userError:   | {
        error: "PASSWORD_TOO_SHORT";
        minimumLength: number;
      }
        | {
        error: "PASSWORD_TOO_LONG";
        maximumLength: number;
      }
        | {
        error: "PASSWORD_HAS_SURROUNDING_WHITESPACE";
      }
        | {
        error: "INVALID_CREDENTIALS";
      }
        | {
        error: "RATE_LIMITED";
        retryAfterMs: number;
      }
        | {
        error: "USER_NOT_FOUND";
      };
   }>
    | UnexpectedFailure>;
  pending: Ref<boolean, boolean>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/username-password.ts:108](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L108)

Client for the sign-in flow of the `usernamePassword` method: wire the backend's
`signInWithUsernamePassword` mutation to the core client.

The returned `signIn` runs the mutation with the given credentials and, on
success, establishes an authenticated session with your Convex backend.

The `pending` ref returned will let you know if the credentials are
currently being validated.

After calling `signIn`, check the `status` field on the return value to see
whether the sign-in was successful or if you need to handle an error.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `signInWithUsernamePassword`: `SignInWithUsernamePasswordMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.signInWithUsernamePassword` | `SignInWithUsernamePasswordMutation` | - |

#### Returns

| Name | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `signIn()` | (`credentials`) => `Promise`\< \| `ClientView`\< \| \{ `status`: `"complete"`; `tokens`: \{ `accessToken`: `string`; `refreshToken`: `string`; `refreshTokenExpiresAt`: `number`; `userId`: `string`; \}; \} \| \{ `status`: `"error"`; `userError`: \| \{ `error`: `"PASSWORD_TOO_SHORT"`; `minimumLength`: `number`; \} \| \{ `error`: `"PASSWORD_TOO_LONG"`; `maximumLength`: `number`; \} \| \{ `error`: `"PASSWORD_HAS_SURROUNDING_WHITESPACE"`; \} \| \{ `error`: `"INVALID_CREDENTIALS"`; \} \| \{ `error`: `"RATE_LIMITED"`; `retryAfterMs`: `number`; \} \| \{ `error`: `"USER_NOT_FOUND"`; \}; \}\> \| `UnexpectedFailure`\> | `run` | Passes up the given credentials to perform a username/password sign in. Returns an object with a `status` field. If it is `"complete"` the sign-in was successful and the client will establish an authenticated session with the Convex backend server. If it is `"error"` the returned object will have a `userError` field with additional details about why sign-in failed. | [src/runtime/convex-auth/vue/methods/username-password.ts:124](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L124) |
| `pending` | `Ref`\<`boolean`, `boolean`\> | - | `true` if the sign-in attempt is being validated. | [src/runtime/convex-auth/vue/methods/username-password.ts:126](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L126) |

#### Example

```vue
<script setup lang="ts">
import { api } from '../convex/_generated/api'

const { signIn, pending } = useSignInWithUsernamePassword(api.auth)
const username = ref('')
const password = ref('')

async function onSubmit() {
  const result = await signIn({ username: username.value, password: password.value })
  if (result.status !== 'complete') {
    // map result.userError to a message
  }
}
</script>
```

***

### useSignUpWithUsernamePassword()

```ts
function useSignUpWithUsernamePassword(api): {
  signUp: (credentials) => Promise<
     | ClientView<
     | {
     status: "complete";
     tokens: {
        accessToken: string;
        refreshToken: string;
        refreshTokenExpiresAt: number;
        userId: string;
     };
   }
     | {
     status: "error";
     userError:   | {
        error: "PASSWORD_TOO_SHORT";
        minimumLength: number;
      }
        | {
        error: "PASSWORD_TOO_LONG";
        maximumLength: number;
      }
        | {
        error: "PASSWORD_HAS_SURROUNDING_WHITESPACE";
      }
        | {
        error: "PASSWORD_TOO_COMMON";
      }
        | {
        error: "USERNAME_TOO_SHORT";
        minimumLength: number;
      }
        | {
        error: "USERNAME_TOO_LONG";
        maximumLength: number;
      }
        | {
        error: "USERNAME_HAS_SURROUNDING_WHITESPACE";
      }
        | {
        error: "USERNAME_HAS_INVALID_CHARACTERS";
      }
        | {
        error: "USERNAME_TAKEN";
      };
   }>
    | UnexpectedFailure>;
  pending: Ref<boolean, boolean>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/username-password.ts:146](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L146)

Client for the sign-up flow of the `usernamePassword` method: wire the backend's
`signUpWithUsernamePassword` mutation to the core client.

The returned `signUp` runs the mutation with the given credentials and, on
success, establishes an authenticated session with your Convex backend.

The `pending` ref returned will let you know if the credentials are
currently being validated.

After calling `signUp`, check the `status` field on the return value to see
whether the sign-up was successful or if you need to handle an error.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | \{ `signUpWithUsernamePassword`: `SignUpWithUsernamePasswordMutation`; \} | The functions of the method, usually `api.auth`. |
| `api.signUpWithUsernamePassword` | `SignUpWithUsernamePasswordMutation` | - |

#### Returns

| Name | Type | Default value | Description | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| `signUp()` | (`credentials`) => `Promise`\< \| `ClientView`\< \| \{ `status`: `"complete"`; `tokens`: \{ `accessToken`: `string`; `refreshToken`: `string`; `refreshTokenExpiresAt`: `number`; `userId`: `string`; \}; \} \| \{ `status`: `"error"`; `userError`: \| \{ `error`: `"PASSWORD_TOO_SHORT"`; `minimumLength`: `number`; \} \| \{ `error`: `"PASSWORD_TOO_LONG"`; `maximumLength`: `number`; \} \| \{ `error`: `"PASSWORD_HAS_SURROUNDING_WHITESPACE"`; \} \| \{ `error`: `"PASSWORD_TOO_COMMON"`; \} \| \{ `error`: `"USERNAME_TOO_SHORT"`; `minimumLength`: `number`; \} \| \{ `error`: `"USERNAME_TOO_LONG"`; `maximumLength`: `number`; \} \| \{ `error`: `"USERNAME_HAS_SURROUNDING_WHITESPACE"`; \} \| \{ `error`: `"USERNAME_HAS_INVALID_CHARACTERS"`; \} \| \{ `error`: `"USERNAME_TAKEN"`; \}; \}\> \| `UnexpectedFailure`\> | `run` | Passes up the given credentials to perform a username/password sign up. Returns an object with a `status` field. If it is `"complete"` the sign-up was successful and the client will establish an authenticated session with the Convex backend server. If it is `"error"` the returned object will have a `userError` field with additional details about why sign-up failed. | [src/runtime/convex-auth/vue/methods/username-password.ts:162](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L162) |
| `pending` | `Ref`\<`boolean`, `boolean`\> | - | `true` if the sign-up attempt is being validated. | [src/runtime/convex-auth/vue/methods/username-password.ts:164](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/username-password.ts#L164) |
