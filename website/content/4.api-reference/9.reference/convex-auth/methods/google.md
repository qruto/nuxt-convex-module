---
navigation: false
description: "Vue client for the Google sign-in method: a port of @convex-dev/auth/methods/google/react."
seo:
  title: "API reference: convex-auth/methods/google"
---

# convex-auth/methods/google

Vue client for the Google sign-in method: a port of
`@convex-dev/auth/methods/google/react`.

[useSignInWithGoogle](#usesigninwithgoogle) starts the sign-in. [useOauth](/api-reference/reference/convex-auth/methods/oauth#useoauth) returns the
state that is shared by all the OAuth methods, for example the error of the
last flow.

```ts
const { signIn } = useSignInWithGoogle(api.auth)
const { flowError } = useOauth()
```

## Type Aliases

### UseSignInWithGoogleReturn

```ts
type UseSignInWithGoogleReturn = {
  signIn: UseOauthSignInReturn["signIn"];
};
```

Defined in: [src/runtime/convex-auth/vue/methods/google.ts:28](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/google.ts#L28)

What [useSignInWithGoogle](#usesigninwithgoogle) returns.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="signin"></a> `signIn` | [`UseOauthSignInReturn`](/api-reference/reference/convex-auth/methods/oauth#useoauthsigninreturn)\[`"signIn"`\] | Start Google's OAuth flow. See [UseOauthSignInReturn.signIn](/api-reference/reference/convex-auth/methods/oauth#signin-1). | [src/runtime/convex-auth/vue/methods/google.ts:30](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/google.ts#L30) |

## Functions

### useSignInWithGoogle()

```ts
function useSignInWithGoogle(api): UseSignInWithGoogleReturn;
```

Defined in: [src/runtime/convex-auth/vue/methods/google.ts:40](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/google.ts#L40)

Sign in with Google. Pass the module exporting the functions of the method
(usually the generated `api.auth`), or an object mapping the canonical keys
to renamed exports.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `api` | \{ `startSignInWithGoogle`: [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `redirectTo`: `string`; \}, \{ `redirect`: `string`; `state`: `string`; \}\>; `completeSignInWithGoogle`: [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `code`: `string`; `state`: `string`; \}, `ClientView`\<`CompleteSignInResult`\>\>; \} |
| `api.startSignInWithGoogle` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `redirectTo`: `string`; \}, \{ `redirect`: `string`; `state`: `string`; \}\> |
| `api.completeSignInWithGoogle` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `code`: `string`; `state`: `string`; \}, `ClientView`\<`CompleteSignInResult`\>\> |

#### Returns

[`UseSignInWithGoogleReturn`](#usesigninwithgooglereturn)

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
