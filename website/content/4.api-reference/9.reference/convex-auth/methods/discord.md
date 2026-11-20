---
navigation: false
description: "Vue client for the Discord sign-in method: a port of @convex-dev/auth/methods/discord/react."
seo:
  title: "API reference: convex-auth/methods/discord"
---

# convex-auth/methods/discord

Vue client for the Discord sign-in method: a port of
`@convex-dev/auth/methods/discord/react`.

[useSignInWithDiscord](#usesigninwithdiscord) starts the sign-in. [useOauth](/api-reference/reference/convex-auth/methods/oauth#useoauth) returns the
state that is shared by all the OAuth methods, for example the error of the
last flow.

```ts
const { signIn } = useSignInWithDiscord(api.auth)
const { flowError } = useOauth()
```

## Type Aliases

### UseSignInWithDiscordReturn

```ts
type UseSignInWithDiscordReturn = {
  signIn: UseOauthSignInReturn["signIn"];
};
```

Defined in: [src/runtime/convex-auth/vue/methods/discord.ts:28](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/discord.ts#L28)

What [useSignInWithDiscord](#usesigninwithdiscord) returns.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="signin"></a> `signIn` | [`UseOauthSignInReturn`](/api-reference/reference/convex-auth/methods/oauth#useoauthsigninreturn)\[`"signIn"`\] | Start Discord's OAuth flow. See [UseOauthSignInReturn.signIn](/api-reference/reference/convex-auth/methods/oauth#signin-1). | [src/runtime/convex-auth/vue/methods/discord.ts:30](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/discord.ts#L30) |

## Functions

### useSignInWithDiscord()

```ts
function useSignInWithDiscord(api): UseSignInWithDiscordReturn;
```

Defined in: [src/runtime/convex-auth/vue/methods/discord.ts:40](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/discord.ts#L40)

Sign in with Discord. Pass the module exporting the functions of the method
(usually the generated `api.auth`), or an object mapping the canonical keys
to renamed exports.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `api` | \{ `startSignInWithDiscord`: [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `redirectTo`: `string`; \}, \{ `redirect`: `string`; `state`: `string`; \}\>; `completeSignInWithDiscord`: [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `code`: `string`; `state`: `string`; \}, `ClientView`\<`CompleteSignInResult`\>\>; \} |
| `api.startSignInWithDiscord` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `redirectTo`: `string`; \}, \{ `redirect`: `string`; `state`: `string`; \}\> |
| `api.completeSignInWithDiscord` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `code`: `string`; `state`: `string`; \}, `ClientView`\<`CompleteSignInResult`\>\> |

#### Returns

[`UseSignInWithDiscordReturn`](#usesigninwithdiscordreturn)

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
