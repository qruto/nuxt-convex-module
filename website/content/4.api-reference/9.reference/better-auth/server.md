---
navigation: true
---

# better-auth/server

Server-side Better Auth + Convex integration for Nuxt.

Provides [convexAuth](#convexauth) for Nuxt server handlers.

It accepts the H3
H3Event that is available in every Nuxt server route, API handler
and server middleware.

## Interfaces

### ConvexAuthService

Defined in: [src/runtime/better-auth/nuxt/server.ts:143](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L143)

Per-request Better Auth + Convex helper returned by [convexAuth](#convexauth).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="gettoken"></a> `getToken` | () => `Promise`\<`string` \| `undefined`\> | Convex JWT for the current user, or `undefined` when not authenticated. | [src/runtime/better-auth/nuxt/server.ts:145](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L145) |
| <a id="handler"></a> `handler` | () => `Promise`\<`Response`\> | Proxy a Better Auth route to the configured Convex site URL. | [src/runtime/better-auth/nuxt/server.ts:147](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L147) |
| <a id="isauthenticated"></a> `isAuthenticated` | () => `Promise`\<`boolean`\> | `true` when the current request has a valid Convex auth token. | [src/runtime/better-auth/nuxt/server.ts:149](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L149) |
| <a id="preloadauthquery"></a> `preloadAuthQuery` | \<`Query`\>(`query`, ...`args`) => `Promise`\<[`Preloaded`](/api-reference/reference/client#preloaded)\<`Query`\>\> | Preload a Convex query with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:151](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L151) |
| <a id="fetchauthquery"></a> `fetchAuthQuery` | \<`Query`\>(`query`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>\> | Execute a Convex query with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:156](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L156) |
| <a id="fetchauthmutation"></a> `fetchAuthMutation` | \<`Mutation`\>(`mutation`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Mutation`\>\> | Execute a Convex mutation with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:161](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L161) |
| <a id="fetchauthaction"></a> `fetchAuthAction` | \<`Action`\>(`action`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Action`\>\> | Execute a Convex action with the current user's auth token. | [src/runtime/better-auth/nuxt/server.ts:166](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L166) |

## Type Aliases

### ConvexAuthOptions

```ts
type ConvexAuthOptions = GetTokenOptions & {
  convexUrl?: string;
  convexSiteUrl?: string;
};
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:125](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L125)

Options for [convexAuth](#convexauth).

Extends GetTokenOptions from `@convex-dev/better-auth/utils` with
an optional override for the Convex site URL.

#### Type Declaration

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `convexUrl?` | `string` | Accepted for drop-in compatibility with upstream `convexBetterAuthNextJs` option objects and ignored — upstream requires but never reads it either; the deployment URL comes from runtime config. | [src/runtime/better-auth/nuxt/server.ts:131](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L131) |
| `convexSiteUrl?` | `string` | Override the Convex site URL. Defaults to `NUXT_PUBLIC_CONVEX_SITE_URL`. | [src/runtime/better-auth/nuxt/server.ts:135](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L135) |

## Variables

### convexBetterAuthNuxt

```ts
const convexBetterAuthNuxt: (event, opts?) => ConvexAuthService = convexAuth;
```

Defined in: [src/runtime/better-auth/nuxt/server.ts:331](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L331)

Upstream-named alias of [convexAuth](#convexauth) — the mechanical rename target
for `@convex-dev/better-auth/nextjs`'s `convexBetterAuthNextJs` (framework
suffix `NextJs` → `Nuxt`). Unlike upstream's module-level factory (which
reads request state ambiently via `next/headers`), Nitro has no ambient
per-request context, so the H3 `event` is passed explicitly.

Create a per-request Better Auth + Convex helper for Nuxt server code.

Adapts the Better Auth + Convex server helper pattern to H3 events.

Call once at the top of a server route / event handler and destructure the
helpers you need. The auth token is fetched at most once per request — the
cache lives on `event.context`, so every `convexAuth(event)` instance for
the same request (server plugin, middleware, your route) shares one Better
Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | `H3Event` | The H3 event from a Nuxt server route or middleware. |
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

Defined in: [src/runtime/better-auth/nuxt/server.ts:209](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/better-auth/nuxt/server.ts#L209)

Create a per-request Better Auth + Convex helper for Nuxt server code.

Adapts the Better Auth + Convex server helper pattern to H3 events.

Call once at the top of a server route / event handler and destructure the
helpers you need. The auth token is fetched at most once per request — the
cache lives on `event.context`, so every `convexAuth(event)` instance for
the same request (server plugin, middleware, your route) shares one Better
Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | `H3Event` | The H3 event from a Nuxt server route or middleware. |
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
