---
navigation: false
description: "Vue client for the GitHub sign-in method: a port of @convex-dev/auth/methods/github/react."
seo:
  title: "API reference: convex-auth/methods/github"
---

# convex-auth/methods/github

Vue client for the GitHub sign-in method: a port of
`@convex-dev/auth/methods/github/react`.

[useSignInWithGithub](#usesigninwithgithub) starts the sign-in. [useOauth](/api-reference/reference/convex-auth/methods/oauth#useoauth) returns the
state that is shared by all the OAuth methods, for example the error of the
last flow.

```ts
const { signIn } = useSignInWithGithub(api.auth)
const { flowError } = useOauth()
```

## Type Aliases

### UseSignInWithGithubReturn

```ts
type UseSignInWithGithubReturn = {
  signIn: UseOauthSignInReturn["signIn"];
};
```

Defined in: [src/runtime/convex-auth/vue/methods/github.ts:28](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/github.ts#L28)

What [useSignInWithGithub](#usesigninwithgithub) returns.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="signin"></a> `signIn` | [`UseOauthSignInReturn`](/api-reference/reference/convex-auth/methods/oauth#useoauthsigninreturn)\[`"signIn"`\] | Start GitHub's OAuth flow. See [UseOauthSignInReturn.signIn](/api-reference/reference/convex-auth/methods/oauth#signin-1). | [src/runtime/convex-auth/vue/methods/github.ts:30](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/github.ts#L30) |

## Functions

### useSignInWithGithub()

```ts
function useSignInWithGithub(api): UseSignInWithGithubReturn;
```

Defined in: [src/runtime/convex-auth/vue/methods/github.ts:40](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/github.ts#L40)

Sign in with GitHub. Pass the module exporting the functions of the method
(usually the generated `api.auth`), or an object mapping the canonical keys
to renamed exports.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `api` | \{ `startSignInWithGithub`: [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `redirectTo`: `string`; \}, \{ `redirect`: `string`; `state`: `string`; \}\>; `completeSignInWithGithub`: [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `code`: `string`; `state`: `string`; \}, `ClientView`\<`CompleteSignInResult`\>\>; \} |
| `api.startSignInWithGithub` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `redirectTo`: `string`; \}, \{ `redirect`: `string`; `state`: `string`; \}\> |
| `api.completeSignInWithGithub` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `code`: `string`; `state`: `string`; \}, `ClientView`\<`CompleteSignInResult`\>\> |

#### Returns

[`UseSignInWithGithubReturn`](#usesigninwithgithubreturn)

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
