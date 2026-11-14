---
navigation: false
description: "Vue client for the Apple sign-in method: a port of @convex-dev/auth/methods/apple/react."
seo:
  title: "API reference: convex-auth/methods/apple"
---

# convex-auth/methods/apple

Vue client for the Apple sign-in method: a port of
`@convex-dev/auth/methods/apple/react`.

[useSignInWithApple](#usesigninwithapple) starts the sign-in. [useOauth](/api-reference/reference/convex-auth/methods/oauth#useoauth) returns the
state that is shared by all the OAuth methods, for example the error of the
last flow.

```ts
const { signIn } = useSignInWithApple(api.auth)
const { flowError } = useOauth()
```

## Type Aliases

### UseSignInWithAppleReturn

```ts
type UseSignInWithAppleReturn = {
  signIn: UseOauthSignInReturn["signIn"];
};
```

Defined in: [src/runtime/convex-auth/vue/methods/apple.ts:28](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/apple.ts#L28)

What [useSignInWithApple](#usesigninwithapple) returns.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="signin"></a> `signIn` | [`UseOauthSignInReturn`](/api-reference/reference/convex-auth/methods/oauth#useoauthsigninreturn)\[`"signIn"`\] | Start Apple's OAuth flow. See [UseOauthSignInReturn.signIn](/api-reference/reference/convex-auth/methods/oauth#signin-1). | [src/runtime/convex-auth/vue/methods/apple.ts:30](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/apple.ts#L30) |

## Functions

### useSignInWithApple()

```ts
function useSignInWithApple(api): UseSignInWithAppleReturn;
```

Defined in: [src/runtime/convex-auth/vue/methods/apple.ts:40](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/apple.ts#L40)

Sign in with Apple. Pass the module exporting the functions of the method
(usually the generated `api.auth`), or an object mapping the canonical keys
to renamed exports.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `api` | \{ `startSignInWithApple`: [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `redirectTo`: `string`; \}, \{ `redirect`: `string`; `state`: `string`; \}\>; `completeSignInWithApple`: [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `code`: `string`; `state`: `string`; \}, `ClientView`\<`CompleteSignInResult`\>\>; \} |
| `api.startSignInWithApple` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `redirectTo`: `string`; \}, \{ `redirect`: `string`; `state`: `string`; \}\> |
| `api.completeSignInWithApple` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `code`: `string`; `state`: `string`; \}, `ClientView`\<`CompleteSignInResult`\>\> |

#### Returns

[`UseSignInWithAppleReturn`](#usesigninwithapplereturn)

## References

### useOauth

Re-exports [useOauth](/api-reference/reference/convex-auth/methods/oauth#useoauth)

***

### UseOauthReturn

Re-exports [UseOauthReturn](/api-reference/reference/convex-auth/methods/oauth#useoauthreturn)

***

### OauthCompleteResult

Re-exports [OauthCompleteResult](/api-reference/reference/convex-auth/methods/oauth#oauthcompleteresult)

***

### OauthFlowError

Re-exports [OauthFlowError](/api-reference/reference/convex-auth/methods/oauth#oauthflowerror)

***

### OauthStartResult

Re-exports [OauthStartResult](/api-reference/reference/convex-auth/methods/oauth#oauthstartresult)

***

### SignInOptions

Re-exports [SignInOptions](/api-reference/reference/convex-auth/methods/oauth#signinoptions)
