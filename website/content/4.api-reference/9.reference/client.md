---
navigation: true
---

# client

Tools to integrate Convex into Vue applications.

This module contains:
1. [ConvexVueClient](#convexvueclient), a client for using Convex in Vue.
2. [ConvexClientKey](#convexclientkey), an injection key that stores this client in Vue context.
3. [Authenticated](#authenticated), [Unauthenticated](#unauthenticated), [AuthLoading](#authloading) and [AuthRefreshing](#authrefreshing) helper auth components.
4. Composables [useQuery](#usequery), [useMutation](#usemutation), [useAction](#useaction) and more for accessing this
   client from your Vue components.

## Usage

### Creating the client

```typescript
import { ConvexVueClient } from "nuxt-convex-module/client";

// typically loaded from an environment variable
const address = "https://small-mouse-123.convex.cloud"
const convex = new ConvexVueClient(address);
```

### Storing the client in Vue context

```typescript
import { ConvexClientKey } from "nuxt-convex-module/client";

// (the Nuxt module registers a plugin that does this automatically)
app.provide(ConvexClientKey, convex);
```

### Using the auth helpers

```typescript
import { Authenticated, Unauthenticated, AuthLoading, AuthRefreshing } from "nuxt-convex-module/client";

<Authenticated>
  Logged in
</Authenticated>
<Unauthenticated>
  Logged out
</Unauthenticated>
<AuthLoading>
  Still loading
</AuthLoading>
<AuthRefreshing>
  Refreshing token...
</AuthRefreshing>
```

### Using Vue composables

```typescript
import { useQuery, useMutation } from "nuxt-convex-module/client";
import { api } from "../convex/_generated/api";

// In your component's <script setup>:
const counter = useQuery(api.getCounter.default);
const increment = useMutation(api.incrementCounter.default);
// Your component here!
```

## Classes

### ConvexVueClient

Defined in: [src/runtime/vue/client.ts:191](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L191)

A Convex client for use within Vue.

This loads reactive queries and executes mutations over a WebSocket.

In a Nuxt app the client is provided automatically by the plugin and
available via the [useConvex](#useconvex) composable or `useNuxtApp().$convex`.

#### Constructors

##### Constructor

```ts
new ConvexVueClient(address, options?): ConvexVueClient;
```

Defined in: [src/runtime/vue/client.ts:212](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L212)

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `address` | `string` | The url of your Convex deployment, often provided by an environment variable. E.g. `https://small-mouse-123.convex.cloud`. |
| `options?` | [`ConvexVueClientOptions`](#convexvueclientoptions) | See [ConvexVueClientOptions](#convexvueclientoptions) for a full description. |

###### Returns

[`ConvexVueClient`](#convexvueclient)

#### Accessors

##### url

###### Get Signature

```ts
get url(): string;
```

Defined in: [src/runtime/vue/client.ts:250](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L250)

Return the address for this client, useful for creating a new client.

Not guaranteed to match the address with which this client was constructed:
it may be canonicalized.

###### Returns

`string`

##### logger

###### Get Signature

```ts
get logger(): Logger;
```

Defined in: [src/runtime/vue/client.ts:582](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L582)

Get the logger for this client.

###### Returns

`Logger`

The [ConvexLogger](#convexlogger) for this client.

#### Methods

##### setAuth()

```ts
setAuth(
   fetchToken, 
   onChange?, 
   onRefreshChange?): void;
```

Defined in: [src/runtime/vue/client.ts:292](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L292)

Set the authentication token to be used for subsequent queries and mutations.
`fetchToken` will be called automatically again if a token expires.
`fetchToken` should return `null` if the token cannot be retrieved, for example
when the user's rights were permanently revoked.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fetchToken` | [`AuthTokenFetcher`](#authtokenfetcher) | an async function returning the JWT-encoded OpenID Connect Identity Token |
| `onChange?` | (`isAuthenticated`) => `void` | a callback that will be called when the authentication status changes |
| `onRefreshChange?` | (`isRefreshing`) => `void` | a callback called with `true` when the socket is paused to fetch a replacement token after a server rejection, and `false` when refresh completes |

###### Returns

`void`

##### clearAuth()

```ts
clearAuth(): void;
```

Defined in: [src/runtime/vue/client.ts:316](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L316)

Clear the current authentication token if set.

###### Returns

`void`

##### watchQuery()

```ts
watchQuery<Query>(query, ...argsAndOptions): Watch<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/vue/client.ts:350](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L350)

Construct a new [Watch](#watch) on a Convex query function.

**Most application code should not call this method directly. Instead use
the [useQuery](#usequery) composable.**

The act of creating a watch does nothing, a Watch is stateless.

###### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](#functionreference)\<`"query"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | A server.FunctionReference for the public query to run. |
| ...`argsAndOptions` | [`ArgsAndOptions`](#argsandoptions)\<`Query`, [`WatchQueryOptions`](#watchqueryoptions)\> | - |

###### Returns

[`Watch`](#watch)\<[`FunctionReturnType`](#functionreturntype)\<`Query`\>\>

The [Watch](#watch) object.

##### prewarmQuery()

```ts
prewarmQuery<Query>(queryOptions): void;
```

Defined in: [src/runtime/vue/client.ts:428](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L428)

Indicates likely future interest in a query subscription.

The implementation currently immediately subscribes to a query. In the future this method
may prioritize some queries over others, fetch the query result without subscribing, or
do nothing in slow network connections or high load scenarios.

To use this in a Vue component, call useQuery() and ignore the return value.

###### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](#functionreference)\<`"query"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queryOptions` | [`QueryOptions`](#queryoptions)\<`Query`\> & \{ `extendSubscriptionFor?`: `number`; \} | A query (function reference from an api object) and its args, plus an optional extendSubscriptionFor for how long to subscribe to the query. |

###### Returns

`void`

##### mutation()

```ts
mutation<Mutation>(mutation, ...argsAndOptions): Promise<FunctionReturnType<Mutation>>;
```

Defined in: [src/runtime/vue/client.ts:485](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L485)

Execute a mutation function.

###### Type Parameters

| Type Parameter |
| ------ |
| `Mutation` *extends* [`FunctionReference`](#functionreference)\<`"mutation"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mutation` | `Mutation` | A server.FunctionReference for the public mutation to run. |
| ...`argsAndOptions` | [`ArgsAndOptions`](#argsandoptions)\<`Mutation`, [`MutationOptions`](#mutationoptions)\<[`FunctionArgs`](#functionargs)\<`Mutation`\>\>\> | - |

###### Returns

`Promise`\<[`FunctionReturnType`](#functionreturntype)\<`Mutation`\>\>

A promise of the mutation's result.

##### action()

```ts
action<Action>(action, ...args): Promise<FunctionReturnType<Action>>;
```

Defined in: [src/runtime/vue/client.ts:506](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L506)

Execute an action function.

###### Type Parameters

| Type Parameter |
| ------ |
| `Action` *extends* [`FunctionReference`](#functionreference)\<`"action"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | `Action` | A server.FunctionReference for the public action to run. |
| ...`args` | [`OptionalRestArgs`](#optionalrestargs)\<`Action`\> | An arguments object for the action. If this is omitted, the arguments will be `{}`. |

###### Returns

`Promise`\<[`FunctionReturnType`](#functionreturntype)\<`Action`\>\>

A promise of the action's result.

##### query()

```ts
query<Query>(query, ...args): Promise<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/vue/client.ts:526](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L526)

Fetch a query result once.

**Most application code should subscribe to queries instead, using
the [useQuery](#usequery) composable.**

###### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](#functionreference)\<`"query"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | A server.FunctionReference for the public query to run. |
| ...`args` | [`OptionalRestArgs`](#optionalrestargs)\<`Query`\> | An arguments object for the query. If this is omitted, the arguments will be `{}`. |

###### Returns

`Promise`\<[`FunctionReturnType`](#functionreturntype)\<`Query`\>\>

A promise of the query's result.

##### connectionState()

```ts
connectionState(): ConnectionState;
```

Defined in: [src/runtime/vue/client.ts:555](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L555)

Get the current [ConnectionState](#connectionstate) between the client and the Convex
deployment.

###### Returns

[`ConnectionState`](#connectionstate)

The [ConnectionState](#connectionstate) with the Convex deployment.

##### subscribeToConnectionState()

```ts
subscribeToConnectionState(cb): () => void;
```

Defined in: [src/runtime/vue/client.ts:571](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L571)

Subscribe to the [ConnectionState](#connectionstate) between the client and the Convex
deployment, calling a callback each time it changes.

Subscribed callbacks will be called when any part of ConnectionState changes.
ConnectionState may grow in future versions (e.g. to provide a array of
inflight requests) in which case callbacks would be called more frequently.
ConnectionState may also *lose* properties in future versions as we figure
out what information is most useful. As such this API is considered unstable.

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `cb` | (`connectionState`) => `void` |

###### Returns

An unsubscribe function to stop listening.

() => `void`

##### close()

```ts
close(): Promise<void>;
```

Defined in: [src/runtime/vue/client.ts:594](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L594)

Close any network handles associated with this client and stop all subscriptions.

Call this method when you're done with a [ConvexVueClient](#convexvueclient) to
dispose of its sockets and resources.

###### Returns

`Promise`\<`void`\>

A `Promise` fulfilled when the connection has been completely closed.

## Interfaces

### ConvexAuthProviderOptions

Defined in: [src/runtime/vue/auth/index.ts:74](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L74)

Options for [provideConvexAuth](#provideconvexauth) — the Vue translation of the props of
upstream's `ConvexProviderWithAuth` component.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="client"></a> `client` | [`IConvexVueClient`](#iconvexvueclient) | [src/runtime/vue/auth/index.ts:75](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L75) |
| <a id="useauth"></a> `useAuth` | () => \{ `isLoading`: `MaybeRefOrGetter`\<`boolean`\>; `isAuthenticated`: `MaybeRefOrGetter`\<`boolean`\>; `fetchAccessToken`: `MaybeRef`\<[`AuthTokenFetcher`](#authtokenfetcher)\>; `authVersion?`: `unknown`; \} | [src/runtime/vue/auth/index.ts:76](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L76) |

***

### Watch

Defined in: [src/runtime/vue/client.ts:51](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L51)

A watch on the output of a Convex query function.

Derived from upstream's `Watch` (per-member docs live there), extended with
the `@internal` `localQueryLogs`, which is stripped from the published
`convex/react` types but present at runtime.

#### Extends

- `Watch`\<`T`\>

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Methods

##### onUpdate()

```ts
onUpdate(callback): () => void;
```

Defined in: node\_modules/convex/dist/esm-types/react/client.d.ts:83

Initiate a watch on the output of a query.

This will subscribe to this query and call
the callback whenever the query result changes.

**Important: If the client is already subscribed to this query with the
same arguments this callback will not be invoked until the query result is
updated.** To get the current, local result call
react.Watch.localQueryResult.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | () => `void` | Function that is called whenever the query result changes. |

###### Returns

- A function that disposes of the subscription.

() => `void`

###### Inherited from

```ts
ConvexWatch.onUpdate
```

##### localQueryResult()

```ts
localQueryResult(): T | undefined;
```

Defined in: node\_modules/convex/dist/esm-types/react/client.d.ts:94

Get the current result of a query.

This will only return a result if we're already subscribed to the query
and have received a result from the server or the query value has been set
optimistically.

###### Returns

`T` \| `undefined`

The result of the query or `undefined` if it isn't known.

###### Throws

An error if the query encountered an error on the server.

###### Inherited from

```ts
ConvexWatch.localQueryResult
```

##### journal()

```ts
journal(): QueryJournal | undefined;
```

Defined in: node\_modules/convex/dist/esm-types/react/client.d.ts:100

Get the current browser.QueryJournal for this query.

If we have not yet received a result for this query, this will be `undefined`.

###### Returns

[`QueryJournal`](#queryjournal) \| `undefined`

###### Inherited from

```ts
ConvexWatch.journal
```

***

### PaginatedWatch

Defined in: [src/runtime/vue/client.ts:63](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L63)

A watch on the output of a paginated Convex query function.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Methods

##### onUpdate()

```ts
onUpdate(callback): () => void;
```

Defined in: [src/runtime/vue/client.ts:73](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L73)

Initiate a watch on the output of a paginated query.

This will subscribe to this query and call
the callback whenever the query result changes.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `callback` | () => `void` | Function that is called whenever the query result changes. |

###### Returns

- A function that disposes of the subscription.

() => `void`

##### localQueryResult()

```ts
localQueryResult(): 
  | {
  results: T[];
  status: PaginationStatus;
  loadMore: (numItems) => boolean;
}
  | undefined;
```

Defined in: [src/runtime/vue/client.ts:80](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L80)

Get the current result of a paginated query.

###### Returns

  \| \{
  `results`: `T`[];
  `status`: `PaginationStatus`;
  `loadMore`: (`numItems`) => `boolean`;
\}
  \| `undefined`

The current results, status, and loadMore function, or `undefined` if not loaded.

***

### WatchQueryOptions

Defined in: [src/runtime/vue/client.ts:95](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L95)

Options for [ConvexVueClient.watchQuery](#watchquery).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="journal-1"></a> `journal?` | [`QueryJournal`](#queryjournal) | An (optional) journal produced from a previous execution of this query function. If there is an existing subscription to a query function with the same name and arguments, this journal will have no effect. | [src/runtime/vue/client.ts:103](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L103) |

***

### MutationOptions

Defined in: [src/runtime/vue/client.ts:116](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L116)

Options for [ConvexVueClient.mutation](#mutation).

#### Type Parameters

| Type Parameter |
| ------ |
| `Args` *extends* `Record`\<`string`, [`Value`](#value)\> |

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="optimisticupdate-1"></a> `optimisticUpdate?` | [`OptimisticUpdate`](#optimisticupdate)\<`Args`\> | An optimistic update to apply along with this mutation. An optimistic update locally updates queries while a mutation is pending. Once the mutation completes, the update will be rolled back. | [src/runtime/vue/client.ts:123](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L123) |

***

### ConvexVueClientOptions

Defined in: [src/runtime/vue/client.ts:140](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L140)

Options for [ConvexVueClient](#convexvueclient).

#### Extends

- `BaseConvexClientOptions`

#### Properties

| Property | Modifier | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ | ------ |
| <a id="unsavedchangeswarning"></a> `unsavedChangesWarning?` | `public` | `boolean` | Whether to prompt the user if they have unsaved changes pending when navigating away or closing a web page. This is only possible when the `window` object exists, i.e. in a browser. The default value is `true` in browsers. | `BaseConvexClientOptions.unsavedChangesWarning` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:23 |
| <a id="websocketconstructor"></a> `webSocketConstructor?` | `public` | \{ (`url`, `protocols?`): `WebSocket`; `prototype`: `WebSocket`; `CONNECTING`: `0`; `OPEN`: `1`; `CLOSING`: `2`; `CLOSED`: `3`; \} | Specifies an alternate [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) constructor to use for client communication with the Convex cloud. The default behavior is to use `WebSocket` from the global environment. | `BaseConvexClientOptions.webSocketConstructor` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:30 |
| `webSocketConstructor.prototype` | `public` | `WebSocket` | - | - | node\_modules/typescript/lib/lib.dom.d.ts:40936 |
| `webSocketConstructor.CONNECTING` | `readonly` | `0` | - | - | node\_modules/typescript/lib/lib.dom.d.ts:40938 |
| `webSocketConstructor.OPEN` | `readonly` | `1` | - | - | node\_modules/typescript/lib/lib.dom.d.ts:40939 |
| `webSocketConstructor.CLOSING` | `readonly` | `2` | - | - | node\_modules/typescript/lib/lib.dom.d.ts:40940 |
| `webSocketConstructor.CLOSED` | `readonly` | `3` | - | - | node\_modules/typescript/lib/lib.dom.d.ts:40941 |
| <a id="verbose"></a> `verbose?` | `public` | `boolean` | Adds additional logging for debugging purposes. The default value is `false`. | `BaseConvexClientOptions.verbose` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:36 |
| <a id="logger"></a> `logger?` | `public` | `boolean` \| `Logger` | A logger, `true`, or `false`. If not provided or `true`, logs to the console. If `false`, logs are not printed anywhere. You can construct your own logger to customize logging to log elsewhere. A logger is an object with 4 methods: log(), warn(), error(), and logVerbose(). These methods can receive multiple arguments of any types, like console.log(). | `BaseConvexClientOptions.logger` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:45 |
| <a id="reportdebuginfotoconvex"></a> `reportDebugInfoToConvex?` | `public` | `boolean` | Sends additional metrics to Convex for debugging purposes. The default value is `false`. | `BaseConvexClientOptions.reportDebugInfoToConvex` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:51 |
| <a id="onserverdisconnecterror"></a> `onServerDisconnectError?` | `public` | (`message`) => `void` | This API is experimental: it may change or disappear. A function to call on receiving abnormal WebSocket close messages from the connected Convex deployment. The content of these messages is not stable, it is an implementation detail that may change. Consider this API an observability stopgap until higher level codes with recommendations on what to do are available, which could be a more stable interface instead of `string`. Check `connectionState` for more quantitative metrics about connection status. | `BaseConvexClientOptions.onServerDisconnectError` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:65 |
| <a id="skipconvexdeploymenturlcheck"></a> `skipConvexDeploymentUrlCheck?` | `public` | `boolean` | Skip validating that the Convex deployment URL looks like `https://happy-animal-123.convex.cloud` or localhost. This can be useful if running a self-hosted Convex backend that uses a different URL. The default value is `false` | `BaseConvexClientOptions.skipConvexDeploymentUrlCheck` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:75 |
| <a id="authrefreshtokenleewayseconds"></a> `authRefreshTokenLeewaySeconds?` | `public` | `number` | If using auth, the number of seconds before a token expires that we should refresh it. The default value is `10`. | `BaseConvexClientOptions.authRefreshTokenLeewaySeconds` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:81 |
| <a id="expectauth"></a> `expectAuth?` | `public` | `boolean` | This API is experimental: it may change or disappear. Whether query, mutation, and action requests should be held back until the first auth token can be sent. Opting into this behavior works well for pages that should only be viewed by authenticated clients. Defaults to false, not waiting for an auth token. | `BaseConvexClientOptions.expectAuth` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:93 |
| <a id="initialauthtokenreuse"></a> `initialAuthTokenReuse?` | `public` | `boolean` | This API is experimental: it may change or disappear. When true, the client reuses the initial cached auth token instead of immediately fetching a fresh one. This avoids a second Authenticate message that causes the server to re-execute all authenticated queries. The cached token's remaining lifetime is estimated using the server's clock skew measurement, and a refresh is scheduled before it expires. Defaults to false, preserving the original behavior of immediately fetching a fresh token after the cached token is confirmed. | `BaseConvexClientOptions.initialAuthTokenReuse` | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:109 |

***

### VueAction()

Defined in: [src/runtime/vue/composables/use-action.ts:11](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-action.ts#L11)

An interface to execute a Convex action on the server.

#### Type Parameters

| Type Parameter |
| ------ |
| `Action` *extends* [`FunctionReference`](#functionreference)\<`"action"`\> |

```ts
VueAction(...args): Promise<FunctionReturnType<Action>>;
```

Defined in: [src/runtime/vue/composables/use-action.ts:19](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-action.ts#L19)

Execute the function on the server, returning a `Promise` of its return value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`args` | [`OptionalRestArgs`](#optionalrestargs)\<`Action`\> | Arguments for the function to pass up to the server. |

#### Returns

`Promise`\<[`FunctionReturnType`](#functionreturntype)\<`Action`\>\>

The return value of the server-side function call.

***

### VueMutation()

Defined in: [src/runtime/vue/composables/use-mutation.ts:14](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-mutation.ts#L14)

An interface to execute a Convex mutation function on the server.

#### Type Parameters

| Type Parameter |
| ------ |
| `Mutation` *extends* [`FunctionReference`](#functionreference)\<`"mutation"`\> |

```ts
VueMutation(...args): Promise<FunctionReturnType<Mutation>>;
```

Defined in: [src/runtime/vue/composables/use-mutation.ts:21](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-mutation.ts#L21)

Execute the mutation on the server, returning a `Promise` of its return value.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| ...`args` | [`OptionalRestArgs`](#optionalrestargs)\<`Mutation`\> | Arguments for the mutation to pass up to the server. |

#### Returns

`Promise`\<[`FunctionReturnType`](#functionreturntype)\<`Mutation`\>\>

The return value of the server-side function call.

#### Methods

##### withOptimisticUpdate()

```ts
withOptimisticUpdate<T>(optimisticUpdate): VueMutation<Mutation>;
```

Defined in: [src/runtime/vue/composables/use-mutation.ts:44](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-mutation.ts#L44)

Define an optimistic update to apply as part of this mutation.

This is a temporary update to the local query results to facilitate a
fast, interactive UI. It enables query results to update before a mutation
executed on the server.

When the mutation is invoked, the optimistic update will be applied.

Optimistic updates can also be used to temporarily remove queries from the
client and create loading experiences until a mutation completes and the
new query results are synced.

The update will be automatically rolled back when the mutation is fully
completed and queries have been updated.

###### Type Parameters

| Type Parameter |
| ------ |
| `T` *extends* [`OptimisticUpdate`](#optimisticupdate)\<[`FunctionArgs`](#functionargs)\<`Mutation`\>\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `optimisticUpdate` | `T` & `ReturnType`\<`T`\> *extends* `Promise`\<`any`\> ? `"Optimistic update handlers must be synchronous"` : \{ \} | The optimistic update to apply. |

###### Returns

[`VueMutation`](#vuemutation)\<`Mutation`\>

A new `VueMutation` with the update configured.

***

### UploadQueueItem

Defined in: [src/runtime/vue/composables/use-upload-queue.ts:17](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L17)

A single entry in the queue managed by [useUploadQueue](#useuploadqueue).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="id"></a> `id` | `string` | Stable id for this queue entry (not the storage id). | [src/runtime/vue/composables/use-upload-queue.ts:19](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L19) |
| <a id="file"></a> `file` | `Blob` | The file or blob being uploaded. | [src/runtime/vue/composables/use-upload-queue.ts:21](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L21) |
| <a id="status-1"></a> `status` | [`UploadItemStatus`](#uploaditemstatus) | Current upload status. | [src/runtime/vue/composables/use-upload-queue.ts:23](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L23) |
| <a id="progress"></a> `progress` | `number` | Upload progress for this item, from `0` to `1`. | [src/runtime/vue/composables/use-upload-queue.ts:25](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L25) |
| <a id="storageid"></a> `storageId` | [`StorageId`](#storageid-1) \| `null` | The storage id once the upload succeeds, or `null`. | [src/runtime/vue/composables/use-upload-queue.ts:27](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L27) |
| <a id="error"></a> `error` | `Error` \| `null` | The error if this item failed, or `null`. | [src/runtime/vue/composables/use-upload-queue.ts:29](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L29) |

***

### UseUploadQueueOptions

Defined in: [src/runtime/vue/composables/use-upload-queue.ts:37](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L37)

Options for [useUploadQueue](#useuploadqueue).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="concurrency"></a> `concurrency?` | `number` | Maximum number of uploads to run at once. Defaults to `3`. | [src/runtime/vue/composables/use-upload-queue.ts:39](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L39) |
| <a id="onitemsuccess"></a> `onItemSuccess?` | (`storageId`, `item`) => `void` \| `Promise`\<`void`\> | Called when an individual item finishes uploading. | [src/runtime/vue/composables/use-upload-queue.ts:41](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L41) |
| <a id="onitemerror"></a> `onItemError?` | (`error`, `item`) => `void` | Called when an individual item fails. | [src/runtime/vue/composables/use-upload-queue.ts:43](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L43) |
| <a id="oncomplete"></a> `onComplete?` | (`items`) => `void` | Called once every queued item has settled (succeeded or failed). | [src/runtime/vue/composables/use-upload-queue.ts:45](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L45) |

***

### VueUploadQueue

Defined in: [src/runtime/vue/composables/use-upload-queue.ts:56](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L56)

The reactive queue returned by [useUploadQueue](#useuploadqueue).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="items"></a> `items` | `Readonly`\<`Ref`\<[`UploadQueueItem`](#uploadqueueitem)[]\>\> | Reactive list of queued items, in insertion order. | [src/runtime/vue/composables/use-upload-queue.ts:58](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L58) |
| <a id="enqueue"></a> `enqueue` | (`files`) => `void` | Add one or more files to the queue; uploading starts automatically. | [src/runtime/vue/composables/use-upload-queue.ts:60](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L60) |
| <a id="isuploading"></a> `isUploading` | `Readonly`\<`Ref`\<`boolean`\>\> | `true` while any item is pending or uploading. | [src/runtime/vue/composables/use-upload-queue.ts:62](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L62) |
| <a id="progress-1"></a> `progress` | `Readonly`\<`Ref`\<`number`\>\> | Aggregate progress across all items, from `0` to `1`. | [src/runtime/vue/composables/use-upload-queue.ts:64](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L64) |
| <a id="pendingcount"></a> `pendingCount` | `Readonly`\<`Ref`\<`number`\>\> | Number of items waiting to start. | [src/runtime/vue/composables/use-upload-queue.ts:66](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L66) |
| <a id="activecount"></a> `activeCount` | `Readonly`\<`Ref`\<`number`\>\> | Number of items currently uploading. | [src/runtime/vue/composables/use-upload-queue.ts:68](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L68) |
| <a id="cancel"></a> `cancel` | () => `void` | Abort all in-flight uploads (queued items stay `pending`). | [src/runtime/vue/composables/use-upload-queue.ts:70](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L70) |
| <a id="remove"></a> `remove` | (`id`) => `void` | Remove an item by id, aborting it first if it is uploading. | [src/runtime/vue/composables/use-upload-queue.ts:72](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L72) |
| <a id="clear"></a> `clear` | () => `void` | Abort everything and empty the queue. | [src/runtime/vue/composables/use-upload-queue.ts:74](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L74) |

***

### UploadFileOptions

Defined in: [src/runtime/vue/composables/use-upload.ts:32](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L32)

Options for the low-level [uploadFile](#uploadfile) helper.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="url-1"></a> `url` | `string` | The one-time Convex upload URL from a `generateUploadUrl` mutation. | [src/runtime/vue/composables/use-upload.ts:34](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L34) |
| <a id="file-1"></a> `file` | `Blob` | The file or blob to upload. | [src/runtime/vue/composables/use-upload.ts:36](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L36) |
| <a id="onprogress"></a> `onProgress?` | (`progress`) => `void` | Receives upload progress as a fraction from `0` to `1`. | [src/runtime/vue/composables/use-upload.ts:38](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L38) |
| <a id="signal"></a> `signal?` | `AbortSignal` | Abort signal to cancel the in-flight upload. | [src/runtime/vue/composables/use-upload.ts:40](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L40) |

***

### UseUploadOptions

Defined in: [src/runtime/vue/composables/use-upload.ts:125](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L125)

Options for [useUpload](#useupload).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="onprogress-1"></a> `onProgress?` | (`progress`) => `void` | Called with upload progress as a fraction from `0` to `1`. | [src/runtime/vue/composables/use-upload.ts:127](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L127) |
| <a id="onsuccess"></a> `onSuccess?` | (`storageId`, `file`) => `void` \| `Promise`\<`void`\> | Called once the file is stored, with the new storage id and the file. | [src/runtime/vue/composables/use-upload.ts:129](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L129) |
| <a id="onerror"></a> `onError?` | (`error`, `file`) => `void` | Called if generating the upload URL or the upload itself fails. | [src/runtime/vue/composables/use-upload.ts:131](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L131) |

***

### VueUpload

Defined in: [src/runtime/vue/composables/use-upload.ts:139](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L139)

The reactive uploader returned by [useUpload](#useupload).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="upload"></a> `upload` | (`file`) => `Promise`\<[`StorageId`](#storageid-1) \| `null`\> | Upload a file or blob, resolving to its [StorageId](#storageid-1). Resolves to `null` (instead of throwing) if the upload fails or is called outside the browser — inspect [VueUpload.error](#error-1) for the reason. | [src/runtime/vue/composables/use-upload.ts:146](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L146) |
| <a id="isuploading-1"></a> `isUploading` | `Readonly`\<`Ref`\<`boolean`\>\> | `true` while an upload is in flight. | [src/runtime/vue/composables/use-upload.ts:148](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L148) |
| <a id="progress-2"></a> `progress` | `Readonly`\<`Ref`\<`number`\>\> | Upload progress of the current/last upload, from `0` to `1`. | [src/runtime/vue/composables/use-upload.ts:150](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L150) |
| <a id="error-1"></a> `error` | `Readonly`\<`Ref`\<`Error` \| `null`\>\> | The error from the most recent failed upload, or `null`. | [src/runtime/vue/composables/use-upload.ts:152](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L152) |
| <a id="storageid-2"></a> `storageId` | `Readonly`\<`Ref`\<[`StorageId`](#storageid-1) \| `null`\>\> | The storage id from the most recent successful upload, or `null`. | [src/runtime/vue/composables/use-upload.ts:154](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L154) |
| <a id="cancel-1"></a> `cancel` | () => `void` | Abort the in-flight upload, if any. | [src/runtime/vue/composables/use-upload.ts:156](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L156) |
| <a id="reset"></a> `reset` | () => `void` | Reset `progress`, `error`, and `storageId` back to their initial values. | [src/runtime/vue/composables/use-upload.ts:158](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L158) |

## Type Aliases

### QueryOptions

```ts
type QueryOptions<Query> = {
  query: Query;
  args: FunctionArgs<Query>;
};
```

Defined in: node\_modules/convex/dist/esm-types/browser/query\_options.d.ts:9

Options for a Convex query: the query function reference and its arguments.

Used with the object-form overload of [useQuery](#usequery).

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](#functionreference)\<`"query"`\> |

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="query-1"></a> `query` | `Query` | The query function to run. | node\_modules/convex/dist/esm-types/browser/query\_options.d.ts:13 |
| <a id="args"></a> `args` | [`FunctionArgs`](#functionargs)\<`Query`\> | The arguments to the query function. | node\_modules/convex/dist/esm-types/browser/query\_options.d.ts:17 |

***

### AuthTokenFetcher

```ts
type AuthTokenFetcher = (args) => Promise<string | null | undefined>;
```

Defined in: node\_modules/convex/dist/esm-types/browser/sync/authentication\_manager.d.ts:17

An async function returning a JWT. Depending on the auth providers
configured in convex/auth.config.ts, this may be a JWT-encoded OpenID
Connect Identity Token or a traditional JWT.

`forceRefreshToken` is `true` if the server rejected a previously
returned token or the token is anticipated to expiring soon
based on its `exp` time.

See ConvexReactClient.setAuth.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `args` | \{ `forceRefreshToken`: `boolean`; \} |
| `args.forceRefreshToken` | `boolean` |

#### Returns

`Promise`\<`string` \| `null` \| `undefined`\>

***

### ConnectionState

```ts
type ConnectionState = {
  hasInflightRequests: boolean;
  isWebSocketConnected: boolean;
  timeOfOldestInflightRequest: Date | null;
  hasEverConnected: boolean;
  connectionCount: number;
  connectionRetries: number;
  inflightMutations: number;
  inflightActions: number;
};
```

Defined in: node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:116

State describing the client's connection with the Convex backend.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="hasinflightrequests"></a> `hasInflightRequests` | `boolean` | - | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:117 |
| <a id="iswebsocketconnected"></a> `isWebSocketConnected` | `boolean` | - | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:118 |
| <a id="timeofoldestinflightrequest"></a> `timeOfOldestInflightRequest` | `Date` \| `null` | - | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:119 |
| <a id="haseverconnected"></a> `hasEverConnected` | `boolean` | True if the client has ever opened a WebSocket to the "ready" state. | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:123 |
| <a id="connectioncount"></a> `connectionCount` | `number` | The number of times this client has connected to the Convex backend. A number of things can cause the client to reconnect -- server errors, bad internet, auth expiring. But this number being high is an indication that the client is having trouble keeping a stable connection. | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:131 |
| <a id="connectionretries"></a> `connectionRetries` | `number` | The number of times this client has tried (and failed) to connect to the Convex backend. | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:135 |
| <a id="inflightmutations"></a> `inflightMutations` | `number` | The number of mutations currently in flight. | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:139 |
| <a id="inflightactions"></a> `inflightActions` | `number` | The number of actions currently in flight. | node\_modules/convex/dist/esm-types/browser/sync/client.d.ts:143 |

***

### OptimisticUpdate

```ts
type OptimisticUpdate<Args> = (localQueryStore, args) => void;
```

Defined in: node\_modules/convex/dist/esm-types/browser/sync/optimistic\_updates.d.ts:73

A temporary, local update to query results within this client.

This update will always be executed when a mutation is synced to the Convex
server and rolled back when the mutation completes.

Note that optimistic updates can be called multiple times! If the client
loads new data while the mutation is in progress, the update will be replayed
again.

#### Type Parameters

| Type Parameter |
| ------ |
| `Args` *extends* `Record`\<`string`, [`Value`](#value)\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `localQueryStore` | `OptimisticLocalStore` | An interface to read and edit local query results. |
| `args` | `Args` | The arguments to the mutation. |

#### Returns

`void`

***

### QueryJournal

```ts
type QueryJournal = string | null;
```

Defined in: node\_modules/convex/dist/esm-types/browser/sync/protocol.d.ts:34

A serialized representation of decisions made during a query's execution.

A journal is produced when a query function first executes and is re-used
when a query is re-executed.

Currently this is used to store pagination end cursors to ensure
that pages of paginated queries will always end at the same cursor. This
enables gapless, reactive pagination.

`null` is used to represent empty journals.

***

### PaginatedQueryReference

```ts
type PaginatedQueryReference = FunctionReference<"query", "public", {
  paginationOpts: PaginationOptions;
}, PaginationResult<any>>;
```

Defined in: node\_modules/convex/dist/esm-types/react/use\_paginated\_query.d.ts:16

A server.FunctionReference that is usable with [usePaginatedQuery](#usepaginatedquery).

This function reference must:
- Refer to a public query
- Have an argument named "paginationOpts" of type server.PaginationOptions
- Have a return type of server.PaginationResult.

***

### UsePaginatedQueryResult

```ts
type UsePaginatedQueryResult<Item> = {
  results: Item[];
  loadMore: (numItems) => void;
} & 
  | {
  status: "LoadingFirstPage";
  isLoading: true;
}
  | {
  status: "CanLoadMore";
  isLoading: false;
}
  | {
  status: "LoadingMore";
  isLoading: true;
}
  | {
  status: "Exhausted";
  isLoading: false;
};
```

Defined in: node\_modules/convex/dist/esm-types/react/use\_paginated\_query.d.ts:80

The result of calling the [usePaginatedQuery](#usepaginatedquery) hook.

This includes:
- `results` - An array of the currently loaded results.
- `isLoading` - Whether the hook is currently loading results.
- `status` - The status of the pagination. The possible statuses are:
  - "LoadingFirstPage": The hook is loading the first page of results.
  - "CanLoadMore": This query may have more items to fetch. Call `loadMore` to
  fetch another page.
  - "LoadingMore": We're currently loading another page of results.
  - "Exhausted": We've paginated to the end of the list.
- `loadMore(n)` A callback to fetch more results. This will only fetch more
results if the status is "CanLoadMore".

#### Type Declaration

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `results` | `Item`[] | node\_modules/convex/dist/esm-types/react/use\_paginated\_query.d.ts:81 |
| `loadMore()` | (`numItems`) => `void` | node\_modules/convex/dist/esm-types/react/use\_paginated\_query.d.ts:82 |

#### Type Parameters

| Type Parameter |
| ------ |
| `Item` |

***

### PaginationStatus

```ts
type PaginationStatus = UsePaginatedQueryResult<any>["status"];
```

Defined in: node\_modules/convex/dist/esm-types/react/use\_paginated\_query.d.ts:102

The possible pagination statuses in [UsePaginatedQueryResult](#usepaginatedqueryresult).

This is a union of string literal types.

***

### PaginatedQueryArgs

```ts
type PaginatedQueryArgs<Query> = Expand<BetterOmit<FunctionArgs<Query>, "paginationOpts">>;
```

Defined in: node\_modules/convex/dist/esm-types/react/use\_paginated\_query.d.ts:109

Given a [PaginatedQueryReference](#paginatedqueryreference), get the type of the arguments
object for the query, excluding the `paginationOpts` argument.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

***

### PaginatedQueryItem

```ts
type PaginatedQueryItem<Query> = FunctionReturnType<Query>["page"][number];
```

Defined in: node\_modules/convex/dist/esm-types/react/use\_paginated\_query.d.ts:115

Given a [PaginatedQueryReference](#paginatedqueryreference), get the type of the item being
paginated over.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

***

### UsePaginatedQueryOptions

```ts
type UsePaginatedQueryOptions<Query, ThrowOnError> = {
  query: Query;
  args: PaginatedQueryArgs<Query> | "skip";
  initialNumItems: number;
  throwOnError?: ThrowOnError;
};
```

Defined in: node\_modules/convex/dist/esm-types/react/use\_paginated\_query2.d.ts:7

Options for object-form [usePaginatedQuery\_experimental](#usepaginatedquery_experimental).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) | - |
| `ThrowOnError` *extends* `boolean` | `false` |

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="query-5"></a> `query` | `Query` | - | node\_modules/convex/dist/esm-types/react/use\_paginated\_query2.d.ts:8 |
| <a id="args-2"></a> `args` | [`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\> \| `"skip"` | - | node\_modules/convex/dist/esm-types/react/use\_paginated\_query2.d.ts:9 |
| <a id="initialnumitems"></a> `initialNumItems` | `number` | - | node\_modules/convex/dist/esm-types/react/use\_paginated\_query2.d.ts:10 |
| <a id="throwonerror-1"></a> `throwOnError?` | `ThrowOnError` | When `true` (default for positional form), errors are thrown and caught by an error boundary. When `false` (default for object form), errors are returned as `{ status: "Error", error: Error }` instead of being thrown. | node\_modules/convex/dist/esm-types/react/use\_paginated\_query2.d.ts:16 |

***

### UsePaginatedQueryObjectReturnType

```ts
type UsePaginatedQueryObjectReturnType<Query, ThrowOnError> = 
  | {
  data: PaginatedQueryItem<Query>[] | undefined;
  status: "pending";
  canLoadMore: false;
  isLoading: true;
  error: undefined;
  loadMore: (numItems) => void;
}
  | {
  data: PaginatedQueryItem<Query>[];
  status: "success";
  canLoadMore: boolean;
  isLoading: false;
  error: undefined;
  loadMore: (numItems) => void;
}
  | ThrowOnError extends true ? never : {
  data: PaginatedQueryItem<Query>[];
  status: "error";
  canLoadMore: false;
  isLoading: false;
  error: Error;
  loadMore: (numItems) => void;
};
```

Defined in: node\_modules/convex/dist/esm-types/react/use\_paginated\_query2.d.ts:27

Return type of the object-form [usePaginatedQuery\_experimental](#usepaginatedquery_experimental) overload.

Uses lowercase query status (`"pending" | "success" | "error"`) and a
`canLoadMore` boolean instead of the TitleCase pagination status strings
used by the positional form.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) | - |
| `ThrowOnError` *extends* `boolean` | `false` |

***

### RequestForQueries

```ts
type RequestForQueries = Record<string, {
  query: FunctionReference<"query">;
  args: Record<string, Value>;
}>;
```

Defined in: node\_modules/convex/dist/esm-types/react/use\_queries.d.ts:69

An object representing a request to load multiple queries.

The keys of this object are identifiers and the values are objects containing
the query function and the arguments to pass to it.

This is used as an argument to [useQueries](#usequeries).

***

### FunctionReference

```ts
type FunctionReference<Type, Visibility, Args, ReturnType, ComponentPath> = {
  _type: Type;
  _visibility: Visibility;
  _args: Args;
  _returnType: ReturnType;
  _componentPath: ComponentPath;
};
```

Defined in: node\_modules/convex/dist/esm-types/server/api.d.ts:41

A reference to a registered Convex function.

You can create a [FunctionReference](#functionreference) using the generated `api` utility:
```js
import { api } from "../convex/_generated/api";

const reference = api.myModule.myFunction;
```

If you aren't using code generation, you can create references using
anyApi:
```js
import { anyApi } from "convex/server";

const reference = anyApi.myModule.myFunction;
```

Function references can be used to invoke functions from the client. For
example, in React you can pass references to the react.useQuery hook:
```js
const result = useQuery(api.myModule.myFunction);
```

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `Type` *extends* `FunctionType` | - | The type of the function ("query", "mutation", or "action"). |
| `Visibility` *extends* `FunctionVisibility` | `"public"` | The visibility of the function ("public" or "internal"). |
| `Args` *extends* `DefaultFunctionArgs` | `any` | The arguments to this function. This is an object mapping argument names to their types. |
| `ReturnType` | `any` | The return type of this function. |
| `ComponentPath` | `string` \| `undefined` | - |

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="_type"></a> `_type` | `Type` | node\_modules/convex/dist/esm-types/server/api.d.ts:42 |
| <a id="_visibility"></a> `_visibility` | `Visibility` | node\_modules/convex/dist/esm-types/server/api.d.ts:43 |
| <a id="_args"></a> `_args` | `Args` | node\_modules/convex/dist/esm-types/server/api.d.ts:44 |
| <a id="_returntype"></a> `_returnType` | `ReturnType` | node\_modules/convex/dist/esm-types/server/api.d.ts:45 |
| <a id="_componentpath"></a> `_componentPath` | `ComponentPath` | node\_modules/convex/dist/esm-types/server/api.d.ts:46 |

***

### FunctionArgs

```ts
type FunctionArgs<FuncRef> = FuncRef["_args"];
```

Defined in: node\_modules/convex/dist/esm-types/server/api.d.ts:213

Given a [FunctionReference](#functionreference), get the return type of the function.

This is represented as an object mapping argument names to values.

#### Type Parameters

| Type Parameter |
| ------ |
| `FuncRef` *extends* `AnyFunctionReference` |

***

### OptionalRestArgs

```ts
type OptionalRestArgs<FuncRef> = FuncRef["_args"] extends EmptyObject ? [EmptyObject] : [FuncRef["_args"]];
```

Defined in: node\_modules/convex/dist/esm-types/server/api.d.ts:222

A tuple type of the (maybe optional) arguments to `FuncRef`.

This type is used to make methods involving arguments type safe while allowing
skipping the arguments for functions that don't require arguments.

#### Type Parameters

| Type Parameter |
| ------ |
| `FuncRef` *extends* `AnyFunctionReference` |

***

### ArgsAndOptions

```ts
type ArgsAndOptions<FuncRef, Options> = FuncRef["_args"] extends EmptyObject ? [EmptyObject, Options] : [FuncRef["_args"], Options];
```

Defined in: node\_modules/convex/dist/esm-types/server/api.d.ts:232

A tuple type of the (maybe optional) arguments to `FuncRef`, followed by an options
object of type `Options`.

This type is used to make methods like `useQuery` type-safe while allowing
1. Skipping arguments for functions that don't require arguments.
2. Skipping the options object.

#### Type Parameters

| Type Parameter |
| ------ |
| `FuncRef` *extends* `AnyFunctionReference` |
| `Options` |

***

### FunctionReturnType

```ts
type FunctionReturnType<FuncRef> = FuncRef["_returnType"];
```

Defined in: node\_modules/convex/dist/esm-types/server/api.d.ts:238

Given a [FunctionReference](#functionreference), get the return type of the function.

#### Type Parameters

| Type Parameter |
| ------ |
| `FuncRef` *extends* `AnyFunctionReference` |

***

### Value

```ts
type Value = 
  | null
  | bigint
  | number
  | boolean
  | string
  | ArrayBuffer
  | Value[]
  | {
[key: string]: Value | undefined;
};
```

Defined in: node\_modules/convex/dist/esm-types/values/value.d.ts:44

A value supported by Convex.

Values can be:
- stored inside of documents.
- used as arguments and return types to queries and mutation functions.

You can see the full set of supported types at
[Types](https://docs.convex.dev/using/types).

***

### IConvexVueClient

```ts
type IConvexVueClient = {
  setAuth: void;
  clearAuth: void;
};
```

Defined in: [src/runtime/vue/auth/index.ts:8](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L8)

#### Methods

##### setAuth()

```ts
setAuth(
   fetchToken, 
   onChange, 
   onRefreshChange?): void;
```

Defined in: [src/runtime/vue/auth/index.ts:9](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L9)

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `fetchToken` | [`AuthTokenFetcher`](#authtokenfetcher) |
| `onChange` | (`isAuthenticated`) => `void` |
| `onRefreshChange?` | (`isRefreshing`) => `void` |

###### Returns

`void`

##### clearAuth()

```ts
clearAuth(): void;
```

Defined in: [src/runtime/vue/auth/index.ts:14](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L14)

###### Returns

`void`

***

### ConvexAuthState

```ts
type ConvexAuthState = {
  isLoading: ComputedRef<boolean>;
  isAuthenticated: ComputedRef<boolean>;
  isRefreshing: ComputedRef<boolean>;
};
```

Defined in: [src/runtime/vue/auth/index.ts:34](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L34)

Type representing the state of an auth integration with Convex.

- `isLoading`: the client is still resolving the initial auth state and
  waiting for the server to confirm the current token.
- `isAuthenticated`: the server has confirmed the current token.
- `isRefreshing`: the server rejected a previously-confirmed token and the
  socket is paused while a replacement is fetched. Only ever `true` when
  `isAuthenticated` is also `true`. Routine background token rotation does
  not trigger this state.

Each field is a `ComputedRef` (the Vue translation of upstream's re-rendered
plain booleans), so the upstream destructuring idiom stays reactive:
`const { isLoading, isAuthenticated } = useConvexAuth()`.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="isloading"></a> `isLoading` | `ComputedRef`\<`boolean`\> | [src/runtime/vue/auth/index.ts:35](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L35) |
| <a id="isauthenticated"></a> `isAuthenticated` | `ComputedRef`\<`boolean`\> | [src/runtime/vue/auth/index.ts:36](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L36) |
| <a id="isrefreshing"></a> `isRefreshing` | `ComputedRef`\<`boolean`\> | [src/runtime/vue/auth/index.ts:37](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L37) |

***

### VueMutationOptions

```ts
type VueMutationOptions<Args> = MutationOptions<Args>;
```

Defined in: [src/runtime/vue/client.ts:129](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L129)

#### Type Parameters

| Type Parameter |
| ------ |
| `Args` *extends* `Record`\<`string`, [`Value`](#value)\> |

***

### ConvexLogger

```ts
type ConvexLogger = Exclude<BaseConvexClientOptions["logger"], boolean | undefined>;
```

Defined in: [src/runtime/vue/client.ts:148](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L148)

The logger type accepted by [ConvexVueClientOptions.logger](#logger) — the
public shape of convex's non-exported `Logger`.

***

### UsePaginatedQueryReturnType

```ts
type UsePaginatedQueryReturnType<Query> = {
  results: ComputedRef<PaginatedQueryItem<Query>[]>;
  status: ComputedRef<PaginationStatus>;
  isLoading: ComputedRef<boolean>;
  loadMore: (numItems) => void;
};
```

Defined in: [src/runtime/vue/composables/use-paginated-query.ts:526](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L526)

Return shape of [usePaginatedQuery](#usepaginatedquery) — the fields of upstream's
`UsePaginatedQueryResult` as `ComputedRef`s plus a *stable* `loadMore`
function. This is the Vue translation of upstream's per-render plain object:
it keeps the documented destructuring idiom reactive,
`const { results, status, loadMore } = usePaginatedQuery(...)`.

(Upstream's name is kept even though the shape is ref-wrapped — the same
treatment as `ConvexAuthState` — so mechanically ported type annotations
keep compiling. The plain union stays available as
[UsePaginatedQueryResult](#usepaginatedqueryresult).)

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="results"></a> `results` | `ComputedRef`\<[`PaginatedQueryItem`](#paginatedqueryitem)\<`Query`\>[]\> | - | [src/runtime/vue/composables/use-paginated-query.ts:527](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L527) |
| <a id="status"></a> `status` | `ComputedRef`\<[`PaginationStatus`](#paginationstatus)\> | - | [src/runtime/vue/composables/use-paginated-query.ts:528](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L528) |
| <a id="isloading-1"></a> `isLoading` | `ComputedRef`\<`boolean`\> | - | [src/runtime/vue/composables/use-paginated-query.ts:529](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L529) |
| <a id="loadmore"></a> `loadMore` | (`numItems`) => `void` | Fetch `numItems` more results. Stable across state changes; only fetches when `status` is `'CanLoadMore'` (matching the documented semantics). | [src/runtime/vue/composables/use-paginated-query.ts:534](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L534) |

***

### OptionalRestArgsOrSkip

```ts
type OptionalRestArgsOrSkip<FuncRef> = FuncRef["_args"] extends Record<string, never> ? [MaybeRefOrGetter<Record<string, never> | "skip">] : [MaybeRefOrGetter<FuncRef["_args"] | "skip">];
```

Defined in: [src/runtime/vue/composables/use-query.ts:16](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-query.ts#L16)

#### Type Parameters

| Type Parameter |
| ------ |
| `FuncRef` *extends* [`FunctionReference`](#functionreference)\<`any`\> |

***

### UseQueryResult

```ts
type UseQueryResult<QueryResult, ThrowOnError> = ConvexUseQueryResult<QueryResult, ThrowOnError>;
```

Defined in: [src/runtime/vue/composables/use-query.ts:26](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-query.ts#L26)

Result returned by object-form [useQuery\_experimental](#usequery_experimental).

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `QueryResult` | - |
| `ThrowOnError` *extends* `boolean` | `false` |

***

### GetStorageUrl

```ts
type GetStorageUrl = FunctionReference<"query", "public", {
  storageId: StorageId;
}, string | null>;
```

Defined in: [src/runtime/vue/composables/use-storage-url.ts:12](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-storage-url.ts#L12)

A `getUrl` query: takes `{ storageId }` and returns the file's served URL,
or `null` if the file no longer exists (`await ctx.storage.getUrl(id)`).

***

### UploadItemStatus

```ts
type UploadItemStatus = "pending" | "uploading" | "success" | "error";
```

Defined in: [src/runtime/vue/composables/use-upload-queue.ts:10](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L10)

Lifecycle status of a single item in an upload queue.

***

### GenerateUploadUrl

```ts
type GenerateUploadUrl = FunctionReference<"mutation", "public", Record<string, never>, string>;
```

Defined in: [src/runtime/vue/composables/use-upload.ts:12](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L12)

A `generateUploadUrl` mutation: takes no arguments and returns a one-time
Convex upload URL string (`await ctx.storage.generateUploadUrl()`).

***

### StorageId

```ts
type StorageId = GenericId<"_storage">;
```

Defined in: [src/runtime/vue/composables/use-upload.ts:25](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L25)

A Convex file storage id (`Id<'_storage'>`), branded so it is directly
assignable to mutation/query args validated with `v.id('_storage')`.

***

### Preloaded

```ts
type Preloaded<Query> = {
  __type: Query;
  _name: string;
  _argsJSON: string;
  _valueJSON: string;
};
```

Defined in: [src/runtime/vue/hydration.ts:14](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/hydration.ts#L14)

The preloaded query payload, which should be passed to a client component
and passed to [usePreloadedQuery](#usepreloadedquery).

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](#functionreference)\<`"query"`\> |

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="__type-10"></a> `__type` | `Query` | [src/runtime/vue/hydration.ts:15](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/hydration.ts#L15) |
| <a id="_name"></a> `_name` | `string` | [src/runtime/vue/hydration.ts:16](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/hydration.ts#L16) |
| <a id="_argsjson"></a> `_argsJSON` | `string` | [src/runtime/vue/hydration.ts:17](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/hydration.ts#L17) |
| <a id="_valuejson"></a> `_valueJSON` | `string` | [src/runtime/vue/hydration.ts:18](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/hydration.ts#L18) |

***

### ConvexApi

```ts
type ConvexApi = Record<string, Record<string, unknown>>;
```

Defined in: [src/runtime/vue/provide.ts:9](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/provide.ts#L9)

The consumer's generated Convex `api` object (`#convex/api`). Its exact shape
is app-specific, so it's kept loose here — composables and components cast the
namespaces they consume (`api.billing`, `api.email`, …) to the precise
`FunctionReference` types they expect.

## Variables

### Authenticated

```ts
const Authenticated: DefineComponent<{
}, () => 
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>[]
  | null
  | undefined, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<{
}, {
}>, {
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/vue/auth/helpers.ts:16](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/helpers.ts#L16)

Renders the default slot if the client is authenticated.

#### Example

```vue
<Authenticated>
  <p>You are logged in!</p>
</Authenticated>
```

***

### Unauthenticated

```ts
const Unauthenticated: DefineComponent<{
}, () => 
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>[]
  | null
  | undefined, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<{
}, {
}>, {
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/vue/auth/helpers.ts:41](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/helpers.ts#L41)

Renders the default slot if the client is using authentication but is not authenticated.

#### Example

```vue
<Unauthenticated>
  <p>Please log in.</p>
</Unauthenticated>
```

***

### AuthLoading

```ts
const AuthLoading: DefineComponent<{
}, () => 
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>[]
  | null
  | undefined, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<{
}, {
}>, {
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/vue/auth/helpers.ts:67](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/helpers.ts#L67)

Renders the default slot if the client isn't using authentication or is in the process
of authenticating.

#### Example

```vue
<AuthLoading>
  <p>Checking authentication...</p>
</AuthLoading>
```

***

### AuthRefreshing

```ts
const AuthRefreshing: DefineComponent<{
}, () => 
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>[]
  | null
  | undefined, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<{
}, {
}>, {
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/vue/auth/helpers.ts:98](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/helpers.ts#L98)

Renders the default slot while the client is refreshing the auth token for an
already-authenticated session (the server rejected the current token and
the socket is paused while a new one is fetched). Routine background
token rotation does not trigger this state.

Whether used inside of `<Authenticated>` or not, the default slot will only be
rendered if the user is authenticated.

#### Example

```vue
<AuthRefreshing>
  <p>Refreshing token...</p>
</AuthRefreshing>
```

***

### ConvexAuthStateKey

```ts
const ConvexAuthStateKey: InjectionKey<ConvexAuthState>;
```

Defined in: [src/runtime/vue/auth/index.ts:41](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L41)

***

### ConvexClientKey

```ts
const ConvexClientKey: InjectionKey<ConvexVueClient>;
```

Defined in: [src/runtime/vue/client.ts:625](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L625)

Vue injection key for the [ConvexVueClient](#convexvueclient).

***

### useConvexAction

```ts
const useConvexAction: <Action>(action) => VueAction<Action> = useAction;
```

Defined in: [src/runtime/vue/composables/use-action.ts:90](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-action.ts#L90)

Construct a new [VueAction](#vueaction).

Returns a function that you can call to execute a Convex action. Actions
can call third-party APIs and perform side effects. The returned function
is stable for the lifetime of the composable (same reference identity).

**Error handling:** Actions can fail (e.g., if an external API is down).
Always wrap action calls in try/catch or handle the rejected promise.

**Note:** In most cases, calling an action directly from a client is an
anti-pattern. Prefer having the client call a mutation that captures the
user's intent (by writing to the database) and then schedules the action
via `ctx.scheduler.runAfter`. This ensures the intent is durably recorded
even if the client disconnects.

Throws an error if no Convex client has been provided.

#### Type Parameters

| Type Parameter |
| ------ |
| `Action` *extends* [`FunctionReference`](#functionreference)\<`"action"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | `Action` | A server.FunctionReference for the public action to run like `api.dir1.dir2.filename.func`. |

#### Returns

[`VueAction`](#vueaction)\<`Action`\>

The [VueAction](#vueaction) object with that name.

#### Example

```vue
<script setup lang="ts">
import { useAction } from '#imports'
import { api } from '#convex/api'

const generate = useAction(api.ai.generateSummary)

async function handleClick() {
  try {
    const summary = await generate({ text: 'Some long text...' })
    console.log(summary)
  } catch (error) {
    console.error('Action failed:', error)
  }
}
</script>
```

***

### useConvexMutation

```ts
const useConvexMutation: <Mutation>(mutation) => VueMutation<Mutation> = useMutation;
```

Defined in: [src/runtime/vue/composables/use-mutation.ts:129](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-mutation.ts#L129)

Construct a new [VueMutation](#vuemutation).

Returns a function that you can call to execute a Convex mutation. The
returned function is stable for the lifetime of the composable (same
reference identity), so it can be safely passed around and memoized.

Mutations can optionally be configured with
[optimistic updates](https://docs.convex.dev/client/react/optimistic-updates)
for instant UI feedback.

Throws an error if no Convex client has been provided.

#### Type Parameters

| Type Parameter |
| ------ |
| `Mutation` *extends* [`FunctionReference`](#functionreference)\<`"mutation"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mutation` | `Mutation` | A server.FunctionReference for the public mutation to run like `api.dir1.dir2.filename.func`. |

#### Returns

[`VueMutation`](#vuemutation)\<`Mutation`\>

The [VueMutation](#vuemutation) object with that name.

#### Example

```vue
<script setup lang="ts">
import { useMutation } from '#imports'
import { api } from '#convex/api'

const createTask = useMutation(api.tasks.create)

async function handleClick() {
  await createTask({ text: 'New task' })
}
</script>
```

***

### useConvexPaginatedQuery

```ts
const useConvexPaginatedQuery: <Query>(query, args, options) => UsePaginatedQueryReturnType<Query> = usePaginatedQuery;
```

Defined in: [src/runtime/vue/composables/use-paginated-query.ts:542](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L542)

Load data reactively from a paginated query to create a growing list.

This can be used to power "infinite scroll" UIs.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `Query` |
| `args` | `MaybeRefOrGetter`\<`"skip"` \| [`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\>\> |
| `options` | \{ `initialNumItems`: `number`; \} |
| `options.initialNumItems` | `number` |

#### Returns

[`UsePaginatedQueryReturnType`](#usepaginatedqueryreturntype)\<`Query`\>

#### Example

```vue
<script setup lang="ts">
import { usePaginatedQuery } from '#imports'
import { api } from '#convex/api'

const { results, status, loadMore } = usePaginatedQuery(
  api.messages.list,
  { channel: '#general' },
  { initialNumItems: 5 },
)
</script>

<template>
  <div v-for="{ _id, body } in results" :key="_id">{{ body }}</div>
  <button :disabled="status !== 'CanLoadMore'" @click="loadMore(5)">Load More</button>
</template>
```

***

### useConvexQueries

```ts
const useConvexQueries: (queries) => ShallowRef<Record<string, any>> = useQueries;
```

Defined in: [src/runtime/vue/composables/use-queries.ts:140](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-queries.ts#L140)

Load a variable number of reactive Convex queries.

`useQueries` is similar to [useQuery](#usequery) but it allows
loading multiple queries which can be useful for loading a dynamic number
of queries without violating the rules of composables.

This composable accepts an object whose keys are identifiers for each query and the
values are objects of `{ query: FunctionReference, args: Record<string, Value> }`. The
`query` is a FunctionReference for the Convex query function to load, and the `args` are
the arguments to that function.

The composable returns an object that maps each identifier to the result of the query,
`undefined` if the query is still loading, or an instance of `Error` if the query
threw an exception.

For example if you loaded a query like:
```typescript
const results = useQueries({
  messagesInGeneral: {
    query: "listMessages",
    args: { channel: "#general" }
  }
});
```
then the result would look like:
```typescript
{
  messagesInGeneral: [{
    channel: "#general",
    body: "hello"
    _id: ...,
    _creationTime: ...
  }]
}
```

This composable returns a reactive result that updates
whenever any of the query results change.

Throws an error if no Convex client has been provided (see [useConvex](#useconvex)).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queries` | `MaybeRefOrGetter`\<[`RequestForQueries`](#requestforqueries)\> | An object mapping identifiers to objects of `{query: string, args: Record<string, Value> }` describing which query functions to fetch. Reactive (ref/computed/getter) or plain. |

#### Returns

`ShallowRef`\<`Record`\<`string`, `any`\>\>

A shallow ref of an object with the same keys as the input. The
values are the result of the query function, `undefined` if it's still
loading, or an `Error` if it threw an exception.

***

### useConvexQuery

```ts
const useConvexQuery: <Query>(query, ...args) => ComputedRef<Query["_returnType"] | undefined> = useQuery;
```

Defined in: [src/runtime/vue/composables/use-query.ts:207](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-query.ts#L207)

Load a reactive query within a Vue component.

This Vue composable subscribes to a Convex query and updates the returned
ref whenever the query result changes. The subscription is managed
automatically -- it starts when the component mounts and stops when it
unmounts.

Throws an error if no Convex client has been provided.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a server.FunctionReference for the public query to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`OptionalRestArgsOrSkip`](#optionalrestargsorskip)\<`Query`\> | The arguments to the query function or the string `"skip"` if the query should not be loaded. Accepts a ref, computed, or getter for reactive args. |

#### Returns

`ComputedRef`\<`Query`\[`"_returnType"`\] \| `undefined`\>

a computed ref with the result of the query. Contains `undefined`
while loading.

#### Example

```vue
<script setup lang="ts">
import { useQuery } from '#imports'
import { api } from '#convex/api'

// Reactively loads tasks; the ref updates when data changes:
const tasks = useQuery(api.tasks.list, { completed: false })
// tasks.value is `undefined` while loading

// Pass "skip" (or a reactive getter returning it) to conditionally
// disable the query:
const profile = useQuery(
  api.users.get,
  computed(() => userId.value ? { userId: userId.value } : 'skip'),
)
</script>
```

***

### useConvexStorageUrl

```ts
const useConvexStorageUrl: (getUrl, storageId) => ComputedRef<string | null | undefined> = useStorageUrl;
```

Defined in: [src/runtime/vue/composables/use-storage-url.ts:61](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-storage-url.ts#L61)

Reactively resolve the served URL for a Convex stored file.

Thin wrapper over [useQuery](#usequery) that handles the common ergonomics of
serving stored files: it accepts a reactive storage id and automatically
skips the query (returning `undefined`) while the id is `null`/`undefined`,
so you can bind it straight to an id ref without juggling `'skip'`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `getUrl` | [`GetStorageUrl`](#getstorageurl) | A `FunctionReference` for the public `getUrl` query. |
| `storageId` | `MaybeRefOrGetter`\<`string` \| [`StorageId`](#storageid-1) \| `null` \| `undefined`\> | The storage id to resolve. Accepts a ref, computed, or getter; `null`/`undefined` skips the query. |

#### Returns

`ComputedRef`\<`string` \| `null` \| `undefined`\>

A computed ref of the served URL: `string | null` once loaded
  (`null` if the file is gone), or `undefined` while loading or skipped.

#### Example

```vue
<script setup lang="ts">
import { useStorageUrl } from '#imports'
import { api } from '#convex/api'

const { storageId } = useUpload(api.images.generateUploadUrl)
const url = useStorageUrl(api.images.getUrl, storageId)
</script>

<template>
  <img v-if="url" :src="url">
</template>
```

***

### useConvexUploadQueue

```ts
const useConvexUploadQueue: (generateUploadUrl, options) => VueUploadQueue = useUploadQueue;
```

Defined in: [src/runtime/vue/composables/use-upload-queue.ts:253](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L253)

Upload many files to Convex file storage with bounded concurrency and
per-item reactive progress.

Built on the same flow as [useUpload](#useupload), but manages a queue: call
[VueUploadQueue.enqueue](#enqueue) with one or more files (or a `FileList` from
a multi-file `<input>`) and the queue uploads up to `concurrency` at a time,
exposing per-item and aggregate progress.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `generateUploadUrl` | [`GenerateUploadUrl`](#generateuploadurl) | A `FunctionReference` for the public `generateUploadUrl` mutation. |
| `options` | [`UseUploadQueueOptions`](#useuploadqueueoptions) | Optional [UseUploadQueueOptions](#useuploadqueueoptions). |

#### Returns

[`VueUploadQueue`](#vueuploadqueue)

A [VueUploadQueue](#vueuploadqueue).

#### Example

```vue
<script setup lang="ts">
import { useUploadQueue, useMutation } from '#imports'
import { api } from '#convex/api'

const saveImage = useMutation(api.images.save)
const { items, enqueue, progress, isUploading } = useUploadQueue(
  api.images.generateUploadUrl,
  { concurrency: 4, onItemSuccess: storageId => saveImage({ storageId }) },
)

function onPick(event: Event) {
  enqueue((event.target as HTMLInputElement).files)
}
</script>

<template>
  <input type="file" multiple @change="onPick">
  <progress v-if="isUploading" :value="progress" />
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.status }} — {{ Math.round(item.progress * 100) }}%
    </li>
  </ul>
</template>
```

***

### useConvexUpload

```ts
const useConvexUpload: (generateUploadUrl, options) => VueUpload = useUpload;
```

Defined in: [src/runtime/vue/composables/use-upload.ts:281](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L281)

Upload files to Convex file storage from a component, with reactive
progress, error, and cancellation state.

Wraps the standard Convex flow — call a `generateUploadUrl` mutation, `POST`
the file to the returned URL, and read back the storage id — and exposes it
as reactive refs. Pass the resulting [StorageId](#storageid-1) to your own mutation
to persist it in your data model.

Uploads are client-only: calling `upload()` during SSR resolves to `null`
and sets [VueUpload.error](#error-1).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `generateUploadUrl` | [`GenerateUploadUrl`](#generateuploadurl) | A `FunctionReference` for the public `generateUploadUrl` mutation. |
| `options` | [`UseUploadOptions`](#useuploadoptions) | Optional [UseUploadOptions](#useuploadoptions) callbacks. |

#### Returns

[`VueUpload`](#vueupload)

A [VueUpload](#vueupload).

#### Example

```vue
<script setup lang="ts">
import { useUpload, useMutation } from '#imports'
import { api } from '#convex/api'

const saveImage = useMutation(api.images.save)
const { upload, isUploading, progress, error } = useUpload(
  api.images.generateUploadUrl,
  { onSuccess: storageId => saveImage({ storageId }) },
)

async function onPick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) await upload(file)
}
</script>

<template>
  <input type="file" :disabled="isUploading" @change="onPick">
  <progress v-if="isUploading" :value="progress" />
  <p v-if="error">{{ error.message }}</p>
</template>
```

***

### ConvexApiKey

```ts
const ConvexApiKey: InjectionKey<ConvexApi>;
```

Defined in: [src/runtime/vue/provide.ts:13](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/provide.ts#L13)

## Functions

### useConvexAuth()

```ts
function useConvexAuth(): {
  isLoading: ComputedRef<boolean>;
  isAuthenticated: ComputedRef<boolean>;
  isRefreshing: ComputedRef<boolean>;
};
```

Defined in: [src/runtime/vue/auth/index.ts:53](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L53)

Get the [ConvexAuthState](#convexauthstate) within a Vue component.

This relies on a Convex auth integration provider being above in the Vue
component tree. See [ConvexAuthState](#convexauthstate) for the meaning of each field.

#### Returns

```ts
{
  isLoading: ComputedRef<boolean>;
  isAuthenticated: ComputedRef<boolean>;
  isRefreshing: ComputedRef<boolean>;
}
```

The current [ConvexAuthState](#convexauthstate).

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `isLoading` | `ComputedRef`\<`boolean`\> | [src/runtime/vue/auth/index.ts:54](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L54) |
| `isAuthenticated` | `ComputedRef`\<`boolean`\> | [src/runtime/vue/auth/index.ts:55](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L55) |
| `isRefreshing` | `ComputedRef`\<`boolean`\> | [src/runtime/vue/auth/index.ts:56](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L56) |

***

### provideConvexAuth()

```ts
function provideConvexAuth(options): ConvexAuthState;
```

Defined in: [src/runtime/vue/auth/index.ts:131](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L131)

A replacement for the plain Convex client provide (upstream's
`ConvexProvider`) which additionally provides [ConvexAuthState](#convexauthstate) to
descendants of the calling component.

Use this to integrate any auth provider with Convex. The `useAuth` option
should be a Vue composable that returns the provider's authentication state
and a function to fetch a JWT access token.

If the returned `fetchAccessToken` ref identity (or the optional
`authVersion` value) updates then auth state
will transition to loading and the `fetchAccessToken()` function called again.

See [Custom Auth Integration](https://docs.convex.dev/auth/advanced/custom-auth) for more information.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ConvexAuthProviderOptions`](#convexauthprovideroptions) | Auth integration options including the Convex client and an `useAuth` factory that returns loading state and a token fetcher. |

#### Returns

[`ConvexAuthState`](#convexauthstate)

The reactive auth state.

#### Example

```vue
<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'  // your auth provider

const { client } = useNuxtApp().$convex
const authState = provideConvexAuth({ client, useAuth })
</script>
```

***

### createConvexAuthState()

```ts
function createConvexAuthState(options, scope?): ConvexAuthState;
```

Defined in: [src/runtime/vue/auth/index.ts:151](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L151)

Build reactive [ConvexAuthState](#convexauthstate) and wire watchers between the
external auth provider and the Convex client, without calling `provide()` —
the body of upstream's `ConvexProviderWithAuth` component.

Use this when you need to install the state at the Nuxt app level
(`nuxtApp.vueApp.provide`) rather than from a component's setup function.

When `scope` is provided, all watchers are created inside that
EffectScope so callers can dispose them later.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConvexAuthProviderOptions`](#convexauthprovideroptions) |
| `scope?` | `EffectScope` |

#### Returns

[`ConvexAuthState`](#convexauthstate)

***

### createScopedConvexAuthState()

```ts
function createScopedConvexAuthState(options): {
  state: ConvexAuthState;
  scope: EffectScope;
};
```

Defined in: [src/runtime/vue/auth/index.ts:281](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L281)

Create a fresh EffectScope and build a Convex auth state inside it.
The scope is returned so the caller can `.stop()` it on teardown.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | [`ConvexAuthProviderOptions`](#convexauthprovideroptions) |

#### Returns

```ts
{
  state: ConvexAuthState;
  scope: EffectScope;
}
```

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `state` | [`ConvexAuthState`](#convexauthstate) | [src/runtime/vue/auth/index.ts:283](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L283) |
| `scope` | `EffectScope` | [src/runtime/vue/auth/index.ts:283](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/auth/index.ts#L283) |

***

### useConvex()

```ts
function useConvex(): ConvexVueClient;
```

Defined in: [src/runtime/vue/client.ts:637](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/client.ts#L637)

Get the [ConvexVueClient](#convexvueclient) within a Vue component.

This relies on the client having been provided under [ConvexClientKey](#convexclientkey)
(the Nuxt plugin does this automatically).

#### Returns

[`ConvexVueClient`](#convexvueclient)

The active [ConvexVueClient](#convexvueclient) object, or `undefined`.

***

### useAction()

```ts
function useAction<Action>(action): VueAction<Action>;
```

Defined in: [src/runtime/vue/composables/use-action.ts:74](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-action.ts#L74)

Construct a new [VueAction](#vueaction).

Returns a function that you can call to execute a Convex action. Actions
can call third-party APIs and perform side effects. The returned function
is stable for the lifetime of the composable (same reference identity).

**Error handling:** Actions can fail (e.g., if an external API is down).
Always wrap action calls in try/catch or handle the rejected promise.

**Note:** In most cases, calling an action directly from a client is an
anti-pattern. Prefer having the client call a mutation that captures the
user's intent (by writing to the database) and then schedules the action
via `ctx.scheduler.runAfter`. This ensures the intent is durably recorded
even if the client disconnects.

Throws an error if no Convex client has been provided.

#### Type Parameters

| Type Parameter |
| ------ |
| `Action` *extends* [`FunctionReference`](#functionreference)\<`"action"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | `Action` | A server.FunctionReference for the public action to run like `api.dir1.dir2.filename.func`. |

#### Returns

[`VueAction`](#vueaction)\<`Action`\>

The [VueAction](#vueaction) object with that name.

#### Example

```vue
<script setup lang="ts">
import { useAction } from '#imports'
import { api } from '#convex/api'

const generate = useAction(api.ai.generateSummary)

async function handleClick() {
  try {
    const summary = await generate({ text: 'Some long text...' })
    console.log(summary)
  } catch (error) {
    console.error('Action failed:', error)
  }
}
</script>
```

***

### useConvexConnectionState()

```ts
function useConvexConnectionState(): ShallowRef<ConnectionState>;
```

Defined in: [src/runtime/vue/composables/use-connection-state.ts:33](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-connection-state.ts#L33)

Vue composable to get the current [ConnectionState](#connectionstate) and subscribe to changes.

This composable returns a shallow ref of the current connection state that
automatically updates when any part of the connection state changes (e.g.,
when going online/offline, when requests start/complete, etc.).

The shape of ConnectionState may change in the future which may cause this
composable to update more frequently.

Throws an error if no Convex client has been provided.

#### Returns

`ShallowRef`\<[`ConnectionState`](#connectionstate)\>

The current [ConnectionState](#connectionstate) with the Convex deployment.

#### Example

```vue
<script setup lang="ts">
const conn = useConvexConnectionState()
</script>

<template>
  <span v-if="!conn.isWebSocketConnected">Offline</span>
</template>
```

***

### useMutation()

```ts
function useMutation<Mutation>(mutation): VueMutation<Mutation>;
```

Defined in: [src/runtime/vue/composables/use-mutation.ts:113](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-mutation.ts#L113)

Construct a new [VueMutation](#vuemutation).

Returns a function that you can call to execute a Convex mutation. The
returned function is stable for the lifetime of the composable (same
reference identity), so it can be safely passed around and memoized.

Mutations can optionally be configured with
[optimistic updates](https://docs.convex.dev/client/react/optimistic-updates)
for instant UI feedback.

Throws an error if no Convex client has been provided.

#### Type Parameters

| Type Parameter |
| ------ |
| `Mutation` *extends* [`FunctionReference`](#functionreference)\<`"mutation"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mutation` | `Mutation` | A server.FunctionReference for the public mutation to run like `api.dir1.dir2.filename.func`. |

#### Returns

[`VueMutation`](#vuemutation)\<`Mutation`\>

The [VueMutation](#vuemutation) object with that name.

#### Example

```vue
<script setup lang="ts">
import { useMutation } from '#imports'
import { api } from '#convex/api'

const createTask = useMutation(api.tasks.create)

async function handleClick() {
  await createTask({ text: 'New task' })
}
</script>
```

***

### usePaginatedQuery()

```ts
function usePaginatedQuery<Query>(
   query, 
   args, 
options): UsePaginatedQueryReturnType<Query>;
```

Defined in: [src/runtime/vue/composables/use-paginated-query.ts:204](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L204)

Load data reactively from a paginated query to create a growing list.

This can be used to power "infinite scroll" UIs.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `Query` |
| `args` | `MaybeRefOrGetter`\<`"skip"` \| [`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\>\> |
| `options` | \{ `initialNumItems`: `number`; \} |
| `options.initialNumItems` | `number` |

#### Returns

[`UsePaginatedQueryReturnType`](#usepaginatedqueryreturntype)\<`Query`\>

#### Example

```vue
<script setup lang="ts">
import { usePaginatedQuery } from '#imports'
import { api } from '#convex/api'

const { results, status, loadMore } = usePaginatedQuery(
  api.messages.list,
  { channel: '#general' },
  { initialNumItems: 5 },
)
</script>

<template>
  <div v-for="{ _id, body } in results" :key="_id">{{ body }}</div>
  <button :disabled="status !== 'CanLoadMore'" @click="loadMore(5)">Load More</button>
</template>
```

***

### optimisticallyUpdateValueInPaginatedQuery()

```ts
function optimisticallyUpdateValueInPaginatedQuery<Query>(
   localStore, 
   query, 
   args, 
   updateValue): void;
```

Defined in: [src/runtime/vue/composables/use-paginated-query.ts:549](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L549)

Optimistically update values in a paginated list.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `localStore` | `OptimisticLocalStore` |
| `query` | `Query` |
| `args` | [`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\> |
| `updateValue` | (`currentValue`) => [`PaginatedQueryItem`](#paginatedqueryitem)\<`Query`\> |

#### Returns

`void`

***

### insertAtTop()

```ts
function insertAtTop<Query>(options): void;
```

Defined in: [src/runtime/vue/composables/use-paginated-query.ts:591](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L591)

Insert an item at the top of a paginated list, regardless of sort order.

Only updates if the first page is already loaded — otherwise the insertion
would flash in/out once the real first page arrives.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `paginatedQuery`: `Query`; `argsToMatch?`: `Partial`\<[`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\>\>; `localQueryStore`: `OptimisticLocalStore`; `item`: [`PaginatedQueryItem`](#paginatedqueryitem)\<`Query`\>; \} |
| `options.paginatedQuery` | `Query` |
| `options.argsToMatch?` | `Partial`\<[`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\>\> |
| `options.localQueryStore` | `OptimisticLocalStore` |
| `options.item` | [`PaginatedQueryItem`](#paginatedqueryitem)\<`Query`\> |

#### Returns

`void`

***

### insertAtBottomIfLoaded()

```ts
function insertAtBottomIfLoaded<Query>(options): void;
```

Defined in: [src/runtime/vue/composables/use-paginated-query.ts:619](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L619)

Insert an item at the bottom of a paginated list, but only if the final
page has loaded (otherwise it would pop out when the server responds).

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `paginatedQuery`: `Query`; `argsToMatch?`: `Partial`\<[`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\>\>; `localQueryStore`: `OptimisticLocalStore`; `item`: [`PaginatedQueryItem`](#paginatedqueryitem)\<`Query`\>; \} |
| `options.paginatedQuery` | `Query` |
| `options.argsToMatch?` | `Partial`\<[`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\>\> |
| `options.localQueryStore` | `OptimisticLocalStore` |
| `options.item` | [`PaginatedQueryItem`](#paginatedqueryitem)\<`Query`\> |

#### Returns

`void`

***

### insertAtPosition()

```ts
function insertAtPosition<Query>(options): void;
```

Defined in: [src/runtime/vue/composables/use-paginated-query.ts:658](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L658)

Insert an item at its sorted position across loaded pages of a paginated
query, given a sort order and a function deriving the sort key.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | \{ `paginatedQuery`: `Query`; `argsToMatch?`: `Partial`\<[`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\>\>; `sortOrder`: `"asc"` \| `"desc"`; `sortKeyFromItem`: (`item`) => [`Value`](#value) \| [`Value`](#value)[]; `localQueryStore`: `OptimisticLocalStore`; `item`: [`PaginatedQueryItem`](#paginatedqueryitem)\<`Query`\>; \} |
| `options.paginatedQuery` | `Query` |
| `options.argsToMatch?` | `Partial`\<[`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\>\> |
| `options.sortOrder` | `"asc"` \| `"desc"` |
| `options.sortKeyFromItem` | (`item`) => [`Value`](#value) \| [`Value`](#value)[] |
| `options.localQueryStore` | `OptimisticLocalStore` |
| `options.item` | [`PaginatedQueryItem`](#paginatedqueryitem)\<`Query`\> |

#### Returns

`void`

***

### usePaginatedQuery\_experimental()

#### Call Signature

```ts
function usePaginatedQuery_experimental<Query>(
   query, 
   args, 
options): UsePaginatedQueryReturnType<Query>;
```

Defined in: [src/runtime/vue/composables/use-paginated-query.ts:860](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L860)

Experimental paginated query that adds an object-form overload on top of the
positional [usePaginatedQuery](#usepaginatedquery), mirroring the public name React's
Convex integration exposes (`usePaginatedQuery_experimental`).

The positional overload behaves exactly like [usePaginatedQuery](#usepaginatedquery): it
returns the object-of-refs [UsePaginatedQueryReturnType](#usepaginatedqueryreturntype) (TitleCase
statuses) and throws on error. The object overload returns a `ComputedRef`
of the lowercase-status discriminated union
[UsePaginatedQueryObjectReturnType](#usepaginatedqueryobjectreturntype) — kept whole (not split into refs)
so the `status`/`data`/`error` type narrowing survives — and surfaces errors
via `status: 'error'` (unless `throwOnError: true`).

Note: React backs its experimental hook with the Convex client's native
`PaginatedQueryClient`, which the published `convex` package does not export.
This port reuses our manual page-management implementation, which produces
identical observable results (`results`/`data`, `status`, `loadMore`).

##### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `Query` |
| `args` | `MaybeRefOrGetter`\<`"skip"` \| [`PaginatedQueryArgs`](#paginatedqueryargs)\<`Query`\>\> |
| `options` | \{ `initialNumItems`: `number`; \} |
| `options.initialNumItems` | `number` |

##### Returns

[`UsePaginatedQueryReturnType`](#usepaginatedqueryreturntype)\<`Query`\>

#### Call Signature

```ts
function usePaginatedQuery_experimental<Query, ThrowOnError>(options): ComputedRef<UsePaginatedQueryObjectReturnType<Query, ThrowOnError>>;
```

Defined in: [src/runtime/vue/composables/use-paginated-query.ts:866](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-paginated-query.ts#L866)

Experimental paginated query that adds an object-form overload on top of the
positional [usePaginatedQuery](#usepaginatedquery), mirroring the public name React's
Convex integration exposes (`usePaginatedQuery_experimental`).

The positional overload behaves exactly like [usePaginatedQuery](#usepaginatedquery): it
returns the object-of-refs [UsePaginatedQueryReturnType](#usepaginatedqueryreturntype) (TitleCase
statuses) and throws on error. The object overload returns a `ComputedRef`
of the lowercase-status discriminated union
[UsePaginatedQueryObjectReturnType](#usepaginatedqueryobjectreturntype) — kept whole (not split into refs)
so the `status`/`data`/`error` type narrowing survives — and surfaces errors
via `status: 'error'` (unless `throwOnError: true`).

Note: React backs its experimental hook with the Convex client's native
`PaginatedQueryClient`, which the published `convex` package does not export.
This port reuses our manual page-management implementation, which produces
identical observable results (`results`/`data`, `status`, `loadMore`).

##### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Query` *extends* [`PaginatedQueryReference`](#paginatedqueryreference) | - |
| `ThrowOnError` *extends* `boolean` | `false` |

##### Parameters

| Parameter | Type |
| ------ | ------ |
| `options` | `MaybeRefOrGetter`\<[`UsePaginatedQueryOptions`](#usepaginatedqueryoptions)\<`Query`, `ThrowOnError`\>\> |

##### Returns

`ComputedRef`\<[`UsePaginatedQueryObjectReturnType`](#usepaginatedqueryobjectreturntype)\<`Query`, `ThrowOnError`\>\>

***

### useQueries()

```ts
function useQueries(queries): ShallowRef<Record<string, any>>;
```

Defined in: [src/runtime/vue/composables/use-queries.ts:60](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-queries.ts#L60)

Load a variable number of reactive Convex queries.

`useQueries` is similar to [useQuery](#usequery) but it allows
loading multiple queries which can be useful for loading a dynamic number
of queries without violating the rules of composables.

This composable accepts an object whose keys are identifiers for each query and the
values are objects of `{ query: FunctionReference, args: Record<string, Value> }`. The
`query` is a FunctionReference for the Convex query function to load, and the `args` are
the arguments to that function.

The composable returns an object that maps each identifier to the result of the query,
`undefined` if the query is still loading, or an instance of `Error` if the query
threw an exception.

For example if you loaded a query like:
```typescript
const results = useQueries({
  messagesInGeneral: {
    query: "listMessages",
    args: { channel: "#general" }
  }
});
```
then the result would look like:
```typescript
{
  messagesInGeneral: [{
    channel: "#general",
    body: "hello"
    _id: ...,
    _creationTime: ...
  }]
}
```

This composable returns a reactive result that updates
whenever any of the query results change.

Throws an error if no Convex client has been provided (see [useConvex](#useconvex)).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queries` | `MaybeRefOrGetter`\<[`RequestForQueries`](#requestforqueries)\> | An object mapping identifiers to objects of `{query: string, args: Record<string, Value> }` describing which query functions to fetch. Reactive (ref/computed/getter) or plain. |

#### Returns

`ShallowRef`\<`Record`\<`string`, `any`\>\>

A shallow ref of an object with the same keys as the input. The
values are the result of the query function, `undefined` if it's still
loading, or an `Error` if it threw an exception.

***

### useQuery()

```ts
function useQuery<Query>(query, ...args): ComputedRef<Query["_returnType"] | undefined>;
```

Defined in: [src/runtime/vue/composables/use-query.ts:77](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-query.ts#L77)

Load a reactive query within a Vue component.

This Vue composable subscribes to a Convex query and updates the returned
ref whenever the query result changes. The subscription is managed
automatically -- it starts when the component mounts and stops when it
unmounts.

Throws an error if no Convex client has been provided.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a server.FunctionReference for the public query to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`OptionalRestArgsOrSkip`](#optionalrestargsorskip)\<`Query`\> | The arguments to the query function or the string `"skip"` if the query should not be loaded. Accepts a ref, computed, or getter for reactive args. |

#### Returns

`ComputedRef`\<`Query`\[`"_returnType"`\] \| `undefined`\>

a computed ref with the result of the query. Contains `undefined`
while loading.

#### Example

```vue
<script setup lang="ts">
import { useQuery } from '#imports'
import { api } from '#convex/api'

// Reactively loads tasks; the ref updates when data changes:
const tasks = useQuery(api.tasks.list, { completed: false })
// tasks.value is `undefined` while loading

// Pass "skip" (or a reactive getter returning it) to conditionally
// disable the query:
const profile = useQuery(
  api.users.get,
  computed(() => userId.value ? { userId: userId.value } : 'skip'),
)
</script>
```

***

### useQuery\_experimental()

```ts
function useQuery_experimental<Query, ThrowOnError>(options): ComputedRef<UseQueryResult<Query["_returnType"], ThrowOnError>>;
```

Defined in: [src/runtime/vue/composables/use-query.ts:143](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-query.ts#L143)

Load a reactive query within a Vue component using an options object.

This is an experimental form of [useQuery](#usequery) that accepts a single
UseQueryOptions object instead of positional arguments.

Consumers are expected to check the returned object `status` field to
make proper use of the result. If an error occurs, it will be present
in the result object unless `throwOnError` is `true`, in which case
the error will be thrown instead.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `Query` *extends* [`FunctionReference`](#functionreference)\<`"query"`\> | - |
| `ThrowOnError` *extends* `boolean` | `false` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | `UseQueryOptions`\<`Query`, `ThrowOnError`\> | Query options. Pass `args: "skip"` to disable the query. |

#### Returns

`ComputedRef`\<[`UseQueryResult`](#usequeryresult)\<`Query`\[`"_returnType"`\], `ThrowOnError`\>\>

a computed ref with the current query state as a
[UseQueryResult](#usequeryresult) object.

#### Example

```vue
<script setup lang="ts">
import { useQuery_experimental as useQuery } from '#imports'
import { api } from '#convex/api'

const state = useQuery({ query: api.tasks.list, args: { completed: false } })
// state.value.status: 'pending' | 'success' | 'error'
</script>
```

***

### useStorageUrl()

```ts
function useStorageUrl(getUrl, storageId): ComputedRef<string | null | undefined>;
```

Defined in: [src/runtime/vue/composables/use-storage-url.ts:50](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-storage-url.ts#L50)

Reactively resolve the served URL for a Convex stored file.

Thin wrapper over [useQuery](#usequery) that handles the common ergonomics of
serving stored files: it accepts a reactive storage id and automatically
skips the query (returning `undefined`) while the id is `null`/`undefined`,
so you can bind it straight to an id ref without juggling `'skip'`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `getUrl` | [`GetStorageUrl`](#getstorageurl) | A `FunctionReference` for the public `getUrl` query. |
| `storageId` | `MaybeRefOrGetter`\<`string` \| [`StorageId`](#storageid-1) \| `null` \| `undefined`\> | The storage id to resolve. Accepts a ref, computed, or getter; `null`/`undefined` skips the query. |

#### Returns

`ComputedRef`\<`string` \| `null` \| `undefined`\>

A computed ref of the served URL: `string | null` once loaded
  (`null` if the file is gone), or `undefined` while loading or skipped.

#### Example

```vue
<script setup lang="ts">
import { useStorageUrl } from '#imports'
import { api } from '#convex/api'

const { storageId } = useUpload(api.images.generateUploadUrl)
const url = useStorageUrl(api.images.getUrl, storageId)
</script>

<template>
  <img v-if="url" :src="url">
</template>
```

***

### useUploadQueue()

```ts
function useUploadQueue(generateUploadUrl, options?): VueUploadQueue;
```

Defined in: [src/runtime/vue/composables/use-upload-queue.ts:133](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload-queue.ts#L133)

Upload many files to Convex file storage with bounded concurrency and
per-item reactive progress.

Built on the same flow as [useUpload](#useupload), but manages a queue: call
[VueUploadQueue.enqueue](#enqueue) with one or more files (or a `FileList` from
a multi-file `<input>`) and the queue uploads up to `concurrency` at a time,
exposing per-item and aggregate progress.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `generateUploadUrl` | [`GenerateUploadUrl`](#generateuploadurl) | A `FunctionReference` for the public `generateUploadUrl` mutation. |
| `options` | [`UseUploadQueueOptions`](#useuploadqueueoptions) | Optional [UseUploadQueueOptions](#useuploadqueueoptions). |

#### Returns

[`VueUploadQueue`](#vueuploadqueue)

A [VueUploadQueue](#vueuploadqueue).

#### Example

```vue
<script setup lang="ts">
import { useUploadQueue, useMutation } from '#imports'
import { api } from '#convex/api'

const saveImage = useMutation(api.images.save)
const { items, enqueue, progress, isUploading } = useUploadQueue(
  api.images.generateUploadUrl,
  { concurrency: 4, onItemSuccess: storageId => saveImage({ storageId }) },
)

function onPick(event: Event) {
  enqueue((event.target as HTMLInputElement).files)
}
</script>

<template>
  <input type="file" multiple @change="onPick">
  <progress v-if="isUploading" :value="progress" />
  <ul>
    <li v-for="item in items" :key="item.id">
      {{ item.status }} — {{ Math.round(item.progress * 100) }}%
    </li>
  </ul>
</template>
```

***

### uploadFile()

```ts
function uploadFile(options): Promise<StorageId>;
```

Defined in: [src/runtime/vue/composables/use-upload.ts:58](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L58)

Upload a single file to a Convex upload URL, resolving to its storage id.

Low-level building block used by [useUpload](#useupload) and
[useUploadQueue](#useuploadqueue). Uses `XMLHttpRequest` so real upload progress and
cancellation are available — `fetch` cannot report request-body progress.

Browser-only: throws if no `XMLHttpRequest` global is available (e.g. during
SSR).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`UploadFileOptions`](#uploadfileoptions) | [UploadFileOptions](#uploadfileoptions). |

#### Returns

`Promise`\<[`StorageId`](#storageid-1)\>

A promise of the new [StorageId](#storageid-1).

***

### useUpload()

```ts
function useUpload(generateUploadUrl, options?): VueUpload;
```

Defined in: [src/runtime/vue/composables/use-upload.ts:205](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/composables/use-upload.ts#L205)

Upload files to Convex file storage from a component, with reactive
progress, error, and cancellation state.

Wraps the standard Convex flow — call a `generateUploadUrl` mutation, `POST`
the file to the returned URL, and read back the storage id — and exposes it
as reactive refs. Pass the resulting [StorageId](#storageid-1) to your own mutation
to persist it in your data model.

Uploads are client-only: calling `upload()` during SSR resolves to `null`
and sets [VueUpload.error](#error-1).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `generateUploadUrl` | [`GenerateUploadUrl`](#generateuploadurl) | A `FunctionReference` for the public `generateUploadUrl` mutation. |
| `options` | [`UseUploadOptions`](#useuploadoptions) | Optional [UseUploadOptions](#useuploadoptions) callbacks. |

#### Returns

[`VueUpload`](#vueupload)

A [VueUpload](#vueupload).

#### Example

```vue
<script setup lang="ts">
import { useUpload, useMutation } from '#imports'
import { api } from '#convex/api'

const saveImage = useMutation(api.images.save)
const { upload, isUploading, progress, error } = useUpload(
  api.images.generateUploadUrl,
  { onSuccess: storageId => saveImage({ storageId }) },
)

async function onPick(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) await upload(file)
}
</script>

<template>
  <input type="file" :disabled="isUploading" @change="onPick">
  <progress v-if="isUploading" :value="progress" />
  <p v-if="error">{{ error.message }}</p>
</template>
```

***

### usePreloadedQuery()

```ts
function usePreloadedQuery<Query>(preloadedQuery): ComputedRef<Query["_returnType"]>;
```

Defined in: [src/runtime/vue/hydration.ts:51](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/hydration.ts#L51)

Load a reactive query within a Vue component using a `Preloaded` payload
from the server returned by preloadQuery.

This Vue composable contains internal state that will cause a rerender
whenever the query result changes.

Throws an error if no Convex client has been provided (see [useConvex](#useconvex)).

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `preloadedQuery` | `MaybeRefOrGetter`\<[`Preloaded`](#preloaded)\<`Query`\>\> | The `Preloaded` query payload from the server. Accepts a ref, computed, or getter; a fresh payload re-subscribes with the new query and args. |

#### Returns

`ComputedRef`\<`Query`\[`"_returnType"`\]\>

a computed ref with the result of the query. Initially returns the
result fetched by the server. Subsequently returns the result fetched by the client.

#### Example

```vue
<script setup lang="ts">
import { usePreloadedQuery } from '#imports'

const props = defineProps<{
  preloaded: Preloaded<typeof api.tasks.list>
}>()

const tasks = usePreloadedQuery(props.preloaded)
</script>
```

***

### provideConvexApi()

```ts
function provideConvexApi(api, app?): void;
```

Defined in: [src/runtime/vue/provide.ts:30](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/provide.ts#L30)

Make the generated Convex `api` available to every `nuxt-convex-module` composable
and component, so `useBilling()`, `<CheckoutLink>`, `useEmailStatus()`, … work
with zero arguments.

The packaged Nuxt plugin calls this automatically with `#convex/api`. Call it
yourself (e.g. with a custom `api`) only to override that default — pass the
Nuxt `vueApp` so the binding is available during SSR too:

```ts
export default defineNuxtPlugin((nuxtApp) => {
  provideConvexApi(api, nuxtApp.vueApp)
})
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `api` | [`ConvexApi`](#convexapi) |
| `app?` | `App`\<`any`\> |

#### Returns

`void`

***

### useConvexApi()

```ts
function useConvexApi(): ConvexApi | undefined;
```

Defined in: [src/runtime/vue/provide.ts:40](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/provide.ts#L40)

The injected generated `api`, or `undefined` when it hasn't been provided
(e.g. outside a setup context, or before Convex codegen has run). Prefer
[useConvexNamespace](#useconvexnamespace) for feature access.

#### Returns

[`ConvexApi`](#convexapi) \| `undefined`

***

### useConvexNamespace()

```ts
function useConvexNamespace<T>(name): T | undefined;
```

Defined in: [src/runtime/vue/provide.ts:52](https://github.com/qruto/nuxt-convex-module/blob/4ddae9765ecc9b44c8fa8b16fe4307bac4c95246/src/runtime/vue/provide.ts#L52)

The named function group from the generated `api` (e.g. `'billing'`,
`'email'`), or `undefined` when billing/email isn't scaffolded — letting the
feature degrade to a graceful no-op rather than throwing.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `T` | `Record`\<`string`, `unknown`\> | The expected shape of the namespace's function references. |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `name` | `string` |

#### Returns

`T` \| `undefined`
