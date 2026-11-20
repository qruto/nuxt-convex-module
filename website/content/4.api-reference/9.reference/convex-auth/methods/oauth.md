---
navigation: false
description: "Vue client for the shared OAuth state: a port of @convex-dev/auth/methods/oauth/react."
seo:
  title: "API reference: convex-auth/methods/oauth"
---

# convex-auth/methods/oauth

Vue client for the shared OAuth state: a port of
`@convex-dev/auth/methods/oauth/react`.

OAuth is registered by default in `provideConvexAuth` and in the plugin
that starts cookie sessions. If you set `ambientSignIns`, include
[oauth](#oauth) yourself. The Google, Apple, GitHub and Discord methods have
their own composables, at `nuxt-convex-module/convex-auth/methods/<provider>`.
[useOauth](#useoauth) returns the state that isn't tied to one provider.

Under cookie sessions, add each provider's `completeSignIn*` function to
the `signIn` list of `setupConvexAuthNuxt`. Its `startSignIn*` function
runs on the Convex client and is not listed.

Errors come back as typed results for the app to switch on, as with the
password composables. Starting a flow resolves to its result, and a failure
after the redirect back shows up in [useOauth](#useoauth)'s `flowError`.

```ts
const { flowError } = useOauth()
```

## Type Aliases

### OauthProviderApi

```ts
type OauthProviderApi = {
  startSignIn: FunctionReference<"mutation", "public", {
     redirectTo: string;
   }, {
     redirect: string;
     state: string;
  }>;
  completeSignIn: FunctionReference<"mutation", "public", {
     code: string;
     state: string;
  }, ClientView<CompleteSignInResult>>;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/oauth/client.ts:32](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L32)

The mutations that the method of an OAuth provider adds to the app's API. Passed as
references, not names, because an app can re-export them under any name.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="startsignin"></a> `startSignIn` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `redirectTo`: `string`; \}, \{ `redirect`: `string`; `state`: `string`; \}\> | The provider's `startSignIn*` mutation. | [src/runtime/convex-auth/upstream/methods/oauth/client.ts:34](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L34) |
| <a id="completesignin"></a> `completeSignIn` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `code`: `string`; `state`: `string`; \}, `ClientView`\<`CompleteSignInResult`\>\> | The provider's `completeSignIn*` mutation. | [src/runtime/convex-auth/upstream/methods/oauth/client.ts:41](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L41) |

***

### OauthProviderRefs

```ts
type OauthProviderRefs = {
  providerName: string;
} & OauthProviderApi;
```

Defined in: [src/runtime/convex-auth/upstream/methods/oauth/client.ts:50](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L50)

One provider's mutations plus its name.

#### Type Declaration

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `providerName` | `string` | The provider's name, e.g. `"google"`. Only a label, never a lookup key. | [src/runtime/convex-auth/upstream/methods/oauth/client.ts:52](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L52) |

***

### OauthFlowError

```ts
type OauthFlowError = 
  | {
  error: "ACCESS_DENIED";
}
  | {
  error: "EXPIRED";
}
  | {
  error: "INVALID_FLOW";
}
  | {
  error: "OTHER_ERROR";
  cause: unknown;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/oauth/client.ts:71](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L71)

Why a flow failed after the identity provider sent the user back. The
callback lands on a page load with no caller waiting on it, so the hooks
report it as `flowError`. Apps switch on `error` and supply their own text
for each code.

- `"ACCESS_DENIED"`: the user cancelled at the identity provider.
- `"EXPIRED"`: the flow took too long, or the code was already redeemed.
- `"INVALID_FLOW"`: the callback arrived but this client has no saved flow,
  so it never started this sign-in or already finished it.
- `"OTHER_ERROR"`: anything else, like the identity provider failing the
  handshake or the redemption throwing. `cause` is the thrown value, or the
  error the callback URL carried. When the app's own backend turns the
  sign-in down by throwing a `ConvexError` (from `onSignIn`, say), `cause`
  is that `ConvexError`, as with the other sign-in methods.

***

### OauthStartResult

```ts
type OauthStartResult = 
  | {
  status: "redirect";
  redirect: URL;
}
  | {
  status: "error";
  userError: {
     error: "OTHER_ERROR";
     cause: unknown;
  };
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/oauth/client.ts:87](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L87)

What starting a flow resolves to. A failure comes back as `OTHER_ERROR`
with the thrown value on `cause`, as with the password hooks, so the caller
handles every outcome in one switch with no `try`/`catch`. It only rejects
when `redirectTo` is missing where there is no page URL, which is a bug in
the calling code.

On the web the client navigates to `redirect` itself. React Native has no
page to leave, so it opens `redirect` in an in-app browser.

***

### OauthCompleteResult

```ts
type OauthCompleteResult = 
  | {
  status: "complete";
}
  | {
  status: "error";
  userError: OauthFlowError;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/oauth/client.ts:95](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L95)

What finishing a saved flow with a callback `code` resolves to. It never
rejects. The failures are those of [OauthFlowError](#oauthflowerror).

***

### SignInOptions

```ts
type SignInOptions = {
  redirectTo?: string;
  code?: string;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/oauth/client.ts:99](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L99)

Options accepted by [OauthActions.signIn](#signin).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="redirectto"></a> `redirectTo?` | `string` | Where the flow returns to when it finishes. Defaults to the current URL, and is required where there is no current URL, such as React Native. Must be an http or https URL. Custom schemes like `myapp://` are not supported yet. | [src/runtime/convex-auth/upstream/methods/oauth/client.ts:106](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L106) |
| <a id="code"></a> `code?` | `string` | A callback `code` to finish a saved flow instead of starting a new one. | [src/runtime/convex-auth/upstream/methods/oauth/client.ts:108](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L108) |

***

### OauthActions

```ts
type OauthActions = {
  signIn: (refs, options?) => Promise<
     | OauthStartResult
    | OauthCompleteResult>;
};
```

Defined in: [src/runtime/convex-auth/upstream/methods/oauth/client.ts:112](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L112)

The sign-in actions [oauth](#oauth) publishes for its hooks to read.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="signin"></a> `signIn` | (`refs`, `options?`) => `Promise`\< \| [`OauthStartResult`](#oauthstartresult) \| [`OauthCompleteResult`](#oauthcompleteresult)\> | Start the given provider's OAuth flow, or finish a saved one when `options.code` is set. Starting navigates away to the identity provider. Resolves to an [OauthStartResult](#oauthstartresult) or, with a `code`, an [OauthCompleteResult](#oauthcompleteresult). | [src/runtime/convex-auth/upstream/methods/oauth/client.ts:119](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L119) |

***

### UseOauthReturn

```ts
type UseOauthReturn = {
  flowError: ShallowRef<OauthFlowError | null>;
};
```

Defined in: [src/runtime/convex-auth/vue/methods/oauth.ts:54](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/oauth.ts#L54)

What [useOauth](#useoauth) returns.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="flowerror"></a> `flowError` | `ShallowRef`\<[`OauthFlowError`](#oauthflowerror) \| `null`\> | Why the last flow failed after the redirect back, or `null`. Cleared on the next sign-in. Switch on its `error` and supply the text for each code. | [src/runtime/convex-auth/vue/methods/oauth.ts:59](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/oauth.ts#L59) |

***

### UseOauthSignInReturn

```ts
type UseOauthSignInReturn = {
  signIn: {
     (options): Promise<OauthCompleteResult>;
     (options?): Promise<OauthStartResult>;
  };
};
```

Defined in: [src/runtime/convex-auth/vue/methods/oauth.ts:84](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/oauth.ts#L84)

What the sign-in composables of the OAuth providers return.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="signin-1"></a> `signIn` | \{ (`options`): `Promise`\<[`OauthCompleteResult`](#oauthcompleteresult)\>; (`options?`): `Promise`\<[`OauthStartResult`](#oauthstartresult)\>; \} | Start the provider's OAuth flow (or, with `options.code`, complete one started elsewhere). Navigates away to the identity provider. Starting is declared last so `ReturnType` gives its result. Its `code` is `undefined` so options that might hold a code match neither shape, rather than being typed as a start that could finish a flow. | [src/runtime/convex-auth/vue/methods/oauth.ts:93](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/oauth.ts#L93) |

## Functions

### oauth()

```ts
function oauth(): AmbientSignInClient;
```

Defined in: [src/runtime/convex-auth/upstream/methods/oauth/client.ts:243](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/upstream/methods/oauth/client.ts#L243)

Client setup for the OAuth providers. It owns the flow's storage and the
startup work that finishes a flow. Provider mutations arrive with each
[OauthActions.signIn](#signin) call, so the setup takes no configuration.

#### Returns

`AmbientSignInClient`

***

### useOauth()

```ts
function useOauth(): UseOauthReturn;
```

Defined in: [src/runtime/convex-auth/vue/methods/oauth.ts:70](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/methods/oauth.ts#L70)

Read OAuth state that isn't tied to one provider. A flow completes on
whichever page it redirects back to, so `flowError` can appear on a page
that never calls a sign-in composable. An app-level error banner can read
it here without any provider's function references.

#### Returns

[`UseOauthReturn`](#useoauthreturn)
