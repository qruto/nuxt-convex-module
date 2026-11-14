---
navigation: false
description: "Vue bindings for Convex Auth — generated TypeScript API reference for nuxt-convex-module/convex-auth/client."
seo:
  title: "API reference: convex-auth/client"
---

# convex-auth/client

Vue bindings for Convex Auth.

A Vue/Nuxt port of `@convex-dev/auth/react`. Call [provideConvexAuth](#provideconvexauth)
in a top-level component to enable authentication. The provider owns the
token lifecycle (storing the session, refreshing the access token, signing
out) and feeds [provideConvexWithAuth](/api-reference/reference/client#provideconvexwithauth).

Sign-in methods are deliberately not part of this core: each sign-in method
(password, OAuth, passkey, …) ships its own authentication API that returns a
[TokenBundle](#tokenbundle). Hand that bundle to [useAuthActions](#useauthactions)'s `setSession`
which allows the Convex client to authenticate with the backend.

## Interfaces

### TokenStorage

Defined in: node\_modules/@convex-dev/auth/dist/browser/storage.d.ts:18

Read/write/delete string values by key. Every method may be synchronous or
return a promise, so async stores (e.g. React Native secure storage) work
without ceremony.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="getitem"></a> `getItem` | (`key`) => \| `string` \| `Promise`\<`string` \| `null` \| `undefined`\> \| `null` \| `undefined` | Read a value. | node\_modules/@convex-dev/auth/dist/browser/storage.d.ts:20 |
| <a id="setitem"></a> `setItem` | (`key`, `value`) => `void` \| `Promise`\<`void`\> | Write a value. | node\_modules/@convex-dev/auth/dist/browser/storage.d.ts:22 |
| <a id="removeitem"></a> `removeItem` | (`key`) => `void` \| `Promise`\<`void`\> | Remove a value. | node\_modules/@convex-dev/auth/dist/browser/storage.d.ts:24 |

***

### ConvexAuthProviderOptions

Defined in: [src/runtime/convex-auth/vue/index.ts:40](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L40)

Options for [provideConvexAuth](#provideconvexauth) / `<ConvexAuthProvider>`.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="client"></a> `client?` | [`ConvexVueClient`](/api-reference/reference/client#convexvueclient) | Convex client to authenticate. Defaults to the client `useConvex()` returns. | [src/runtime/convex-auth/vue/index.ts:42](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L42) |
| <a id="api"></a> `api` | [`ConvexAuthApi`](#convexauthapi) | The app's `refreshSession` and `signOut` mutation references, and its `isAuthenticated` query reference. The provider subscribes to `isAuthenticated`, so a session revoked server-side signs the client out reactively. | [src/runtime/convex-auth/vue/index.ts:48](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L48) |
| <a id="storage"></a> `storage?` | [`TokenStorage`](#tokenstorage) | A custom [TokenStorage](#tokenstorage) implementation. If none is supplied, the system defaults to `localStorage` in the browser and in-memory where there is no `localStorage` (SSR). | [src/runtime/convex-auth/vue/index.ts:55](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L55) |
| <a id="storagenamespace"></a> `storageNamespace?` | `string` | Namespace for storage keys, which determines whether tokens are shared. Non-alphanumeric characters are ignored. Defaults to the deployment URL. | [src/runtime/convex-auth/vue/index.ts:60](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L60) |
| <a id="ambientsignins"></a> `ambientSignIns?` | `AmbientSignInClient`[] | Advanced. Ambient sign-ins run initialization for sign-in methods that can take action outside of a user activated sign in flow, such as reading an oauth code from a url query param. Setting this replaces the default (`[oauth()]`) entirely rather than adding to it. Pass `[]` to register nothing. Read once when the client is created and not expected to change. | [src/runtime/convex-auth/vue/index.ts:70](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L70) |

## Type Aliases

### TokenBundle

```ts
type TokenBundle = Infer<typeof vTokenBundle>;
```

Defined in: node\_modules/@convex-dev/auth/dist/lib/types.d.ts:32

***

### ConvexAuthApi

```ts
type ConvexAuthApi = {
  refreshSession: RefreshSessionFn;
  signOut: SignOutFn;
  isAuthenticated: IsAuthenticatedFn;
};
```

Defined in: node\_modules/@convex-dev/auth/dist/lib/types.d.ts:224

The auth functions the app exports from `setupConvexAuth`.
Passed as references (not names) because an app may re-export them under any
names. Consumed by both SPA and SSR implementations.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="refreshsession"></a> `refreshSession` | `RefreshSessionFn` | node\_modules/@convex-dev/auth/dist/lib/types.d.ts:225 |
| <a id="signout"></a> `signOut` | `SignOutFn` | node\_modules/@convex-dev/auth/dist/lib/types.d.ts:226 |
| <a id="isauthenticated"></a> `isAuthenticated` | `IsAuthenticatedFn` | node\_modules/@convex-dev/auth/dist/lib/types.d.ts:227 |

***

### ConvexAuthActionsContextType

```ts
type ConvexAuthActionsContextType = {
  setSession: (session) => Promise<void>;
  signOut: () => Promise<void>;
};
```

Defined in: [src/runtime/convex-auth/vue/client.ts:36](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/client.ts#L36)

The value exposed by [useAuthActions](#useauthactions).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="setsession"></a> `setSession` | (`session`) => `Promise`\<`void`\> | Initialize or refresh a session. A SPA client will receive a full [TokenBundle](#tokenbundle) so it can access the refresh token for direct session refreshing. An SSR client will receive a SlimTokenBundle which doesn't include the refresh token (that value is in an httpOnly cookie, not reachable by client JS code). | [src/runtime/convex-auth/vue/client.ts:45](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/client.ts#L45) |
| <a id="signout-1"></a> `signOut` | () => `Promise`\<`void`\> | Sign out: revoke the session on the server and clear it locally. | [src/runtime/convex-auth/vue/client.ts:47](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/client.ts#L47) |

## Variables

### ConvexAuthProvider

```ts
const ConvexAuthProvider: DefineComponent<ExtractPropTypes<{
  client: {
     type: PropType<ConvexVueClient>;
     default: undefined;
  };
  api: {
     type: PropType<ConvexAuthApi>;
     required: true;
  };
  storage: {
     type: PropType<TokenStorage>;
     default: undefined;
  };
  storageNamespace: {
     type: StringConstructor;
     default: undefined;
  };
  ambientSignIns: {
     type: PropType<AmbientSignInClient[]>;
     default: undefined;
  };
}>, () => 
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>[]
  | undefined, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  client: {
     type: PropType<ConvexVueClient>;
     default: undefined;
  };
  api: {
     type: PropType<ConvexAuthApi>;
     required: true;
  };
  storage: {
     type: PropType<TokenStorage>;
     default: undefined;
  };
  storageNamespace: {
     type: StringConstructor;
     default: undefined;
  };
  ambientSignIns: {
     type: PropType<AmbientSignInClient[]>;
     default: undefined;
  };
}>, {
}>, {
  client: ConvexVueClient;
  storage: TokenStorage;
  storageNamespace: string;
  ambientSignIns: AmbientSignInClient[];
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/convex-auth/vue/index.ts:147](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L147)

A wrapper Vue component which enables authentication: the component form of
[provideConvexAuth](#provideconvexauth), kept as a drop-in parity port of
`@convex-dev/auth/react`'s `<ConvexAuthProvider>`. Renders its default slot.

## Functions

### provideConvexAuth()

```ts
function provideConvexAuth(options): ConvexAuthState;
```

Defined in: [src/runtime/convex-auth/vue/index.ts:96](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L96)

Call this in a top-level component's `setup` to enable authentication: the
Vue translation of wrapping the app in `@convex-dev/auth/react`'s
`<ConvexAuthProvider>`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConvexAuthProviderOptions`](#convexauthprovideroptions) |

#### Returns

[`ConvexAuthState`](/api-reference/reference/client#convexauthstate)

#### Example

```vue
<script setup lang="ts">
import { provideConvexAuth } from 'nuxt-convex-module/convex-auth/client'
import { api } from '../convex/_generated/api'

provideConvexAuth({
  api: {
    refreshSession: api.auth.refreshSession,
    signOut: api.auth.signOut,
    isAuthenticated: api.auth.isAuthenticated,
  },
})
</script>
```

***

### useAuthActions()

```ts
function useAuthActions(): ConvexAuthActionsContextType;
```

Defined in: [src/runtime/convex-auth/vue/index.ts:181](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L181)

Access the auth actions:

```ts
const { setSession, signOut } = useAuthActions();
```

- `setSession` adopts a [TokenBundle](#tokenbundle) produced by the sign-in of a
  method.
- `signOut` revokes and clears the session.

#### Returns

[`ConvexAuthActionsContextType`](#convexauthactionscontexttype)

***

### useAuthToken()

```ts
function useAuthToken(): ComputedRef<string | null>;
```

Defined in: [src/runtime/convex-auth/vue/index.ts:200](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/vue/index.ts#L200)

The current access token (a JWT), or null when signed out.

Use it to authenticate requests to your Convex HTTP actions
(`Authorization: Bearer <token>`). Treat it as an ID token — do not send it
to other servers.

#### Returns

`ComputedRef`\<`string` \| `null`\>
