---
navigation: true
---

# better-auth/vue

Public Vue API for the opt-in Better Auth integration — a Vue/Nuxt port of
`@convex-dev/better-auth`'s `react` integration.

## Interfaces

### UseAuthService

Defined in: src/runtime/better-auth/vue/use-auth.ts:35

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client` | [`AuthClient`](#authclient) | - | src/runtime/better-auth/vue/use-auth.ts:36 |
| <a id="session"></a> `session` | [`AuthSession`](#authsession) | - | src/runtime/better-auth/vue/use-auth.ts:37 |
| <a id="user"></a> `user` | `ComputedRef`\<`AuthUser` \| `null`\> | The current user, or `null` when signed out / still loading. | src/runtime/better-auth/vue/use-auth.ts:39 |
| <a id="isauthenticated"></a> `isAuthenticated` | `ComputedRef`\<`boolean`\> | - | src/runtime/better-auth/vue/use-auth.ts:40 |
| <a id="isloading"></a> `isLoading` | `ComputedRef`\<`boolean`\> | - | src/runtime/better-auth/vue/use-auth.ts:41 |
| <a id="fetchaccesstoken"></a> `fetchAccessToken` | [`AuthTokenFetcher`](/api-reference/reference/vue#authtokenfetcher) | - | src/runtime/better-auth/vue/use-auth.ts:42 |
| <a id="authversion"></a> `authVersion` | `ComputedRef`\<`string` \| `null`\> | - | src/runtime/better-auth/vue/use-auth.ts:43 |
| <a id="signout"></a> `signOut` | () => `Promise`\<`unknown`\> | Sign the current user out. | src/runtime/better-auth/vue/use-auth.ts:45 |
| <a id="sendotp"></a> `sendOtp` | (`email`, `type?`) => `Promise`\<`unknown`\> | Send a sign-in / verification OTP code to an email. | src/runtime/better-auth/vue/use-auth.ts:47 |
| <a id="signinwithotp"></a> `signInWithOtp` | (`args`) => `Promise`\<`unknown`\> | Complete sign-in (or passwordless sign-up) with an emailed OTP code. | src/runtime/better-auth/vue/use-auth.ts:49 |
| <a id="signinwithpasskey"></a> `signInWithPasskey` | () => `Promise`\<`unknown`\> | Sign in with a passkey (WebAuthn). | src/runtime/better-auth/vue/use-auth.ts:51 |
| <a id="registerpasskey"></a> `registerPasskey` | (`context?`) => `Promise`\<`unknown`\> | Register a passkey — pass `{ email, name }` (JSON) for pre-auth registration. | src/runtime/better-auth/vue/use-auth.ts:53 |
| <a id="changeemail"></a> `changeEmail` | (`newEmail`, `callbackURL?`) => `Promise`\<`unknown`\> | Change the account email (confirmed via email). | src/runtime/better-auth/vue/use-auth.ts:55 |
| <a id="deleteaccount"></a> `deleteAccount` | () => `Promise`\<`unknown`\> | Delete the account (confirmed via email). | src/runtime/better-auth/vue/use-auth.ts:57 |

## Type Aliases

### AuthClient

```ts
type AuthClient = AuthClientWithPlugins<[ConvexPlugin, EmailOTPPlugin, PasskeyPlugin]>;
```

Defined in: src/runtime/better-auth/vue/client.ts:13

***

### AuthSession

```ts
type AuthSession = ReturnType<typeof useClientSession>;
```

Defined in: src/runtime/better-auth/vue/use-auth.ts:30

## Variables

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
  getAuthUserFn: {
     type: PropType<FunctionReference<"query">>;
     required: true;
  };
  isAuthError: {
     type: PropType<(error) => boolean>;
     required: true;
  };
  renderFallback: {
     type: PropType<() => 
        | VNode<RendererNode, RendererElement, {
      [key: string]: any;
      }>
       | null>;
     default: undefined;
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
}>[])[]
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
  getAuthUserFn: {
     type: PropType<FunctionReference<"query">>;
     required: true;
  };
  isAuthError: {
     type: PropType<(error) => boolean>;
     required: true;
  };
  renderFallback: {
     type: PropType<() => 
        | VNode<RendererNode, RendererElement, {
      [key: string]: any;
      }>
       | null>;
     default: undefined;
  };
}>, {
}>, {
  renderFallback: () => 
     | VNode<RendererNode, RendererElement, {
   [key: string]: any;
   }>
    | null;
}, SlotsType<{
  default: () => VNode<RendererNode, RendererElement, {
   [key: string]: any;
  }>[];
}>, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: src/runtime/better-auth/vue/auth-boundary.ts:47

_Experimental_

A Vue port of `@convex-dev/better-auth`'s `AuthBoundary` — error handling for
auth-related errors. Typically redirects to the login page when the user is
unauthenticated, reactively based on the `getAuthUserFn` query, and clears the
session cookie via `authClient.getSession()` before calling `onUnauth`.

#### Example

```vue
<AuthBoundary
  :auth-client="authClient"
  :get-auth-user-fn="api.auth.getAuthUser"
  :is-auth-error="isAuthError"
  :on-unauth="() => navigateTo('/login')"
>
  <slot />
</AuthBoundary>
```

***

### authClient

```ts
const authClient: AuthClient;
```

Defined in: src/runtime/better-auth/vue/client.ts:15

## Functions

### consumeCrossDomainOneTimeToken()

```ts
function consumeCrossDomainOneTimeToken(): Promise<void>;
```

Defined in: src/runtime/better-auth/vue/cross-domain.ts:52

Exchange a `?ott=...` one-time token (set by the Better Auth cross-domain
plugin when redirecting from an auth origin) for a full session.

Safe to call unconditionally — returns early when the URL has no `ott`
parameter or the cross-domain plugin is not installed on the auth client.

#### Returns

`Promise`\<`void`\>

***

### usePreloadedAuthQuery()

```ts
function usePreloadedAuthQuery<Query>(preloadedQuery): ComputedRef<FunctionReturnType<Query> | null>;
```

Defined in: src/runtime/better-auth/vue/hydration.ts:19

Auth-aware version of usePreloadedQuery for payloads returned by
`backendAuth(event).preloadAuthQuery(...)`.

Keeps the server-rendered result visible while client auth is still
loading, skips the live query while unauthenticated, and switches to live
data once Convex confirms the authenticated state.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preloadedQuery` | [`Preloaded`](/api-reference/reference/vue#preloaded)\<`Query`\> |

#### Returns

`ComputedRef`\<[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Query`\> \| `null`\>

***

### useAuth()

```ts
function useAuth(initialToken?): UseAuthService;
```

Defined in: src/runtime/better-auth/vue/use-auth.ts:69

Unified Better Auth service for the Vue/Nuxt runtime.

Returns the full Better Auth client, the reactive session wrapper, and the
Convex-compatible auth state used by the packaged auth plugin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initialToken?` | `string` \| `null` | Optional preloaded token, used once per app lifetime to avoid a round-trip on initial load (e.g. from SSR). |

#### Returns

[`UseAuthService`](#useauthservice)
