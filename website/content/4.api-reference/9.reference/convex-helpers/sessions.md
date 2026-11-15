---
navigation: false
description: "Vue helpers for adding session data to Convex functions: a port of convex-helpers/react/sessions."
seo:
  title: "API reference: convex-helpers/sessions"
---

# convex-helpers/sessions

Vue helpers for adding session data to Convex functions: a port of
`convex-helpers/react/sessions`.

!Important!: To use these functions, call [provideSession](#providesession) in a
component above the ones that use them, below the Convex client:
```vue
<script setup lang="ts">
provideSession()
</script>
```

See the associated [Stack post](https://stack.convex.dev/track-sessions-without-cookies)
for more information.

## Classes

### ConvexVueSessionClient

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:508](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L508)

A client wrapper that adds session data to Convex functions: a port of
upstream's `ConvexReactSessionClient`.

Wraps a ConvexClient and provides methods to automatically inject
the sessionId parameter into queries, mutations, and actions.

Example:
```ts
const sessionClient = new ConvexVueSessionClient(address);

// Use sessionClient instead of client
const result = await sessionClient.sessionQuery(
  api.myModule.myQuery,
  { arg1: 123 },
);
```

#### Extends

- [`ConvexVueClient`](/api-reference/reference/client#convexvueclient)

#### Constructors

##### Constructor

```ts
new ConvexVueSessionClient(address, options?): ConvexVueSessionClient;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:522](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L522)

Create a new ConvexVueSessionClient.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `address` | `string` | The deployment URL |
| `options?` | [`ConvexVueClientOptions`](/api-reference/reference/client#convexvueclientoptions) & \{ `sessionId?`: `SessionId`; `storage?`: `SessionStorage`; `storageKey?`: `string`; \} | Optional configuration |

###### Returns

[`ConvexVueSessionClient`](#convexvuesessionclient)

###### Overrides

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`constructor`](/api-reference/reference/client#constructor)

#### Accessors

##### url

###### Get Signature

```ts
get url(): string;
```

Defined in: [src/runtime/vue/client.ts:264](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L264)

Return the address for this client, useful for creating a new client.

Not guaranteed to match the address with which this client was constructed:
it may be canonicalized.

###### Returns

`string`

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`url`](/api-reference/reference/client#url)

##### logger

###### Get Signature

```ts
get logger(): Logger;
```

Defined in: [src/runtime/vue/client.ts:605](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L605)

Get the logger for this client.

###### Returns

`Logger`

The [ConvexLogger](/api-reference/reference/client#convexlogger) for this client.

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`logger`](/api-reference/reference/client#logger-1)

#### Methods

##### setSessionId()

```ts
setSessionId(sessionId): void;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:573](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L573)

Set a new session ID to use for future function calls.

NOTE: Setting it here will not propagate to any SessionProvider.
So if you plan to change the sessionId and you are using a SessionProvider,
you should update it there instead.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `sessionId` | `SessionId` | The new session ID |

###### Returns

`void`

##### getSessionId()

```ts
getSessionId(): SessionId;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:585](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L585)

Get the current session ID.

###### Returns

`SessionId`

The current session ID

##### sessionQuery()

```ts
sessionQuery<Query>(query, ...args): Promise<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:596](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L596)

Run a Convex query with the session ID injected.

###### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-query-2"></a> `Query` *extends* `SessionFunction`\<`"query"`, `any`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | Query that takes a sessionId parameter |
| ...`args` | [`SessionArgsArray`](#sessionargsarray)\<`Query`\> | Arguments for the query, without the sessionId |

###### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>\>

A promise of the query result

##### sessionMutation()

```ts
sessionMutation<Mutation>(mutation, ...args): Promise<FunctionReturnType<Mutation>>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:613](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L613)

Run a Convex mutation with the session ID injected.

###### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-mutation-1"></a> `Mutation` *extends* `SessionFunction`\<`"mutation"`, `any`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mutation` | `Mutation` | Mutation that takes a sessionId parameter |
| ...`args` | [`SessionArgsAndOptions`](#sessionargsandoptions)\<`Mutation`, [`MutationOptions`](/api-reference/reference/client#mutationoptions)\<[`FunctionArgs`](/api-reference/reference/client#functionargs)\<`Mutation`\>\>\> | Arguments for the mutation, without the sessionId |

###### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Mutation`\>\>

A promise of the mutation result

##### sessionAction()

```ts
sessionAction<Action>(action, ...args): Promise<FunctionReturnType<Action>>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:637](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L637)

Run a Convex action with the session ID injected.

###### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-action-1"></a> `Action` *extends* `SessionFunction`\<`"action"`, `any`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | `Action` | Action that takes a sessionId parameter |
| ...`args` | [`SessionArgsArray`](#sessionargsarray)\<`Action`\> | Arguments for the action, without the sessionId |

###### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Action`\>\>

A promise of the action result

##### setAuth()

```ts
setAuth(
   fetchToken, 
   onChange?, 
   onRefreshChange?
): void;
```

Defined in: [src/runtime/vue/client.ts:307](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L307)

Set the authentication token to be used for subsequent queries and mutations.
`fetchToken` will be called automatically again if a token expires.
`fetchToken` should return `null` if the token cannot be retrieved, for example
when the user's rights were permanently revoked.

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `fetchToken` | [`AuthTokenFetcher`](/api-reference/reference/client#authtokenfetcher) | an async function returning the JWT-encoded OpenID Connect Identity Token |
| `onChange?` | (`isAuthenticated`) => `void` | a callback that will be called when the authentication status changes |
| `onRefreshChange?` | (`isRefreshing`) => `void` | a callback called with `true` when the socket is paused to fetch a replacement token after a server rejection, and `false` when refresh completes |

###### Returns

`void`

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`setAuth`](/api-reference/reference/client#setauth-1)

##### clearAuth()

```ts
clearAuth(): void;
```

Defined in: [src/runtime/vue/client.ts:331](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L331)

Clear the current authentication token if set.

###### Returns

`void`

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`clearAuth`](/api-reference/reference/client#clearauth-1)

##### watchQuery()

```ts
watchQuery<Query>(query, ...argsAndOptions): Watch<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/vue/client.ts:365](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L365)

Construct a new [Watch](/api-reference/reference/client#watch) on a Convex query function.

**Most application code should not call this method directly. Instead use
the useQuery composable.**

The act of creating a watch does nothing, a Watch is stateless.

###### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-query-3"></a> `Query` *extends* \| [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> \| [`FunctionReference_future`](/api-reference/reference/client#functionreference_future)\<`"query"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | A [`FunctionReference`](https://docs.convex.dev/api/modules/server#functionreference) for the public query to run. |
| ...`argsAndOptions` | [`ArgsAndOptions`](/api-reference/reference/client#argsandoptions)\<`Query`, [`WatchQueryOptions`](/api-reference/reference/client#watchqueryoptions)\> | - |

###### Returns

[`Watch`](/api-reference/reference/client#watch)\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>\>

The [Watch](/api-reference/reference/client#watch) object.

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`watchQuery`](/api-reference/reference/client#watchquery)

##### prewarmQuery()

```ts
prewarmQuery<Query>(queryOptions): void;
```

Defined in: [src/runtime/vue/client.ts:443](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L443)

Indicates likely future interest in a query subscription.

The implementation currently immediately subscribes to a query. In the future this method
may prioritize some queries over others, fetch the query result without subscribing, or
do nothing in slow network connections or high load scenarios.

To use this in a Vue component, call useQuery() and ignore the return value.

###### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-query-4"></a> `Query` *extends* \| [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> \| [`FunctionReference_future`](/api-reference/reference/client#functionreference_future)\<`"query"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queryOptions` | [`QueryOptions`](/api-reference/reference/client#queryoptions)\<`Query`\> & \{ `extendSubscriptionFor?`: `number`; \} | A query (function reference from an api object) and its args, plus an optional extendSubscriptionFor for how long to subscribe to the query. |

###### Returns

`void`

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`prewarmQuery`](/api-reference/reference/client#prewarmquery)

##### mutation()

```ts
mutation<Mutation>(mutation, ...argsAndOptions): Promise<FunctionReturnType<Mutation>>;
```

Defined in: [src/runtime/vue/client.ts:502](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L502)

Execute a mutation function.

###### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-mutation-2"></a> `Mutation` *extends* \| [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`\> \| [`FunctionReference_future`](/api-reference/reference/client#functionreference_future)\<`"mutation"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mutation` | `Mutation` | A [`FunctionReference`](https://docs.convex.dev/api/modules/server#functionreference) for the public mutation to run. |
| ...`argsAndOptions` | [`ArgsAndOptions`](/api-reference/reference/client#argsandoptions)\<`Mutation`, [`MutationOptions`](/api-reference/reference/client#mutationoptions)\<[`FunctionArgs`](/api-reference/reference/client#functionargs)\<`Mutation`\>\>\> | - |

###### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Mutation`\>\>

A promise of the mutation's result.

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`mutation`](/api-reference/reference/client#mutation)

##### action()

```ts
action<Action>(action, ...args): Promise<FunctionReturnType<Action>>;
```

Defined in: [src/runtime/vue/client.ts:523](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L523)

Execute an action function.

###### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-action-2"></a> `Action` *extends* \| [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"action"`\> \| [`FunctionReference_future`](/api-reference/reference/client#functionreference_future)\<`"action"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | `Action` | A [`FunctionReference`](https://docs.convex.dev/api/modules/server#functionreference) for the public action to run. |
| ...`args` | [`OptionalRestArgs`](/api-reference/reference/client#optionalrestargs)\<`Action`\> | An arguments object for the action. If this is omitted, the arguments will be `{}`. |

###### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Action`\>\>

A promise of the action's result.

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`action`](/api-reference/reference/client#action)

##### query()

```ts
query<Query>(query, ...args): Promise<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/vue/client.ts:543](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L543)

Fetch a query result once.

**Most application code should subscribe to queries instead, using
the useQuery composable.**

###### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-query-5"></a> `Query` *extends* \| [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> \| [`FunctionReference_future`](/api-reference/reference/client#functionreference_future)\<`"query"`\> |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | A [`FunctionReference`](https://docs.convex.dev/api/modules/server#functionreference) for the public query to run. |
| ...`args` | [`OptionalRestArgs`](/api-reference/reference/client#optionalrestargs)\<`Query`\> | An arguments object for the query. If this is omitted, the arguments will be `{}`. |

###### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>\>

A promise of the query's result.

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`query`](/api-reference/reference/client#query-2)

##### connectionState()

```ts
connectionState(): ConnectionState;
```

Defined in: [src/runtime/vue/client.ts:573](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L573)

**`Experimental`**

Get the current [ConnectionState](/api-reference/reference/client#connectionstate) between the client and the Convex
deployment.

###### Returns

[`ConnectionState`](/api-reference/reference/client#connectionstate)

The [ConnectionState](/api-reference/reference/client#connectionstate) with the Convex deployment.
 May change in a minor release — see STABILITY.md.

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`connectionState`](/api-reference/reference/client#connectionstate-1)

##### subscribeToConnectionState()

```ts
subscribeToConnectionState(cb): () => void;
```

Defined in: [src/runtime/vue/client.ts:594](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L594)

**`Experimental`**

Subscribe to the [ConnectionState](/api-reference/reference/client#connectionstate) between the client and the Convex
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
 May change in a minor release — see STABILITY.md.

() => `void`

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`subscribeToConnectionState`](/api-reference/reference/client#subscribetoconnectionstate)

##### close()

```ts
close(): Promise<void>;
```

Defined in: [src/runtime/vue/client.ts:617](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/vue/client.ts#L617)

Close any network handles associated with this client and stop all subscriptions.

Call this method when you're done with a [ConvexVueClient](/api-reference/reference/client#convexvueclient) to
dispose of its sockets and resources.

###### Returns

`Promise`\<`void`\>

A `Promise` fulfilled when the connection has been completely closed.

###### Inherited from

[`ConvexVueClient`](/api-reference/reference/client#convexvueclient).[`close`](/api-reference/reference/client#close)

## Type Aliases

### UseStorage

```ts
type UseStorage<T> = (key, initialValue) => Ref<T>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:62](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L62)

Where the session ID is kept: a composable that returns a writable ref of
the stored value, as VueUse's `useLocalStorage` and `useSessionStorage` do.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `key` | `string` |
| `initialValue` | `T` |

#### Returns

`Ref`\<`T`\>

***

### RefreshSessionFn

```ts
type RefreshSessionFn = (beforeUpdate?) => Promise<SessionId>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:67](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L67)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `beforeUpdate?` | (`newSessionId`) => `any` \| `Promise`\<`any`\> |

#### Returns

`Promise`\<`SessionId`\>

***

### SessionQueryArgsArray

```ts
type SessionQueryArgsArray<Fn> = keyof FunctionArgs<Fn> extends "sessionId" ? [args?: EmptyObject | "skip"] : Partial<ArgsWithoutSession<Fn>> extends ArgsWithoutSession<Fn> ? [args?: ArgsWithoutSession<Fn> | "skip"] : [args: ArgsWithoutSession<Fn> | "skip"];
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:95](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L95)

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-fn"></a> `Fn` *extends* `SessionFunction`\<`"query"`\> |

***

### SessionArgsArray

```ts
type SessionArgsArray<Fn> = keyof FunctionArgs<Fn> extends "sessionId" ? [args?: EmptyObject] : Partial<ArgsWithoutSession<Fn>> extends ArgsWithoutSession<Fn> ? [args?: ArgsWithoutSession<Fn>] : [args: ArgsWithoutSession<Fn>];
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:102](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L102)

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-fn-1"></a> `Fn` *extends* `SessionFunction`\<`"query"` \| `"mutation"` \| `"action"`\> |

***

### SessionArgsAndOptions

```ts
type SessionArgsAndOptions<Fn, Options> = keyof FunctionArgs<Fn> extends "sessionId" ? [args?: EmptyObject, options?: Options] : Partial<ArgsWithoutSession<Fn>> extends ArgsWithoutSession<Fn> ? [args?: ArgsWithoutSession<Fn>, options?: Options] : [args: ArgsWithoutSession<Fn>, options?: Options];
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:110](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L110)

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-fn-2"></a> `Fn` *extends* `SessionFunction`\<`"mutation"`\> |
| <a id="type-parameter-options"></a> `Options` |

***

### SessionPaginatedQueryArgs

```ts
type SessionPaginatedQueryArgs<Fn> = 
  | BetterOmit<PaginatedQueryArgs<Fn>, "sessionId">
  | "skip";
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:130](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L130)

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-fn-3"></a> `Fn` *extends* `SessionPaginatedQueryFunction` |

***

### SessionProviderOptions

```ts
type SessionProviderOptions = {
  useStorage?: UseStorage<SessionId | undefined>;
  storageKey?: string;
  idGenerator?: () => string;
  ssrFriendly?: boolean;
};
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:142](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L142)

Options of [provideSession](#providesession) and the props of `<SessionProvider>`.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="usestorage-1"></a> `useStorage?` | [`UseStorage`](#usestorage)\<`SessionId` \| `undefined`\> | [src/runtime/convex-helpers/vue/sessions.ts:143](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L143) |
| <a id="storagekey"></a> `storageKey?` | `string` | [src/runtime/convex-helpers/vue/sessions.ts:144](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L144) |
| <a id="idgenerator"></a> `idGenerator?` | () => `string` | [src/runtime/convex-helpers/vue/sessions.ts:145](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L145) |
| <a id="ssrfriendly"></a> `ssrFriendly?` | `boolean` | [src/runtime/convex-helpers/vue/sessions.ts:146](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L146) |

## Variables

### DEFAULT\_STORAGE\_KEY

```ts
const DEFAULT_STORAGE_KEY: "convex-session-id" = 'convex-session-id';
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:54](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L54)

***

### SessionKey

```ts
const SessionKey: InjectionKey<SessionContextValue>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:85](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L85)

The injection key [provideSession](#providesession) provides the session under: the
Vue counterpart of upstream's `SessionContext`.

***

### SessionProvider

```ts
const SessionProvider: DefineComponent<ExtractPropTypes<{
  useStorage: {
     type: PropType<UseStorage<SessionId | undefined>>;
     default: undefined;
  };
  storageKey: {
     type: StringConstructor;
     default: undefined;
  };
  idGenerator: {
     type: PropType<() => string>;
     default: undefined;
  };
  ssrFriendly: {
     type: BooleanConstructor;
     default: boolean;
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
  useStorage: {
     type: PropType<UseStorage<SessionId | undefined>>;
     default: undefined;
  };
  storageKey: {
     type: StringConstructor;
     default: undefined;
  };
  idGenerator: {
     type: PropType<() => string>;
     default: undefined;
  };
  ssrFriendly: {
     type: BooleanConstructor;
     default: boolean;
  };
}>, {
}>, {
  useStorage: UseStorage<SessionId | undefined>;
  storageKey: string;
  idGenerator: () => string;
  ssrFriendly: boolean;
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:247](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L247)

A thin component over [provideSession](#providesession), for templates that mirror
upstream's `<SessionProvider>`.

## Functions

### provideSession()

```ts
function provideSession(options?): void;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:171](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L171)

Provide a Convex session to the component's descendants: a port of
upstream's `<SessionProvider>`, creating a server session and providing
the id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `options?` | [`SessionProviderOptions`](#sessionprovideroptions) |

#### Returns

`void`

***

### useSessionQuery()

```ts
function useSessionQuery<Query>(query, ...args): ComputedRef<
  | FunctionReturnType<Query>
| undefined>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:276](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L276)

Use this in place of `useQuery` to run a query, passing a sessionId.

It automatically injects the sessionid parameter.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-query"></a> `Query` *extends* `SessionFunction`\<`"query"`, `any`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | Query that takes in a sessionId parameter. Like `api.foo.bar`. |
| ...`args` | `ReactiveArgs`\<[`SessionQueryArgsArray`](#sessionqueryargsarray)\<`Query`\>\> | Args for that query, without the sessionId, as a value, a ref or a getter. |

#### Returns

`ComputedRef`\<
  \| [`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>
  \| `undefined`\>

A ref of the query result. For SSR, it will skip the query until the
client has mounted.

***

### useSessionPaginatedQuery()

```ts
function useSessionPaginatedQuery<Query>(
   query, 
   args, 
   options
): 
  | UsePaginatedQueryReturnType<Query>
  | undefined;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:302](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L302)

Use this in place of `usePaginatedQuery` to run a query, passing a sessionId.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-query-1"></a> `Query` *extends* `SessionPaginatedQueryFunction`\<\{ `paginationOpts`: `PaginationOptions`; \}\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | Query that takes in a sessionId parameter. Like `api.foo.bar`. |
| `args` | `MaybeRefOrGetter`\<[`SessionPaginatedQueryArgs`](#sessionpaginatedqueryargs)\<`Query`\>\> | Args for that query, without the sessionId, as a value, a ref or a getter. |
| `options` | \{ `initialNumItems`: `number`; \} | An object specifying the `initialNumItems` to be loaded in the first page. |
| `options.initialNumItems` | `number` | - |

#### Returns

  \| [`UsePaginatedQueryReturnType`](/api-reference/reference/client#usepaginatedqueryreturntype)\<`Query`\>
  \| `undefined`

The refs of the currently loaded items and the status of the
pagination, and a `loadMore` function. For SSR, it will skip the query
until the client has mounted.

***

### useSessionMutation()

```ts
function useSessionMutation<Mutation>(name): VueSessionMutation<Mutation>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:346](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L346)

Use this in place of `useMutation` to run a mutation with a sessionId.

It automatically injects the sessionId parameter.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-mutation"></a> `Mutation` *extends* `SessionFunction`\<`"mutation"`, `any`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `Mutation` | Mutation that takes in a sessionId parameter. Like `api.foo.bar`. |

#### Returns

`VueSessionMutation`\<`Mutation`\>

A mutation function. For SSR, it will wait until the client has a
valid sessionId.

***

### useSessionAction()

```ts
function useSessionAction<Action>(name): (...args) => Promise<FunctionReturnType<Action>>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:383](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L383)

Use this in place of `useAction` to run an action with a sessionId.

It automatically injects the sessionId parameter.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-action"></a> `Action` *extends* `SessionFunction`\<`"action"`, `any`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `Action` | Action that takes in a sessionId parameter. Like `api.foo.bar`. |

#### Returns

An action function. For SSR, it will wait until the client has a
valid sessionId.

(...`args`) => `Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Action`\>\>

***

### useSessionId()

```ts
function useSessionId(): readonly [ComputedRef<SessionId | undefined>, RefreshSessionFn, ComputedRef<Promise<SessionId>>];
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:412](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L412)

Get the session context when nested under [provideSession](#providesession).

#### Returns

readonly \[`ComputedRef`\<`SessionId` \| `undefined`\>, [`RefreshSessionFn`](#refreshsessionfn), `ComputedRef`\<`Promise`\<`SessionId`\>\>\]

[sessionId, refresh, sessionIdPromise] where:
The `sessionId` ref will only hold `undefined` when using SSR with
`ssrFriendly`, until the client has mounted.
To use it in an async context at that time, you can await `sessionIdPromise.value`.
`refresh` will generate a new sessionId. Pass a function to it to run before
generating the new ID.

***

### useSessionIdArg()

```ts
function useSessionIdArg<T>(args): ComputedRef<
  | "skip"
  | T & {
  sessionId: SessionId;
}>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:439](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L439)

Use this in place of args to a Convex query that also take a sessionId.
e.g.
```ts
const myQuery = useQuery(api.foo.bar, useSessionIdArg({ arg: "baz" }));
```

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t-1"></a> `T` |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `args` | `MaybeRefOrGetter`\<`"skip"` \| `T`\> | Usually args to a Convex query that also take a sessionId, as a value, a ref or a getter. |

#### Returns

`ComputedRef`\<
  \| `"skip"`
  \| `T` & \{
  `sessionId`: `SessionId`;
\}\>

A ref of the args with the sessionId, or "skip" during server &
first client render, if ssrFriendly is set.

***

### useSessionStorage()

```ts
function useSessionStorage(key, initialValue): Ref<SessionId | undefined>;
```

Defined in: [src/runtime/convex-helpers/vue/sessions.ts:454](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/sessions.ts#L454)

Compare with `ref`, but also persists the value in sessionStorage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `string` | Key to use for sessionStorage. |
| `initialValue` | `SessionId` \| `undefined` | If there is no value in storage, use this. |

#### Returns

`Ref`\<`SessionId` \| `undefined`\>

A writable ref of the value.
