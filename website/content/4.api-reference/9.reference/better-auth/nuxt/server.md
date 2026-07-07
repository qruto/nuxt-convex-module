---
navigation: true
---

# better-auth/nuxt/server

Server-side Better Auth + Convex integration for Nuxt.

Provides [backendAuth](#backendauth) for Nuxt server handlers.

It accepts the H3
H3Event that is available in every Nuxt server route, API handler
and server middleware.

## Interfaces

### BackendAuthService

Defined in: src/runtime/better-auth/nuxt/server.ts:143

Per-request Better Auth + Convex helper returned by [backendAuth](#backendauth).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="gettoken"></a> `getToken` | () => `Promise`\<`string` \| `undefined`\> | Convex JWT for the current user, or `undefined` when not authenticated. | src/runtime/better-auth/nuxt/server.ts:145 |
| <a id="handler"></a> `handler` | () => `Promise`\<`Response`\> | Proxy a Better Auth route to the configured Convex site URL. | src/runtime/better-auth/nuxt/server.ts:147 |
| <a id="isauthenticated"></a> `isAuthenticated` | () => `Promise`\<`boolean`\> | `true` when the current request has a valid Convex auth token. | src/runtime/better-auth/nuxt/server.ts:149 |
| <a id="preloadauthquery"></a> `preloadAuthQuery` | \<`Query`\>(`query`, ...`args`) => `Promise`\<[`Preloaded`](/api-reference/reference/vue#preloaded)\<`Query`\>\> | Preload a Convex query with the current user's auth token. | src/runtime/better-auth/nuxt/server.ts:151 |
| <a id="fetchauthquery"></a> `fetchAuthQuery` | \<`Query`\>(`query`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Query`\>\> | Execute a Convex query with the current user's auth token. | src/runtime/better-auth/nuxt/server.ts:156 |
| <a id="fetchauthmutation"></a> `fetchAuthMutation` | \<`Mutation`\>(`mutation`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Mutation`\>\> | Execute a Convex mutation with the current user's auth token. | src/runtime/better-auth/nuxt/server.ts:161 |
| <a id="fetchauthaction"></a> `fetchAuthAction` | \<`Action`\>(`action`, ...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Action`\>\> | Execute a Convex action with the current user's auth token. | src/runtime/better-auth/nuxt/server.ts:166 |

## Type Aliases

### BackendAuthOptions

```ts
type BackendAuthOptions = GetTokenOptions & {
  convexUrl?: string;
  convexSiteUrl?: string;
};
```

Defined in: src/runtime/better-auth/nuxt/server.ts:125

Options for [backendAuth](#backendauth).

Extends GetTokenOptions from `@convex-dev/better-auth/utils` with
an optional override for the Convex site URL.

#### Type Declaration

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `convexUrl?` | `string` | Accepted for drop-in compatibility with upstream `convexBetterAuthNextJs` option objects and ignored — upstream requires but never reads it either; the deployment URL comes from runtime config. | src/runtime/better-auth/nuxt/server.ts:131 |
| `convexSiteUrl?` | `string` | Override the Convex site URL. Defaults to `NUXT_PUBLIC_CONVEX_SITE_URL`. | src/runtime/better-auth/nuxt/server.ts:135 |

## Variables

### convexBetterAuthNuxt

```ts
const convexBetterAuthNuxt: (event, opts?) => BackendAuthService = backendAuth;
```

Defined in: src/runtime/better-auth/nuxt/server.ts:331

Upstream-named alias of [backendAuth](#backendauth) — the mechanical rename target
for `@convex-dev/better-auth/nextjs`'s `convexBetterAuthNextJs` (framework
suffix `NextJs` → `Nuxt`). Unlike upstream's module-level factory (which
reads request state ambiently via `next/headers`), Nitro has no ambient
per-request context, so the H3 `event` is passed explicitly.

Create a per-request Better Auth + Convex helper for Nuxt server code.

Adapts the Better Auth + Convex server helper pattern to H3 events.

Call once at the top of a server route / event handler and destructure the
helpers you need. The auth token is fetched at most once per request — the
cache lives on `event.context`, so every `backendAuth(event)` instance for
the same request (server plugin, middleware, your route) shares one Better
Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | `H3Event` | The H3 event from a Nuxt server route or middleware. |
| `opts?` | [`BackendAuthOptions`](#backendauthoptions) | Optional [BackendAuthOptions](#backendauthoptions). |

#### Returns

[`BackendAuthService`](#backendauthservice)

#### Examples

```ts
// server/api/profile.get.ts
export default defineEventHandler(async (event) => {
  const { fetchAuthQuery, isAuthenticated } = backendAuth(event)
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
  return backendAuth(event).preloadAuthQuery(api.users.current)
})
```

## Functions

### backendAuth()

```ts
function backendAuth(event, opts?): BackendAuthService;
```

Defined in: src/runtime/better-auth/nuxt/server.ts:209

Create a per-request Better Auth + Convex helper for Nuxt server code.

Adapts the Better Auth + Convex server helper pattern to H3 events.

Call once at the top of a server route / event handler and destructure the
helpers you need. The auth token is fetched at most once per request — the
cache lives on `event.context`, so every `backendAuth(event)` instance for
the same request (server plugin, middleware, your route) shares one Better
Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `event` | `H3Event` | The H3 event from a Nuxt server route or middleware. |
| `opts?` | [`BackendAuthOptions`](#backendauthoptions) | Optional [BackendAuthOptions](#backendauthoptions). |

#### Returns

[`BackendAuthService`](#backendauthservice)

#### Examples

```ts
// server/api/profile.get.ts
export default defineEventHandler(async (event) => {
  const { fetchAuthQuery, isAuthenticated } = backendAuth(event)
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
  return backendAuth(event).preloadAuthQuery(api.users.current)
})
```
