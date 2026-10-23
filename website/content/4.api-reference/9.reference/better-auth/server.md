---
navigation: false
description: "Server-side Better Auth + Convex integration for Nuxt — generated TypeScript API reference for nuxt-convex-module/better-auth/server."
seo:
  title: "API reference: better-auth/server"
---

# better-auth/server

Server-side Better Auth + Convex integration for Nuxt.

Provides [convexAuth](#convexauth) for Nuxt server handlers: it takes the event
every Nuxt server route, API handler and server middleware receives, and
returns a request-scoped, authenticated Convex client.

## Interfaces

### ConvexAuthService

Defined in: [src/runtime/better-auth/nuxt/server.ts:193](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L193)

Per-request Better Auth + Convex helper returned by [convexAuth](#convexauth).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="gettoken"></a> `getToken` | () => `Promise`\<`string` \| `undefined`\> | Convex JWT for the current user, or `undefined` when not authenticated. | [src/runtime/better-auth/nuxt/server.ts:195](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L195) |
| <a id="handler"></a> `handler` | () => `Promise`\<`Response`\> | Proxy a Better Auth route to the configured Convex site URL. | [src/runtime/better-auth/nuxt/server.ts:197](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L197) |
| <a id="isauthenticated"></a> `isAuthenticated` | () => `Promise`\<`boolean`\> | `true` when the current request has a valid Convex auth token. | [src/runtime/better-auth/nuxt/server.ts:199](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L199) |
| <a id="preloadauthquery"></a> `preloadAuthQuery` | \<`Query`\>(`query`, ...`args`) => `Promise`\<[`Preloaded`](/api-reference/reference/client#preloaded)\<`Query`\>\> | Preload a Convex query with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:201](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L201) |
| <a id="fetchauthquery"></a> `fetchAuthQuery` | \<`Query`\>(`query`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>\> | Execute a Convex query with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:206](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L206) |
| <a id="fetchauthmutation"></a> `fetchAuthMutation` | \<`Mutation`\>(`mutation`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Mutation`\>\> | Execute a Convex mutation with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:211](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L211) |
| <a id="fetchauthaction"></a> `fetchAuthAction` | \<`Action`\>(`action`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Action`\>\> | Execute a Convex action with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:216](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L216) |

## Type Aliases

### ConvexAuthEvent

```ts
type ConvexAuthEvent = 
  | Pick<RequestEvent, "req" | "context">
  | {
  headers: Headers;
  context: Record<string, unknown>;
};
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:129](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L129)

The server event [convexAuth](#convexauth) reads: the one `defineEventHandler` from
`nuxt/server` passes, whose `req` is a web `Request`, or the h3 event a
Nuxt 4 route defined with the auto-imported `defineEventHandler`, and
`useRequestEvent()` during SSR, still pass, which carries `headers`.

***

### ConvexAuthOptions

```ts
type ConvexAuthOptions = GetTokenOptions & {
  convexUrl?: string;
  convexSiteUrl?: string;
};
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:173](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L173)

Options for [convexAuth](#convexauth).

Extends GetTokenOptions from `@convex-dev/better-auth/utils` with
an optional override for the Convex site URL.

#### Type Declaration

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `convexUrl?` | `string` | Accepted for drop-in compatibility with upstream `convexBetterAuthNextJs` option objects and ignored — upstream requires but never reads it either; the deployment URL comes from runtime config. | [src/runtime/better-auth/nuxt/server.ts:179](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L179) |
| `convexSiteUrl?` | `string` | Override the Convex site URL. Defaults to `runtimeConfig.convex.siteUrl`, then `runtimeConfig.public.convex.siteUrl`, then the `NUXT_PUBLIC_CONVEX_SITE_URL` process variable. | [src/runtime/better-auth/nuxt/server.ts:185](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L185) |

## Variables

### convexBetterAuthNuxt

```ts
const convexBetterAuthNuxt: (event, opts?) => ConvexAuthService = convexAuth;
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:382](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L382)

Upstream-named alias of [convexAuth](#convexauth) — the mechanical rename target
for `@convex-dev/better-auth/nextjs`'s `convexBetterAuthNextJs` (framework
suffix `NextJs` → `Nuxt`). Unlike upstream's module-level factory (which
reads request state ambiently via `next/headers`), Nitro has no ambient
per-request context, so the `event` is passed explicitly.

Create a per-request Better Auth + Convex helper for Nuxt server code.

Adapts the Better Auth + Convex server helper pattern to Nuxt server events.

Call once at the top of a server route / event handler and destructure the
helpers you need. The auth token is fetched at most once per request — the
cache lives on `event.context`, so every `convexAuth(event)` instance for
the same request (server plugin, middleware, your route) shares one Better
Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | [`ConvexAuthEvent`](#convexauthevent) | The event from a Nuxt server route or middleware, or `useRequestEvent()` during SSR. See [ConvexAuthEvent](#convexauthevent). |
| `opts?` | [`ConvexAuthOptions`](#convexauthoptions) | Optional [ConvexAuthOptions](#convexauthoptions). |

#### Returns

[`ConvexAuthService`](#convexauthservice)

#### Examples

```ts
// server/api/profile.get.ts
export default defineEventHandler(async (event) => {
  const { fetchAuthQuery, isAuthenticated } = convexAuth(event)
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
  return convexAuth(event).preloadAuthQuery(api.users.current)
})
```

## Functions

### convexAuth()

```ts
function convexAuth(event, opts?): ConvexAuthService;
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:259](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/better-auth/nuxt/server.ts#L259)

Create a per-request Better Auth + Convex helper for Nuxt server code.

Adapts the Better Auth + Convex server helper pattern to Nuxt server events.

Call once at the top of a server route / event handler and destructure the
helpers you need. The auth token is fetched at most once per request — the
cache lives on `event.context`, so every `convexAuth(event)` instance for
the same request (server plugin, middleware, your route) shares one Better
Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | [`ConvexAuthEvent`](#convexauthevent) | The event from a Nuxt server route or middleware, or `useRequestEvent()` during SSR. See [ConvexAuthEvent](#convexauthevent). |
| `opts?` | [`ConvexAuthOptions`](#convexauthoptions) | Optional [ConvexAuthOptions](#convexauthoptions). |

#### Returns

[`ConvexAuthService`](#convexauthservice)

#### Examples

```ts
// server/api/profile.get.ts
export default defineEventHandler(async (event) => {
  const { fetchAuthQuery, isAuthenticated } = convexAuth(event)
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
  return convexAuth(event).preloadAuthQuery(api.users.current)
})
```
