---
navigation: false
description: "Public client-side API for the opt-in Better Auth integration — a Vue/Nuxt port of @convex-dev/better-auth's react integration."
seo:
  title: "API reference: better-auth/client"
---

# better-auth/client

Public client-side API for the opt-in Better Auth integration — a Vue/Nuxt
port of `@convex-dev/better-auth`'s `react` integration.

## Interfaces

### ConsumeCrossDomainOneTimeTokenOptions

Defined in: [src/runtime/better-auth/vue/cross-domain.ts:26](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L26)

Options for [consumeCrossDomainOneTimeToken](#consumecrossdomainonetimetoken).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="callbackroute"></a> `callbackRoute?` | `string` | Only exchange the one-time token when the page URL matches this route (e.g. `'/auth/callback'`; trailing slashes ignored). On every other route the `ott` parameter is scrubbed from the URL but **not** exchanged. The cross-domain protocol cannot bind the token to the browser that started the sign-in flow (magic-link flows legitimately finish in another browsing context), so without this restriction a token completes sign-in on whatever page receives it. Restricting consumption to the one route your sign-in `callbackURL`s point at keeps that to a single predictable URL. In Nuxt, set `convex.betterAuth.crossDomainCallbackRoute` instead — the client plugin forwards it here. | [src/runtime/better-auth/vue/cross-domain.ts:42](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L42) |

***

### UseBetterAuthReturn

Defined in: [src/runtime/better-auth/vue/use-better-auth.ts:36](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L36)

What `useBetterAuth()` returns.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="isloading"></a> `isLoading` | `ComputedRef`\<`boolean`\> | `true` until the session is known and no prefetched token covers the gap. | [src/runtime/better-auth/vue/use-better-auth.ts:39](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L39) |
| <a id="isauthenticated"></a> `isAuthenticated` | `ComputedRef`\<`boolean`\> | `true` when Better Auth reports a session, or a token is cached while it reloads. | [src/runtime/better-auth/vue/use-better-auth.ts:41](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L41) |
| <a id="fetchaccesstoken"></a> `fetchAccessToken` | [`AuthTokenFetcher`](/api-reference/reference/client#authtokenfetcher) | Convex's token fetcher: the Better Auth JWT for the current session, or `null`. | [src/runtime/better-auth/vue/use-better-auth.ts:43](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L43) |
| <a id="client"></a> `client` | `VueAuthClient` | The Better Auth client from `#convex/auth-client` — sign-in, sign-out and every plugin flow live here. | [src/runtime/better-auth/vue/use-better-auth.ts:48](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L48) |
| <a id="session"></a> `session` | [`BetterAuthSession`](#betterauthsession) | Better Auth's own `useSession()` ref: `{ data, isPending, error }`. | [src/runtime/better-auth/vue/use-better-auth.ts:50](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L50) |
| <a id="user"></a> `user` | `ComputedRef`\<[`BetterAuthUser`](#betterauthuser) \| `null`\> | The current user, or `null` when signed out / still loading. | [src/runtime/better-auth/vue/use-better-auth.ts:52](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L52) |
| <a id="authversion"></a> `authVersion` | `ComputedRef`\<`string` \| `null`\> | The session id (or user id); changes when the signed-in identity changes. | [src/runtime/better-auth/vue/use-better-auth.ts:54](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L54) |

## Type Aliases

### AuthClient

```ts
type AuthClient = typeof authClient;
```

Defined in: [src/runtime/better-auth/vue/client.ts:18](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/client.ts#L18)

***

### BetterAuthSession

```ts
type BetterAuthSession = ReturnType<typeof useClientSession>;
```

Defined in: [src/runtime/better-auth/vue/use-better-auth.ts:30](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L30)

***

### BetterAuthUser

```ts
type BetterAuthUser = {
  id: string;
  email: string;
  name: string;
} & Record<string, unknown>;
```

Defined in: [src/runtime/better-auth/vue/use-better-auth.ts:33](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L33)

The signed-in user (loose — exact fields depend on your auth schema).

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `id` | `string` | [src/runtime/better-auth/vue/use-better-auth.ts:33](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L33) |
| `email` | `string` | [src/runtime/better-auth/vue/use-better-auth.ts:33](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L33) |
| `name` | `string` | [src/runtime/better-auth/vue/use-better-auth.ts:33](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L33) |

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
     type: PropType<VueAuthClient<{
        plugins: {
           id: "convex";
           version: string;
           $InferServerPlugin: {
              id: "convex";
              version: string;
              init: (ctx) => ...;
              hooks: {
                 before: ...;
                 after: ...;
              };
              endpoints: {
                 getOpenIdConfig: ...;
                 getJwks: ...;
                 getLatestJwks: ...;
                 rotateKeys: ...;
                 getToken: ...;
              };
              schema: {
                 jwks: ...;
                 user: ...;
              };
           };
        }[];
     }>>;
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
     type: PropType<VueAuthClient<{
        plugins: {
           id: "convex";
           version: string;
           $InferServerPlugin: {
              id: ...;
              version: ...;
              init: ...;
              hooks: ...;
              endpoints: ...;
              schema: ...;
           };
        }[];
     }>>;
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

Defined in: [src/runtime/better-auth/vue/auth-boundary.ts:83](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/auth-boundary.ts#L83)

**`Experimental`**

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
import { api } from '#convex/api'
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

 May change in a minor release — see STABILITY.md.

***

### authClient

```ts
const authClient: VueAuthClient<{
  plugins: {
     id: "convex";
     version: string;
     $InferServerPlugin: {
        id: "convex";
        version: string;
        init: (ctx) => void;
        hooks: {
           before: (
              | {
              matcher: boolean;
              handler: (inputContext) => Promise<...>;
            }
              | {
              matcher: (ctx) => boolean;
              handler: (inputContext) => Promise<...>;
           })[];
           after: {
              matcher: (context) => boolean;
              handler: MiddlewareHandler;
           }[];
        };
        endpoints: {
           getOpenIdConfig: StrictEndpoint<"/convex/.well-known/openid-configuration", {
              method: "GET";
              metadata: {
                 isAction: false;
              };
           }, OIDCMetadata>;
           getJwks: StrictEndpoint<"/convex/jwks", {
              method: "GET";
              metadata: {
                 openapi: {
                    description: string;
                    responses: {
                       200: ...;
                    };
                 };
              };
           }, JSONWebKeySet>;
           getLatestJwks: StrictEndpoint<"/convex/latest-jwks", {
              isAction: boolean;
              method: "POST";
              metadata: {
                 SERVER_ONLY: true;
                 openapi: {
                    description: string;
                 };
              };
           }, any[]>;
           rotateKeys: StrictEndpoint<"/convex/rotate-keys", {
              isAction: boolean;
              method: "POST";
              metadata: {
                 SERVER_ONLY: true;
                 openapi: {
                    description: string;
                 };
              };
           }, any[]>;
           getToken: StrictEndpoint<"/convex/token", {
              method: "GET";
              requireHeaders: true;
              use: (inputContext) => Promise<...>[];
              metadata: {
                 openapi: {
                    description: string;
                    responses: {
                       200: ...;
                    };
                 };
              };
            }, {
              token: string;
           }>;
        };
        schema: {
           jwks: {
              fields: {
                 publicKey: {
                    type: "string";
                    required: true;
                 };
                 privateKey: {
                    type: "string";
                    required: true;
                 };
                 createdAt: {
                    type: "date";
                    required: true;
                 };
                 expiresAt: {
                    type: "date";
                    required: false;
                 };
              };
           };
           user: {
              fields: {
                 userId: {
                    type: "string";
                    required: false;
                    input: false;
                 };
              };
           };
        };
     };
  }[];
}>;
```

Defined in: [src/runtime/better-auth/vue/client.ts:9](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/client.ts#L9)

## Functions

### consumeCrossDomainOneTimeToken()

```ts
function consumeCrossDomainOneTimeToken(options?): Promise<void>;
```

Defined in: [src/runtime/better-auth/vue/cross-domain.ts:71](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L71)

Exchange a `?ott=...` one-time token (set by the Better Auth cross-domain
plugin when redirecting from an auth origin) for a full session — the Vue
port of `ConvexBetterAuthProvider`'s one-time-token `useEffect`.

Safe to call unconditionally — returns early when the URL has no `ott`
parameter or the cross-domain plugin is not installed on the auth client.

The token is not bound to the browser that initiated sign-in (upstream
design), so anyone holding a fresh token can mint a link that logs its
visitor into *their* session — see
[ConsumeCrossDomainOneTimeTokenOptions.callbackRoute](#callbackroute) for the
mitigation.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConsumeCrossDomainOneTimeTokenOptions`](#consumecrossdomainonetimetokenoptions) |

#### Returns

`Promise`\<`void`\>

***

### usePreloadedAuthQuery()

```ts
function usePreloadedAuthQuery<Query>(preloadedQuery): ComputedRef<Query["_returnType"] | null | undefined>;
```

Defined in: [src/runtime/better-auth/vue/hydration.ts:65](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/hydration.ts#L65)

Auth-aware version of [usePreloadedQuery](/api-reference/reference/client#usepreloadedquery) for payloads returned by
`convexAuth(event).preloadAuthQuery(...)`.

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
| `Query` *extends* [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `preloadedQuery` | `MaybeRefOrGetter`\<[`Preloaded`](/api-reference/reference/client#preloaded)\<`Query`\>\> |

#### Returns

`ComputedRef`\<`Query`\[`"_returnType"`\] \| `null` \| `undefined`\>

***

### resolveAuthRedirect()

```ts
function resolveAuthRedirect(value, fallback?): string;
```

Defined in: [src/runtime/better-auth/vue/redirect.ts:53](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/redirect.ts#L53)

Validate a post-sign-in redirect destination, returning `fallback` unless it
is a same-origin path.

Use it wherever a login page consumes the `?redirect=` query the `auth`
middleware sets — never navigate to that value directly.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `value` | `unknown` | `undefined` | Candidate destination, typically `route.query.redirect`. A repeated query parameter arrives as an array and is rejected: which entry the app meant is ambiguous, and an attacker chooses the other one. |
| `fallback` | `string` | `'/'` | Where to send the visitor when `value` is not a safe same-origin path. Defaults to `/`, and is returned as given — pass a path you control, not user input. |

#### Returns

`string`

The normalized `pathname + search + hash`, or `fallback`.

#### Example

```vue
<script setup lang="ts">
const route = useRoute()
const { client } = useBetterAuth()

async function onSubmit() {
  await client.signIn.email({ email, password })
  // '/dashboard' survives; 'https://evil.example' becomes '/'.
  await navigateTo(resolveAuthRedirect(route.query.redirect))
}
</script>
```

***

### useBetterAuth()

```ts
function useBetterAuth(initialToken?): UseBetterAuthReturn;
```

Defined in: [src/runtime/better-auth/vue/use-better-auth.ts:77](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L77)

The Better Auth service for the Vue/Nuxt runtime.

Returns the full Better Auth client, the reactive session wrapper, and the
Convex-compatible auth state used by the packaged auth plugin.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `initialToken?` | `string` \| `null` | Optional preloaded token, used once per app lifetime to avoid a round-trip on initial load (e.g. from SSR). |

#### Returns

[`UseBetterAuthReturn`](#usebetterauthreturn)

#### Example

```vue
<script setup lang="ts">
const { user, client, isAuthenticated } = useBetterAuth()

const signOut = () => client.signOut()
</script>
```
