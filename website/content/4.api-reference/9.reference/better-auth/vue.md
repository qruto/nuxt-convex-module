---
navigation: true
---

# better-auth/vue

Public Vue API for the opt-in Better Auth integration — a Vue/Nuxt port of
`@convex-dev/better-auth`'s `react` integration.

## Interfaces

### UseAuthService

Defined in: [src/runtime/better-auth/vue/use-auth.ts:35](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L35)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="isloading"></a> `isLoading` | `ComputedRef`\<`boolean`\> | - | [src/runtime/better-auth/vue/use-auth.ts:37](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L37) |
| <a id="isauthenticated"></a> `isAuthenticated` | `ComputedRef`\<`boolean`\> | - | [src/runtime/better-auth/vue/use-auth.ts:38](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L38) |
| <a id="fetchaccesstoken"></a> `fetchAccessToken` | [`AuthTokenFetcher`](/api-reference/reference/vue#authtokenfetcher) | - | [src/runtime/better-auth/vue/use-auth.ts:39](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L39) |
| <a id="client"></a> `client` | [`AuthClient`](#authclient) | - | [src/runtime/better-auth/vue/use-auth.ts:41](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L41) |
| <a id="session"></a> `session` | [`AuthSession`](#authsession) | - | [src/runtime/better-auth/vue/use-auth.ts:42](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L42) |
| <a id="user"></a> `user` | `ComputedRef`\<[`AuthUser`](#authuser) \| `null`\> | The current user, or `null` when signed out / still loading. | [src/runtime/better-auth/vue/use-auth.ts:44](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L44) |
| <a id="authversion"></a> `authVersion` | `ComputedRef`\<`string` \| `null`\> | - | [src/runtime/better-auth/vue/use-auth.ts:45](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L45) |
| <a id="signout"></a> `signOut` | () => `Promise`\<`unknown`\> | Sign the current user out. | [src/runtime/better-auth/vue/use-auth.ts:47](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L47) |
| <a id="sendotp"></a> `sendOtp` | (`email`, `type?`) => `Promise`\<`unknown`\> | Send a sign-in / verification OTP code to an email. | [src/runtime/better-auth/vue/use-auth.ts:49](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L49) |
| <a id="signinwithotp"></a> `signInWithOtp` | (`args`) => `Promise`\<`unknown`\> | Complete sign-in (or passwordless sign-up) with an emailed OTP code. | [src/runtime/better-auth/vue/use-auth.ts:51](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L51) |
| <a id="signinwithpasskey"></a> `signInWithPasskey` | () => `Promise`\<`unknown`\> | Sign in with a passkey (WebAuthn). | [src/runtime/better-auth/vue/use-auth.ts:53](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L53) |
| <a id="registerpasskey"></a> `registerPasskey` | (`context?`) => `Promise`\<`unknown`\> | Register a passkey — pass `{ email, name }` (JSON) for pre-auth registration. | [src/runtime/better-auth/vue/use-auth.ts:55](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L55) |
| <a id="changeemail"></a> `changeEmail` | (`newEmail`, `callbackURL?`) => `Promise`\<`unknown`\> | Change the account email (confirmed via email). | [src/runtime/better-auth/vue/use-auth.ts:57](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L57) |
| <a id="deleteaccount"></a> `deleteAccount` | () => `Promise`\<`unknown`\> | Delete the account (confirmed via email). | [src/runtime/better-auth/vue/use-auth.ts:59](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L59) |

## Type Aliases

### AuthClient

```ts
type AuthClient = AuthClientWithPlugins<[ConvexPlugin, EmailOTPPlugin, PasskeyPlugin]>;
```

Defined in: [src/runtime/better-auth/vue/client.ts:13](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/client.ts#L13)

***

### AuthSession

```ts
type AuthSession = ReturnType<typeof useClientSession>;
```

Defined in: [src/runtime/better-auth/vue/use-auth.ts:30](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L30)

***

### AuthUser

```ts
type AuthUser = {
  id: string;
  email: string;
  name: string;
} & Record<string, unknown>;
```

Defined in: [src/runtime/better-auth/vue/use-auth.ts:33](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L33)

The signed-in user (loose — exact fields depend on your auth schema).

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `id` | `string` | [src/runtime/better-auth/vue/use-auth.ts:33](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L33) |
| `email` | `string` | [src/runtime/better-auth/vue/use-auth.ts:33](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L33) |
| `name` | `string` | [src/runtime/better-auth/vue/use-auth.ts:33](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L33) |

## Variables

### convexClient

```ts
const convexClient: () => {
  id: "convex";
  version: string;
  $InferServerPlugin: ReturnType<typeof convex>;
};
```

Defined in: node\_modules/@convex-dev/better-auth/dist/plugins/convex/client.d.ts:2

#### Returns

```ts
{
  id: "convex";
  version: string;
  $InferServerPlugin: ReturnType<typeof convex>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `id` | `"convex"` | node\_modules/@convex-dev/better-auth/dist/plugins/convex/client.d.ts:3 |
| `version` | `string` | node\_modules/@convex-dev/better-auth/dist/plugins/convex/client.d.ts:4 |
| `$InferServerPlugin` | `ReturnType`\<*typeof* `convex`\> | node\_modules/@convex-dev/better-auth/dist/plugins/convex/client.d.ts:5 |

***

### crossDomainClient

```ts
const crossDomainClient: (opts?) => CrossDomainClientPlugin;
```

Defined in: node\_modules/@convex-dev/better-auth/dist/plugins/cross-domain/client.d.ts:14

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `opts?` | \{ `storage?`: \{ `setItem`: (`key`, `value`) => `any`; `getItem`: (`key`) => `string` \| `null`; \}; `storagePrefix?`: `string`; `disableCache?`: `boolean`; \} |
| `opts.storage?` | \{ `setItem`: (`key`, `value`) => `any`; `getItem`: (`key`) => `string` \| `null`; \} |
| `opts.storage.setItem?` | (`key`, `value`) => `any` |
| `opts.storage.getItem?` | (`key`) => `string` \| `null` |
| `opts.storagePrefix?` | `string` |
| `opts.disableCache?` | `boolean` |

#### Returns

`CrossDomainClientPlugin`

***

### AuthBoundary

```ts
const AuthBoundary: DefineComponent<ExtractPropTypes<{
  onUnauth: {
     type: PropType<() => void | Promise<void>>;
     required: true;
  };
  authClient: {
     type: PropType<AuthClient>;
     required: true;
  };
  renderFallback: {
     type: PropType<() => 
        | VNode<RendererNode, RendererElement, {
      [key: string]: any;
      }>
       | null>;
     default: () => null;
  };
  getAuthUserFn: {
     type: PropType<FunctionReference<"query", "public", EmptyObject>>;
     required: true;
  };
  isAuthError: {
     type: PropType<(error) => boolean>;
     required: true;
  };
}>, () => 
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>
  | (
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>[]
  | undefined)[]
  | null, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  onUnauth: {
     type: PropType<() => void | Promise<void>>;
     required: true;
  };
  authClient: {
     type: PropType<AuthClient>;
     required: true;
  };
  renderFallback: {
     type: PropType<() => 
        | VNode<RendererNode, RendererElement, {
      [key: string]: any;
      }>
       | null>;
     default: () => null;
  };
  getAuthUserFn: {
     type: PropType<FunctionReference<"query", "public", EmptyObject>>;
     required: true;
  };
  isAuthError: {
     type: PropType<(error) => boolean>;
     required: true;
  };
}>, {
}>, {
  renderFallback: () => 
     | VNode<RendererNode, RendererElement, {
   [key: string]: any;
   }>
    | null;
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/better-auth/vue/auth-boundary.ts:66](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/auth-boundary.ts#L66)

_Experimental_

A wrapper Vue component which provides error handling for auth related errors.
This is typically used to redirect the user to the login page when they are
unauthenticated, and does so reactively based on the getAuthUserFn query.

#### Example

```vue
<!--
  convex/auth.ts:
  export const { getAuthUser } = authComponent.clientApi();
-->
<script setup lang="ts">
import { AuthBoundary, authClient } from '#imports'
import { api } from '#backend/api'
import { isAuthError } from '~/utils/auth'
</script>

<template>
  <AuthBoundary
    :on-unauth="() => navigateTo('/sign-in')"
    :auth-client="authClient"
    :get-auth-user-fn="api.auth.getAuthUser"
    :is-auth-error="isAuthError"
  >
    <slot />
  </AuthBoundary>
</template>
```

#### Param

**props.onUnauth**

Function to call when the user is
unauthenticated. Typically a redirect to the login page.

#### Param

**props.authClient**

Better Auth authClient to use.

#### Param

**props.renderFallback**

Fallback component to render when the user is
unauthenticated. Defaults to null. Generally not rendered as error handling
is typically a redirect.

#### Param

**props.getAuthUserFn**

Reference to a Convex query that returns user.
The component provides a query for this via `export const { getAuthUser } = authComponent.clientApi()`.

#### Param

**props.isAuthError**

Function to check if the error is auth related.

***

### authClient

```ts
const authClient: AuthClient;
```

Defined in: [src/runtime/better-auth/vue/client.ts:15](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/client.ts#L15)

## Functions

### consumeCrossDomainOneTimeToken()

```ts
function consumeCrossDomainOneTimeToken(): Promise<void>;
```

Defined in: [src/runtime/better-auth/vue/cross-domain.ts:29](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/cross-domain.ts#L29)

Exchange a `?ott=...` one-time token (set by the Better Auth cross-domain
plugin when redirecting from an auth origin) for a full session — the Vue
port of `ConvexBetterAuthProvider`'s one-time-token `useEffect`.

Safe to call unconditionally — returns early when the URL has no `ott`
parameter or the cross-domain plugin is not installed on the auth client.

#### Returns

`Promise`\<`void`\>

***

### usePreloadedAuthQuery()

```ts
function usePreloadedAuthQuery<Query>(preloadedQuery): ComputedRef<Query["_returnType"] | null | undefined>;
```

Defined in: [src/runtime/better-auth/vue/hydration.ts:64](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/hydration.ts#L64)

Auth-aware version of usePreloadedQuery for payloads returned by
`backendAuth(event).preloadAuthQuery(...)`.

A Vue/Nuxt port of `@convex-dev/better-auth`'s `usePreloadedAuthQuery`
(`src/nextjs/client.tsx`): show the preloaded server result until the preload
"expires" — i.e. auth settles as unauthenticated, or a live authenticated
result arrives — then follow the live query. The last committed value is held
while auth is (re)loading so a transient loading state does not flash the
(possibly stale) preloaded value. At runtime yields `undefined` for
unauthenticated users (as upstream does); the declared type also includes
`null` so code annotated against upstream's `| null` signature keeps
compiling.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preloadedQuery` | `MaybeRefOrGetter`\<[`Preloaded`](/api-reference/reference/vue#preloaded)\<`Query`\>\> |

#### Returns

`ComputedRef`\<`Query`\[`"_returnType"`\] \| `null` \| `undefined`\>

***

### useAuth()

```ts
function useAuth(initialToken?): UseAuthService;
```

Defined in: [src/runtime/better-auth/vue/use-auth.ts:71](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/better-auth/vue/use-auth.ts#L71)

Unified Better Auth service for the Vue/Nuxt runtime.

Returns the full Better Auth client, the reactive session wrapper, and the
Convex-compatible auth state used by the packaged auth plugin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initialToken?` | `string` \| `null` | Optional preloaded token, used once per app lifetime to avoid a round-trip on initial load (e.g. from SSR). |

#### Returns

[`UseAuthService`](#useauthservice)
