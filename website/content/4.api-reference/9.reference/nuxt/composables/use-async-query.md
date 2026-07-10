---
navigation: true
---

# nuxt/composables/use-async-query

Nuxt-idiomatic data fetching for Convex queries.

[useAsyncQuery](#useasyncquery) is a Vue/Nuxt-only addition (no `convex/react`
counterpart — see PARITY.md): it marries Nuxt's `useAsyncData` model with
Convex's live queries. During SSR the query runs over HTTP and the result is
embedded in the Nuxt payload; after hydration the composable upgrades to the
WebSocket subscription, so the page paints with server data and stays live —
no loading flash, no client refetch.

## Interfaces

### AsyncQueryOptions

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:37](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L37)

Options for [useAsyncQuery](#useasyncquery).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="key"></a> `key?` | `string` | Key for the underlying `useAsyncData` entry (payload dedup across components). Defaults to a key derived from the query name and the initial args. Provide an explicit key when two call sites must not share a payload entry. | [src/runtime/nuxt/composables/use-async-query.ts:44](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L44) |
| <a id="server"></a> `server?` | `boolean` | Fetch the query on the server during SSR and embed the result in the Nuxt payload. Set `false` to fetch on the client only. **Default** `true` | [src/runtime/nuxt/composables/use-async-query.ts:51](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L51) |
| <a id="lazy"></a> `lazy?` | `boolean` | Mirror `useAsyncData`'s `lazy` option: don't block client-side navigation on the initial fetch. **Default** `false` | [src/runtime/nuxt/composables/use-async-query.ts:58](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L58) |
| <a id="live"></a> `live?` | `boolean` | Upgrade to a live WebSocket subscription on the client. Set `false` for SSR + hydration *without* realtime updates — no WebSocket is opened for this query, and [refresh](#refresh) becomes the way to get fresh data. **Default** `true` | [src/runtime/nuxt/composables/use-async-query.ts:67](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L67) |
| <a id="token"></a> `token?` | `string` \| (() => `string` \| `Promise`\<`string` \| `null`\> \| `null`) | JWT to authenticate the SSR fetch, or a function resolving one. Defaults to the token the Better Auth server plugin prefetched for this request (when that integration is enabled); pass a value here to integrate any other server-side auth source. The client-side live subscription authenticates through the Convex client's own `setAuth` wiring. | [src/runtime/nuxt/composables/use-async-query.ts:75](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L75) |

***

### AsyncQueryReturn

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:85](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L85)

Reactive result of [useAsyncQuery](#useasyncquery). Also awaitable — `await
useAsyncQuery(...)` blocks until the initial fetch settles, like
`useAsyncData`.

#### Extends

- `PromiseLike`\<`AsyncQueryData`\<`T`\>\>

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="data"></a> `data` | `ComputedRef`\<`T` \| `undefined`\> | The query result: the server-fetched value first, replaced by the live subscription's value once the client receives one. `undefined` while nothing has loaded (or while skipped). | [src/runtime/nuxt/composables/use-async-query.ts:91](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L91) |
| <a id="error"></a> `error` | `ComputedRef`\<`Error` \| `null`\> | The initial-fetch or live-subscription error, `null` when none. | [src/runtime/nuxt/composables/use-async-query.ts:93](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L93) |
| <a id="status"></a> `status` | `ComputedRef`\<[`AsyncQueryStatus`](#asyncquerystatus)\> | Initial-fetch status. Live pushes don't churn it: once data exists it stays `'success'` unless the live subscription errors. | [src/runtime/nuxt/composables/use-async-query.ts:98](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L98) |
| <a id="refresh"></a> `refresh` | (`opts?`) => `Promise`\<`void`\> | Re-run the one-shot fetch. With a live subscription (`live: true`) the server already pushes updates, so this is mainly for retrying after an error; with `live: false` it is the way to get fresh data. | [src/runtime/nuxt/composables/use-async-query.ts:104](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L104) |

#### Methods

##### then()

```ts
then<TResult1, TResult2>(onfulfilled?, onrejected?): PromiseLike<TResult1 | TResult2>;
```

Defined in: node\_modules/typescript/lib/lib.es5.d.ts:1542

Attaches callbacks for the resolution and/or rejection of the Promise.

###### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TResult1` | `AsyncQueryData`\<`T`\> |
| `TResult2` | `never` |

###### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `onfulfilled?` | ((`value`) => `TResult1` \| `PromiseLike`\<`TResult1`\>) \| `null` | The callback to execute when the Promise is resolved. |
| `onrejected?` | ((`reason`) => `TResult2` \| `PromiseLike`\<`TResult2`\>) \| `null` | The callback to execute when the Promise is rejected. |

###### Returns

`PromiseLike`\<`TResult1` \| `TResult2`\>

A Promise for the completion of which ever callback is executed.

###### Inherited from

```ts
PromiseLike.then
```

## Type Aliases

### AsyncQueryStatus

```ts
type AsyncQueryStatus = "idle" | "pending" | "success" | "error";
```

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:30](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L30)

Request status of a [useAsyncQuery](#useasyncquery) call — mirrors Nuxt's
`useAsyncData` statuses.

## Variables

### useConvexAsyncQuery

```ts
const useConvexAsyncQuery: <Query>(query, args?, options) => AsyncQueryReturn<FunctionReturnType<Query>> = useAsyncQuery;
```

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:302](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L302)

Load a Convex query the Nuxt way: fetched on the server during SSR,
hydrated through the Nuxt payload, then seamlessly upgraded to a live
WebSocket subscription on the client.

Compared to useQuery (which renders `undefined` during SSR and
fetches on the client), `useAsyncQuery` puts real data in the
server-rendered HTML and never refetches it on hydration — the live
subscription simply takes over. Compared to `preloadQuery` +
`usePreloadedQuery`, no server route or prop-threading is needed.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public query to run, like `api.dir1.dir2.filename.func`. |
| `args?` | `MaybeRefOrGetter`\<[`FunctionArgs`](/api-reference/reference/vue#functionargs)\<`Query`\> \| `"skip"`\> | The arguments to the query function, or `'skip'`. Accepts a ref, computed, or getter for reactive args. |
| `options?` | [`AsyncQueryOptions`](#asyncqueryoptions) | [AsyncQueryOptions](#asyncqueryoptions). |

#### Returns

[`AsyncQueryReturn`](#asyncqueryreturn)\<[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Query`\>\>

An awaitable [AsyncQueryReturn](#asyncqueryreturn) of `data` / `error` /
`status` refs and a `refresh` function.

#### Example

```vue
<script setup lang="ts">
import { api } from '#convex/api'

// SSR-rendered AND live:
const { data: tasks, status, error } = useAsyncQuery(api.tasks.list, { completed: false })

// SSR + hydration without a WebSocket (fetch-once pages):
const { data: stats, refresh } = useAsyncQuery(api.stats.summary, {}, { live: false })
</script>
```

The Nuxt payload entry is keyed on the query name and the *initial* args
(override with `options.key`). Reactive args are honored by the live
subscription; the payload only matters for first paint.

Pass `'skip'` as args (or a getter returning it) to pause the query — no
fetch runs and no subscription opens until args become real.

## Functions

### useAsyncQuery()

```ts
function useAsyncQuery<Query>(
   query, 
   args?, 
options?): AsyncQueryReturn<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:154](https://github.com/qruto/nuxt-convex-module/blob/484ca468e2d3c00a20aaeb41691e748a7c8e6d5f/src/runtime/nuxt/composables/use-async-query.ts#L154)

Load a Convex query the Nuxt way: fetched on the server during SSR,
hydrated through the Nuxt payload, then seamlessly upgraded to a live
WebSocket subscription on the client.

Compared to useQuery (which renders `undefined` during SSR and
fetches on the client), `useAsyncQuery` puts real data in the
server-rendered HTML and never refetches it on hydration — the live
subscription simply takes over. Compared to `preloadQuery` +
`usePreloadedQuery`, no server route or prop-threading is needed.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public query to run, like `api.dir1.dir2.filename.func`. |
| `args?` | `MaybeRefOrGetter`\<[`FunctionArgs`](/api-reference/reference/vue#functionargs)\<`Query`\> \| `"skip"`\> | The arguments to the query function, or `'skip'`. Accepts a ref, computed, or getter for reactive args. |
| `options?` | [`AsyncQueryOptions`](#asyncqueryoptions) | [AsyncQueryOptions](#asyncqueryoptions). |

#### Returns

[`AsyncQueryReturn`](#asyncqueryreturn)\<[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Query`\>\>

An awaitable [AsyncQueryReturn](#asyncqueryreturn) of `data` / `error` /
`status` refs and a `refresh` function.

#### Example

```vue
<script setup lang="ts">
import { api } from '#convex/api'

// SSR-rendered AND live:
const { data: tasks, status, error } = useAsyncQuery(api.tasks.list, { completed: false })

// SSR + hydration without a WebSocket (fetch-once pages):
const { data: stats, refresh } = useAsyncQuery(api.stats.summary, {}, { live: false })
</script>
```

The Nuxt payload entry is keyed on the query name and the *initial* args
(override with `options.key`). Reactive args are honored by the live
subscription; the payload only matters for first paint.

Pass `'skip'` as args (or a getter returning it) to pause the query — no
fetch runs and no subscription opens until args become real.
