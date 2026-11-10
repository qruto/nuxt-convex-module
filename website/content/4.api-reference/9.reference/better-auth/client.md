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

Defined in: [src/runtime/better-auth/vue/cross-domain.ts:32](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L32)

Options for [consumeCrossDomainOneTimeToken](#consumecrossdomainonetimetoken).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="callbackroute"></a> `callbackRoute?` | `string` | Only exchange the one-time token when the page URL matches this route (e.g. `'/auth/callback'`; trailing slashes ignored). On every other route the `ott` parameter is scrubbed from the URL but **not** exchanged. The cross-domain protocol cannot bind the token to the browser that started the sign-in flow (magic-link flows legitimately finish in another browsing context), so without this restriction a token completes sign-in on whatever page receives it. Restricting consumption to the one route your sign-in `callbackURL`s point at keeps that to a single predictable URL. In Nuxt, set `convex.betterAuth.crossDomainCallbackRoute` instead — the client plugin forwards it here. | [src/runtime/better-auth/vue/cross-domain.ts:48](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L48) |

***

### UseBetterAuthReturn

Defined in: [src/runtime/better-auth/vue/use-better-auth.ts:190](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L190)

What `useBetterAuth()` returns.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="isloading"></a> `isLoading` | `ComputedRef`\<`boolean`\> | `true` until the session is known and no prefetched token covers the gap, or while a token from another user is replaced. | [src/runtime/better-auth/vue/use-better-auth.ts:193](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L193) |
| <a id="isauthenticated"></a> `isAuthenticated` | `ComputedRef`\<`boolean`\> | `true` when Better Auth reports a session, or the prefetched token covers the session loading. | [src/runtime/better-auth/vue/use-better-auth.ts:195](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L195) |
| <a id="fetchaccesstoken"></a> `fetchAccessToken` | [`AuthTokenFetcher`](/api-reference/reference/client#authtokenfetcher) | Convex's token fetcher: the Better Auth JWT for the current session, or `null`. | [src/runtime/better-auth/vue/use-better-auth.ts:197](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L197) |
| <a id="client"></a> `client` | `VueAuthClient` | The Better Auth client from `#convex/auth-client` — sign-in, sign-out and every plugin flow live here. | [src/runtime/better-auth/vue/use-better-auth.ts:202](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L202) |
| <a id="session"></a> `session` | [`BetterAuthSession`](#betterauthsession) | Better Auth's own `useSession()` ref: `{ data, isPending, error }`. | [src/runtime/better-auth/vue/use-better-auth.ts:204](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L204) |
| <a id="user"></a> `user` | `ComputedRef`\<[`BetterAuthUser`](#betterauthuser) \| `null`\> | The current user, or `null` when signed out / still loading. | [src/runtime/better-auth/vue/use-better-auth.ts:206](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L206) |
| <a id="authversion"></a> `authVersion` | `ComputedRef`\<`string` \| `null` \| `undefined`\> | The session id (or user id), `null` when signed out, `undefined` until the session settles. | [src/runtime/better-auth/vue/use-better-auth.ts:208](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L208) |

## Type Aliases

### AuthClient

```ts
type AuthClient = typeof authClient;
```

Defined in: [src/runtime/better-auth/vue/client.ts:20](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/client.ts#L20)

***

### AuthClientWithCrossDomain

```ts
type AuthClientWithCrossDomain = AuthClient & {
  updateSession: () => void;
  crossDomain?: {
     oneTimeToken: {
        verify: (args) => Promise<{
           data?:   | {
              session?:   | {
                 token: ...;
               }
                 | null;
            }
              | null;
        }>;
     };
  };
};
```

Defined in: [src/runtime/better-auth/vue/cross-domain.ts:13](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L13)

An [AuthClient](#authclient-1) that also includes the `crossDomainClient()` plugin.

The aliased client's type only reflects the plugins the app installed (the
bundled default omits `crossDomainClient()`), so this describes the
cross-domain additions itself.

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `updateSession()` | () => `void` | [src/runtime/better-auth/vue/cross-domain.ts:17](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L17) |
| `crossDomain?` | \{ `oneTimeToken`: \{ `verify`: (`args`) => `Promise`\<\{ `data?`: \| \{ `session?`: \| \{ `token`: ...; \} \| `null`; \} \| `null`; \}\>; \}; \} | [src/runtime/better-auth/vue/cross-domain.ts:18](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L18) |
| `crossDomain.oneTimeToken` | \{ `verify`: (`args`) => `Promise`\<\{ `data?`: \| \{ `session?`: \| \{ `token`: ...; \} \| `null`; \} \| `null`; \}\>; \} | [src/runtime/better-auth/vue/cross-domain.ts:19](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L19) |
| `crossDomain.oneTimeToken.verify()` | (`args`) => `Promise`\<\{ `data?`: \| \{ `session?`: \| \{ `token`: ...; \} \| `null`; \} \| `null`; \}\> | [src/runtime/better-auth/vue/cross-domain.ts:20](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L20) |

***

### BetterAuthSession

```ts
type BetterAuthSession = AuthClient["useSession"] extends {
  (): R;
  (useFetch): any;
} ? R : never;
```

Defined in: [src/runtime/better-auth/vue/use-better-auth.ts:184](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L184)

***

### BetterAuthUser

```ts
type BetterAuthUser = {
  id: string;
  email: string;
  name: string;
} & Record<string, unknown>;
```

Defined in: [src/runtime/better-auth/vue/use-better-auth.ts:187](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L187)

The signed-in user (loose — exact fields depend on your auth schema).

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `id` | `string` | [src/runtime/better-auth/vue/use-better-auth.ts:187](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L187) |
| `email` | `string` | [src/runtime/better-auth/vue/use-better-auth.ts:187](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L187) |
| `name` | `string` | [src/runtime/better-auth/vue/use-better-auth.ts:187](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L187) |

## Variables

### convexClient

```ts
const convexClient: () => {
  id: "convex";
  $InferServerPlugin: ReturnType<typeof convex>;
};
```

Defined in: node\_modules/@convex-dev/better-auth/dist/plugins/convex/client.d.ts:2

#### Returns

```ts
{
  id: "convex";
  $InferServerPlugin: ReturnType<typeof convex>;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `id` | `"convex"` | node\_modules/@convex-dev/better-auth/dist/plugins/convex/client.d.ts:3 |
| `$InferServerPlugin` | `ReturnType`\<*typeof* `convex`\> | node\_modules/@convex-dev/better-auth/dist/plugins/convex/client.d.ts:4 |

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
| `opts.storage.setItem` | (`key`, `value`) => `any` |
| `opts.storage.getItem` | (`key`) => `string` \| `null` |
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
           $InferServerPlugin: {
              id: "convex";
              init: (ctx) => ...;
              hooks: {
                 before: ...;
                 after: ...;
              };
              endpoints: {
                 getConvexOpenIdConfig: ...;
                 getConvexJwks: ...;
                 getLatestJwks: ...;
                 rotateKeys: ...;
                 getConvexToken: ...;
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
           $InferServerPlugin: {
              id: ...;
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
  plugins: ReturnType<typeof convexClient>[];
}>;
```

Defined in: [src/runtime/better-auth/vue/client.ts:12](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/client.ts#L12)

## Functions

### loadAuthClient()

```ts
function loadAuthClient(): Promise<VueAuthClient<{
  plugins: {
     id: "convex";
     $InferServerPlugin: {
        id: "convex";
        init: (ctx) => void;
        hooks: {
           before: (
              | {
              matcher(context): boolean;
              handler: Middleware<..., ...>;
            }
              | {
              matcher: (ctx) => ...;
              handler: Middleware<..., ...>;
           })[];
           after: {
              matcher: (ctx) => boolean;
              handler: Middleware<MiddlewareOptions, (inputContext) => ...>;
           }[];
        };
        endpoints: {
           getConvexOpenIdConfig: StrictEndpoint<"/convex/.well-known/openid-configuration", {
              method: "GET";
              metadata: {
                 isAction: false;
              };
            }, {
              issuer: string;
              jwks_uri: string;
              response_types_supported: string[];
              subject_types_supported: string[];
              id_token_signing_alg_values_supported: (... | ... | ...)[];
              claims_supported: string[];
           }>;
           getConvexJwks: StrictEndpoint<"/convex/jwks", {
              method: "GET";
              metadata: {
                 openapi: {
                    description: ...;
                    responses: ...;
                 };
              };
            }, {
              keys: JWK[];
           }>;
           getLatestJwks: StrictEndpoint<"/convex/latest-jwks", {
              isAction: boolean;
              method: "POST";
              metadata: {
                 SERVER_ONLY: true;
                 openapi: {
                    description: ...;
                 };
              };
            }, {
              alg: ... | ... | ...;
              id: string;
              publicKey: string;
              privateKey: string;
              createdAt: Date;
              expiresAt?: ... | ...;
              crv?: ... | ... | ... | ...;
           }[]>;
           rotateKeys: StrictEndpoint<"/convex/rotate-keys", {
              isAction: boolean;
              method: "POST";
              metadata: {
                 SERVER_ONLY: true;
                 openapi: {
                    description: ...;
                 };
              };
            }, {
              alg: ... | ... | ...;
              id: string;
              publicKey: string;
              privateKey: string;
              createdAt: Date;
              expiresAt?: ... | ...;
              crv?: ... | ... | ... | ...;
           }[]>;
           getConvexToken: StrictEndpoint<"/convex/token", {
              method: "GET";
              requireHeaders: true;
              use: Middleware<..., ...>[];
              metadata: {
                 openapi: {
                    description: ...;
                    responses: ...;
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
                 alg: {
                    type: "string";
                    required: false;
                 };
                 crv: {
                    type: "string";
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
}>>;
```

Defined in: [src/runtime/better-auth/vue/auth-client-loader.ts:39](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/auth-client-loader.ts#L39)

The app's Better Auth client (`#convex/auth-client`), loading it on the
first call. Every call resolves to the same instance, the one a static
`import { authClient } from 'nuxt-convex-module/better-auth/client'` holds.

#### Returns

`Promise`\<`VueAuthClient`\<\{
  `plugins`: \{
     `id`: `"convex"`;
     `$InferServerPlugin`: \{
        `id`: `"convex"`;
        `init`: (`ctx`) => `void`;
        `hooks`: \{
           `before`: (
              \| \{
              `matcher`(`context`): `boolean`;
              `handler`: `Middleware`\<..., ...\>;
            \}
              \| \{
              `matcher`: (`ctx`) => ...;
              `handler`: `Middleware`\<..., ...\>;
           \})[];
           `after`: \{
              `matcher`: (`ctx`) => `boolean`;
              `handler`: `Middleware`\<`MiddlewareOptions`, (`inputContext`) => ...\>;
           \}[];
        \};
        `endpoints`: \{
           `getConvexOpenIdConfig`: `StrictEndpoint`\<`"/convex/.well-known/openid-configuration"`, \{
              `method`: `"GET"`;
              `metadata`: \{
                 `isAction`: `false`;
              \};
            \}, \{
              `issuer`: `string`;
              `jwks_uri`: `string`;
              `response_types_supported`: `string`[];
              `subject_types_supported`: `string`[];
              `id_token_signing_alg_values_supported`: (... \| ... \| ...)[];
              `claims_supported`: `string`[];
           \}\>;
           `getConvexJwks`: `StrictEndpoint`\<`"/convex/jwks"`, \{
              `method`: `"GET"`;
              `metadata`: \{
                 `openapi`: \{
                    `description`: ...;
                    `responses`: ...;
                 \};
              \};
            \}, \{
              `keys`: `JWK`[];
           \}\>;
           `getLatestJwks`: `StrictEndpoint`\<`"/convex/latest-jwks"`, \{
              `isAction`: `boolean`;
              `method`: `"POST"`;
              `metadata`: \{
                 `SERVER_ONLY`: `true`;
                 `openapi`: \{
                    `description`: ...;
                 \};
              \};
            \}, \{
              `alg`: ... \| ... \| ...;
              `id`: `string`;
              `publicKey`: `string`;
              `privateKey`: `string`;
              `createdAt`: `Date`;
              `expiresAt?`: ... \| ...;
              `crv?`: ... \| ... \| ... \| ...;
           \}[]\>;
           `rotateKeys`: `StrictEndpoint`\<`"/convex/rotate-keys"`, \{
              `isAction`: `boolean`;
              `method`: `"POST"`;
              `metadata`: \{
                 `SERVER_ONLY`: `true`;
                 `openapi`: \{
                    `description`: ...;
                 \};
              \};
            \}, \{
              `alg`: ... \| ... \| ...;
              `id`: `string`;
              `publicKey`: `string`;
              `privateKey`: `string`;
              `createdAt`: `Date`;
              `expiresAt?`: ... \| ...;
              `crv?`: ... \| ... \| ... \| ...;
           \}[]\>;
           `getConvexToken`: `StrictEndpoint`\<`"/convex/token"`, \{
              `method`: `"GET"`;
              `requireHeaders`: `true`;
              `use`: `Middleware`\<..., ...\>[];
              `metadata`: \{
                 `openapi`: \{
                    `description`: ...;
                    `responses`: ...;
                 \};
              \};
            \}, \{
              `token`: `string`;
           \}\>;
        \};
        `schema`: \{
           `jwks`: \{
              `fields`: \{
                 `publicKey`: \{
                    `type`: `"string"`;
                    `required`: `true`;
                 \};
                 `privateKey`: \{
                    `type`: `"string"`;
                    `required`: `true`;
                 \};
                 `createdAt`: \{
                    `type`: `"date"`;
                    `required`: `true`;
                 \};
                 `expiresAt`: \{
                    `type`: `"date"`;
                    `required`: `false`;
                 \};
                 `alg`: \{
                    `type`: `"string"`;
                    `required`: `false`;
                 \};
                 `crv`: \{
                    `type`: `"string"`;
                    `required`: `false`;
                 \};
              \};
           \};
           `user`: \{
              `fields`: \{
                 `userId`: \{
                    `type`: `"string"`;
                    `required`: `false`;
                    `input`: `false`;
                 \};
              \};
           \};
        \};
     \};
  \}[];
\}\>\>

#### Example

```ts
async function signOut() {
  const client = await loadAuthClient()
  await client.signOut()
}
```

***

### consumeCrossDomainOneTimeToken()

```ts
function consumeCrossDomainOneTimeToken(options?): Promise<void>;
```

Defined in: [src/runtime/better-auth/vue/cross-domain.ts:77](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/cross-domain.ts#L77)

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
| `options?` | [`ConsumeCrossDomainOneTimeTokenOptions`](#consumecrossdomainonetimetokenoptions) |

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
| <a id="type-parameter-query"></a> `Query` *extends* [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> |

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
| `fallback?` | `string` | `'/'` | Where to send the visitor when `value` is not a safe same-origin path. Defaults to `/`, and is returned as given — pass a path you control, not user input. |

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

Defined in: [src/runtime/better-auth/vue/use-better-auth.ts:231](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/vue/use-better-auth.ts#L231)

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
