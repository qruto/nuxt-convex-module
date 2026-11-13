---
navigation: false
description: "Server-side Better Auth + Convex integration for Nuxt — generated TypeScript API reference for nuxt-convex-module/better-auth/server."
seo:
  title: "API reference: better-auth/server"
---

# better-auth/server

Server-side Better Auth + Convex integration for Nuxt.

Provides [convexBetterAuthNuxt](#convexbetterauthnuxt) for Nuxt server handlers: it takes the event
every Nuxt server route, API handler and server middleware receives, and
returns a request-scoped, authenticated Convex client.

## Interfaces

### ConvexBetterAuthService

Defined in: [src/runtime/better-auth/nuxt/server.ts:212](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L212)

Per-request Better Auth + Convex helper returned by [convexBetterAuthNuxt](#convexbetterauthnuxt).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="gettoken"></a> `getToken` | () => `Promise`\<`string` \| `undefined`\> | Convex JWT for the current user, or `undefined` when not authenticated. | [src/runtime/better-auth/nuxt/server.ts:214](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L214) |
| <a id="handler"></a> `handler` | () => `Promise`\<`Response`\> | Proxy a Better Auth route to the configured Convex site URL. | [src/runtime/better-auth/nuxt/server.ts:216](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L216) |
| <a id="isauthenticated"></a> `isAuthenticated` | () => `Promise`\<`boolean`\> | `true` when the current request has a valid Convex auth token. | [src/runtime/better-auth/nuxt/server.ts:218](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L218) |
| <a id="preloadauthquery"></a> `preloadAuthQuery` | \<`Query`\>(`query`, ...`args`) => `Promise`\<[`Preloaded`](/api-reference/reference/client#preloaded)\<`Query`\>\> | Preload a Convex query with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:220](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L220) |
| <a id="fetchauthquery"></a> `fetchAuthQuery` | \<`Query`\>(`query`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>\> | Execute a Convex query with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:225](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L225) |
| <a id="fetchauthmutation"></a> `fetchAuthMutation` | \<`Mutation`\>(`mutation`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Mutation`\>\> | Execute a Convex mutation with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:230](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L230) |
| <a id="fetchauthaction"></a> `fetchAuthAction` | \<`Action`\>(`action`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Action`\>\> | Execute a Convex action with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:235](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L235) |

## Type Aliases

### ConvexBetterAuthEvent

```ts
type ConvexBetterAuthEvent = 
  | Pick<RequestEvent, "req" | "context">
  | {
  headers: Headers;
  context: Record<string, unknown>;
};
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:148](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L148)

The server event [convexBetterAuthNuxt](#convexbetterauthnuxt) reads: the one `defineEventHandler` from
`nuxt/server` passes, whose `req` is a web `Request`, or the h3 event a
Nuxt 4 route defined with the auto-imported `defineEventHandler`, and
`useRequestEvent()` during SSR, still pass, which carries `headers`.

***

### ConvexBetterAuthOptions

```ts
type ConvexBetterAuthOptions = GetTokenOptions & {
  convexUrl?: string;
  convexSiteUrl?: string;
};
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:192](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L192)

Options for [convexBetterAuthNuxt](#convexbetterauthnuxt).

Extends GetTokenOptions from `@convex-dev/better-auth/utils` with
an optional override for the Convex site URL.

#### Type Declaration

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `convexUrl?` | `string` | Accepted for drop-in compatibility with upstream `convexBetterAuthNextJs` option objects and ignored — upstream requires but never reads it either; the deployment URL comes from runtime config. | [src/runtime/better-auth/nuxt/server.ts:198](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L198) |
| `convexSiteUrl?` | `string` | Override the Convex site URL. Defaults to `runtimeConfig.public.convex.siteUrl`, then the `NUXT_PUBLIC_CONVEX_SITE_URL` process variable. | [src/runtime/better-auth/nuxt/server.ts:204](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L204) |

***

### ~~ConvexAuthEvent~~

```ts
type ConvexAuthEvent = ConvexBetterAuthEvent;
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:413](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L413)

#### Deprecated

Use [ConvexBetterAuthEvent](#convexbetterauthevent). Removed in the next minor release.

***

### ~~ConvexAuthOptions~~

```ts
type ConvexAuthOptions = ConvexBetterAuthOptions;
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:415](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L415)

#### Deprecated

Use [ConvexBetterAuthOptions](#convexbetterauthoptions). Removed in the next minor release.

***

### ~~ConvexAuthService~~

```ts
type ConvexAuthService = ConvexBetterAuthService;
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:417](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L417)

#### Deprecated

Use [ConvexBetterAuthService](#convexbetterauthservice). Removed in the next minor release.

## Variables

### ~~convexAuth~~

```ts
const convexAuth: (event, opts?) => ConvexBetterAuthService = convexBetterAuthNuxt;
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:410](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L410)

The old name of [convexBetterAuthNuxt](#convexbetterauthnuxt).

Create a per-request Better Auth + Convex helper for Nuxt server code.

The port of `@convex-dev/better-auth/nextjs`'s `convexBetterAuthNextJs`, with
the framework suffix `NextJs` swapped for `Nuxt`. Upstream reads the request
from `next/headers`; Nitro has no ambient per-request context, so the
`event` is passed explicitly.

Call once at the top of a server route / event handler and destructure the
helpers you need. The auth token is fetched at most once per request — the
cache lives on `event.context`, so every `convexBetterAuthNuxt(event)` instance for
the same request (server plugin, middleware, your route) shares one Better
Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | [`ConvexBetterAuthEvent`](#convexbetterauthevent) | The event from a Nuxt server route or middleware, or `useRequestEvent()` during SSR. See [ConvexBetterAuthEvent](#convexbetterauthevent). |
| `opts?` | [`ConvexBetterAuthOptions`](#convexbetterauthoptions) | Optional [ConvexBetterAuthOptions](#convexbetterauthoptions). |

#### Returns

[`ConvexBetterAuthService`](#convexbetterauthservice)

#### Examples

```ts
// server/api/profile.get.ts
export default defineEventHandler(async (event) => {
  const { fetchAuthQuery, isAuthenticated } = convexBetterAuthNuxt(event)
  if (!await isAuthenticated()) {
    throw createError({ statusCode: 401 })
  }
  return fetchAuthQuery(api.users.current)
})
```

```ts
// pages/profile.vue — preloading data for SSR
const { data } = await useAsyncData(async () => {
  const event = useRequestEvent()!
  return convexBetterAuthNuxt(event).preloadAuthQuery(api.users.current)
})
```

#### Deprecated

Use `convexBetterAuthNuxt`. Names with `ConvexAuth` and no
`Better` now belong to Convex Auth (`@convex-dev/auth`). Removed in the
next minor release.

## Functions

### convexBetterAuthNuxt()

```ts
function convexBetterAuthNuxt(event, opts?): ConvexBetterAuthService;
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:281](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L281)

Create a per-request Better Auth + Convex helper for Nuxt server code.

The port of `@convex-dev/better-auth/nextjs`'s `convexBetterAuthNextJs`, with
the framework suffix `NextJs` swapped for `Nuxt`. Upstream reads the request
from `next/headers`; Nitro has no ambient per-request context, so the
`event` is passed explicitly.

Call once at the top of a server route / event handler and destructure the
helpers you need. The auth token is fetched at most once per request — the
cache lives on `event.context`, so every `convexBetterAuthNuxt(event)` instance for
the same request (server plugin, middleware, your route) shares one Better
Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | [`ConvexBetterAuthEvent`](#convexbetterauthevent) | The event from a Nuxt server route or middleware, or `useRequestEvent()` during SSR. See [ConvexBetterAuthEvent](#convexbetterauthevent). |
| `opts?` | [`ConvexBetterAuthOptions`](#convexbetterauthoptions) | Optional [ConvexBetterAuthOptions](#convexbetterauthoptions). |

#### Returns

[`ConvexBetterAuthService`](#convexbetterauthservice)

#### Examples

```ts
// server/api/profile.get.ts
export default defineEventHandler(async (event) => {
  const { fetchAuthQuery, isAuthenticated } = convexBetterAuthNuxt(event)
  if (!await isAuthenticated()) {
    throw createError({ statusCode: 401 })
  }
  return fetchAuthQuery(api.users.current)
})
```

```ts
// pages/profile.vue — preloading data for SSR
const { data } = await useAsyncData(async () => {
  const event = useRequestEvent()!
  return convexBetterAuthNuxt(event).preloadAuthQuery(api.users.current)
})
```
