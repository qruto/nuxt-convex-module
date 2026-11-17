---
navigation: false
description: "Server bindings for Convex Auth on Nuxt: a port of @convex-dev/auth/ssr/nextjs — generated TypeScript API reference for nuxt-convex-module/convex-auth/server."
seo:
  title: "API reference: convex-auth/server"
---

# convex-auth/server

Server bindings for Convex Auth on Nuxt: a port of
`@convex-dev/auth/ssr/nextjs`.

This is the thin, genuinely Nuxt-specific layer. The auth *handlers*
(per-method sign-in, plus refresh/sign-out) are framework-agnostic
`(Request) => Response` functions from `@convex-dev/auth/ssr`. What remains
Nuxt-specific is the proxy (the up-front refresh) and reading the access
token in server code.

## Interfaces

### ConvexAuthNuxtConfig

Defined in: [src/runtime/convex-auth/nuxt/server.ts:40](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L40)

Configuration for [setupConvexAuthNuxt](#setupconvexauthnuxt): upstream's
`ConvexAuthNextjsConfig` and `ConvexAuthServerConfig` in one, because the
module mounts the auth routes from the same file.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="convexurl"></a> `convexUrl?` | `string` | The Convex deployment URL used server-side. Defaults to `runtimeConfig.public.convex.url`. | [src/runtime/convex-auth/nuxt/server.ts:45](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L45) |
| <a id="refreshsession"></a> `refreshSession` | `RefreshSessionFn` | The app's `refreshSession` mutation reference. The refresh route and the proxy's optimistic refresh use it. | [src/runtime/convex-auth/nuxt/server.ts:50](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L50) |
| <a id="signout"></a> `signOut` | `SignOutFn` | The app's `signOut` mutation reference. | [src/runtime/convex-auth/nuxt/server.ts:52](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L52) |
| <a id="isauthenticated"></a> `isAuthenticated` | `IsAuthenticatedFn` | The app's `isAuthenticated` query reference, used twice over: the server verifies the access token against the backend with it (which checks its signature and that the session is live) rather than trusting the cookie by decoding it, and the client subscribes to it, so a session revoked server-side signs the browser out reactively instead of at the next failed refresh. | [src/runtime/convex-auth/nuxt/server.ts:61](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L61) |
| <a id="signin"></a> `signIn` | `ExposedSignInFn`[] | The sign-in functions of the methods to expose through the auth proxy. This should include all the Convex backend functions in your app that can issue auth sessions (e.g. account creation, log in with existing account…). Anything not listed is refused, so this allowlist is the proxy's entire API surface. Listing a function here is all the wiring an auth method needs. | [src/runtime/convex-auth/nuxt/server.ts:70](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L70) |
| <a id="cookieoptions"></a> `cookieOptions?` | `Partial`\<`AuthCookieOptions`\> | Overrides the default auth cookie attributes. `secure` may be omitted; it is on outside `nuxt dev`. | [src/runtime/convex-auth/nuxt/server.ts:75](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L75) |
| <a id="allowedorigins"></a> `allowedOrigins?` | `string`[] | Origins beyond the request's own `Host` trusted by every handler's CSRF origin check, for deployments where the two differ (e.g. a proxy that rewrites `Host`). | [src/runtime/convex-auth/nuxt/server.ts:81](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L81) |

***

### ConvexAuthNuxtContext

Defined in: [src/runtime/convex-auth/nuxt/server.ts:85](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L85)

What the proxy leaves on `event.context` for the rest of the request.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="token"></a> `token` | `string` \| `null` | The (possibly just-refreshed) access token, or null. | [src/runtime/convex-auth/nuxt/server.ts:87](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L87) |
| <a id="isauthenticatedfunctionname"></a> `isAuthenticatedFunctionName` | `string` | The name of the app's `isAuthenticated` query, for the client to subscribe to. | [src/runtime/convex-auth/nuxt/server.ts:89](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L89) |
| <a id="isauthenticated-1"></a> `isAuthenticated` | () => `Promise`\<`boolean`\> | ConvexAuthNuxt.isAuthenticatedNuxt for this request, asked of the deployment once. | [src/runtime/convex-auth/nuxt/server.ts:91](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L91) |

## Type Aliases

### ConvexAuthNuxt

```ts
type ConvexAuthNuxt = ReturnType<typeof setupConvexAuthNuxt>;
```

Defined in: [src/runtime/convex-auth/nuxt/server.ts:253](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L253)

What [setupConvexAuthNuxt](#setupconvexauthnuxt) returns.

## Functions

### setupConvexAuthNuxt()

```ts
function setupConvexAuthNuxt(config): {
  refreshHandler: RequestHandler;
  signOutHandler: RequestHandler;
  convexProxyHandler: RequestHandler;
  isAuthenticatedFunctionName: string;
  convexAuthNuxtProxy: (event) => Promise<void>;
  convexAuthNuxtAccessToken: (event) => Promise<string | null>;
  isAuthenticatedNuxt: (event) => Promise<boolean>;
};
```

Defined in: [src/runtime/convex-auth/nuxt/server.ts:150](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L150)

Build the Nuxt server helpers from one config. Export the result as the
default export of `server/convex-auth.ts`: the module mounts the auth
routes from it and refreshes the session before each render.

```ts
// server/convex-auth.ts
import { api } from '#convex/api'

export default setupConvexAuthNuxt({
  refreshSession: api.auth.refreshSession,
  signOut: api.auth.signOut,
  isAuthenticated: api.auth.isAuthenticated,
  signIn: [
    api.auth.signInWithUsernamePassword,
    api.auth.signUpWithUsernamePassword,
  ],
})
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`ConvexAuthNuxtConfig`](#convexauthnuxtconfig) |

#### Returns

| Name | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| `refreshHandler` | `RequestHandler` | - | [src/runtime/convex-auth/nuxt/server.ts:238](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L238) |
| `signOutHandler` | `RequestHandler` | - | [src/runtime/convex-auth/nuxt/server.ts:239](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L239) |
| `convexProxyHandler` | `RequestHandler` | - | [src/runtime/convex-auth/nuxt/server.ts:240](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L240) |
| `isAuthenticatedFunctionName` | `string` | The name of the app's `isAuthenticated` query. The client subscribes to it on a page the server did not render, where no payload carries it. | [src/runtime/convex-auth/nuxt/server.ts:245](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L245) |
| `convexAuthNuxtProxy()` | (`event`) => `Promise`\<`void`\> | Refreshes the session up front, so the render and the server routes after it see a fresh token. The module runs it as server middleware on every request but the auth routes, which own their cookies. | [src/runtime/convex-auth/nuxt/server.ts:246](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L246) |
| `convexAuthNuxtAccessToken()` | (`event`) => `Promise`\<`string` \| `null`\> | The current access token in server code, or null. Never triggers a refresh (the proxy does that); returns null for an expired token. The token is returned after only a local expiry check, not a signature check — that is safe because its only use is to authenticate a request to the Convex backend (e.g. `fetchQuery`), which verifies the signature itself. To decide *authentication state* server-side, use isAuthenticatedNuxt instead, which verifies against the backend. | [src/runtime/convex-auth/nuxt/server.ts:247](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L247) |
| `isAuthenticatedNuxt()` | (`event`) => `Promise`\<`boolean`\> | Whether the current request carries a valid, signed-in session. Verifies the cookie's access token against the backend (which checks its signature), so a forged cookie can't fake authentication. | [src/runtime/convex-auth/nuxt/server.ts:248](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-auth/nuxt/server.ts#L248) |
