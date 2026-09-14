---
navigation: true
description: "Composables that need the Nuxt app context (#app) — the half of the package that runs in a Nuxt app but not in plain Vue."
seo:
  title: "API reference: app"
---

# app

Composables that need the Nuxt app context (`#app`) — the half of the
package that runs in a Nuxt app but not in plain Vue.

This module contains [useAsyncQuery](#useasyncquery) and its paginated form
[useAsyncPaginatedQuery](#useasyncpaginatedquery): server-rendered Convex data that upgrades
to a live subscription after hydration.

## Usage

**Default — auto-imported.** In any page, component or composable, call it
with no import; its types are auto-imported too:

```vue
<script setup lang="ts">
import { api } from '#convex/api'

const { data: messages, status } = useAsyncQuery(api.messages.list, {})
// `AsyncQueryStatus`, `AsyncQueryReturn`, … resolve without an import as well:
const label = (s: AsyncQueryStatus) => s === 'pending' ? 'Loading…' : ''
</script>
```

**Explicit import — this subpath.** For a project that turns auto-imports
off, a file outside the app's auto-import scope, or an editor that wants
the import spelled out:

```ts
import { useAsyncQuery } from 'nuxt-convex-module/app'
```

**Types.** From `#imports` (Nuxt's auto-import barrel) or from this subpath,
whichever your file already uses:

```ts
import type { AsyncQueryReturn } from '#imports'
import type { AsyncQueryReturn } from 'nuxt-convex-module/app'

const messages: AsyncQueryReturn<Doc<'messages'>[]> = useAsyncQuery(api.messages.list, {})
```

Before 1.0 the composable was auto-imported but reachable from no subpath,
so neither the explicit form nor the types could be written at all.

## Interfaces

### AsyncPaginatedQueryOptions

Defined in: [src/runtime/nuxt/composables/use-async-paginated-query.ts:31](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L31)

Options for [useAsyncPaginatedQuery](#useasyncpaginatedquery): `usePaginatedQuery`'s
`initialNumItems` plus the SSR options of [AsyncQueryOptions](#asyncqueryoptions).

#### Extends

- `Pick`\<[`AsyncQueryOptions`](#asyncqueryoptions), `"key"` \| `"server"` \| `"lazy"` \| `"token"`\>

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="initialnumitems"></a> `initialNumItems` | `number` | How many items the first page holds — on the server and on the client. | - | [src/runtime/nuxt/composables/use-async-paginated-query.ts:33](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L33) |
| <a id="key"></a> `key?` | `string` | Key for the underlying `useAsyncData` entry (payload dedup across components). Defaults to a key derived from the query name and the initial args. Provide an explicit key when two call sites must not share a payload entry. | [`AsyncQueryOptions`](#asyncqueryoptions).[`key`](#key-1) | [src/runtime/nuxt/composables/use-async-query.ts:44](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L44) |
| <a id="server"></a> `server?` | `boolean` | Fetch the query on the server during SSR and embed the result in the Nuxt payload. Set `false` to fetch on the client only. **Default** `true` | [`AsyncQueryOptions`](#asyncqueryoptions).[`server`](#server-1) | [src/runtime/nuxt/composables/use-async-query.ts:51](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L51) |
| <a id="lazy"></a> `lazy?` | `boolean` | Mirror `useAsyncData`'s `lazy` option: don't block client-side navigation on the initial fetch. **Default** `false` | [`AsyncQueryOptions`](#asyncqueryoptions).[`lazy`](#lazy-1) | [src/runtime/nuxt/composables/use-async-query.ts:58](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L58) |
| <a id="token"></a> `token?` | `string` \| (() => `string` \| `Promise`\<`string` \| `null`\> \| `null`) | JWT to authenticate the SSR fetch, or a function resolving one. Defaults to the token the Better Auth server plugin prefetched for this request (when that integration is enabled); pass a value here to integrate any other server-side auth source. The client-side live subscription authenticates through the Convex client's own `setAuth` wiring. | [`AsyncQueryOptions`](#asyncqueryoptions).[`token`](#token-1) | [src/runtime/nuxt/composables/use-async-query.ts:75](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L75) |

***

### AsyncPaginatedQueryData

Defined in: [src/runtime/nuxt/composables/use-async-paginated-query.ts:42](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L42)

The reactive half of [AsyncPaginatedQueryReturn](#asyncpaginatedqueryreturn): `usePaginatedQuery`'s
fields plus the `error` and `refresh` of the Nuxt data contract.

#### Extended by

- [`AsyncPaginatedQueryReturn`](#asyncpaginatedqueryreturn)

#### Type Parameters

| Type Parameter |
| ------ |
| `Item` |

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="results"></a> `results` | `ComputedRef`\<`Item`[]\> | The rows: the server-rendered first page until the live subscription delivers its own, then every loaded page, live. The server page is shown for the initial args only — after an args change the list is empty until the new first page arrives. | [src/runtime/nuxt/composables/use-async-paginated-query.ts:49](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L49) |
| <a id="status"></a> `status` | `ComputedRef`\<`"LoadingFirstPage"` \| `"CanLoadMore"` \| `"LoadingMore"` \| `"Exhausted"`\> | `usePaginatedQuery`'s status. Before the live subscription has its first page it is derived from the server page: `'CanLoadMore'` or `'Exhausted'`. | [src/runtime/nuxt/composables/use-async-paginated-query.ts:54](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L54) |
| <a id="isloading"></a> `isLoading` | `ComputedRef`\<`boolean`\> | `true` while no page — server or live — is available yet, or more rows are loading. | [src/runtime/nuxt/composables/use-async-paginated-query.ts:56](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L56) |
| <a id="error"></a> `error` | `ComputedRef`\<`Error` \| `null`\> | The SSR fetch error or the live subscription's, `null` when none. Never thrown. | [src/runtime/nuxt/composables/use-async-paginated-query.ts:58](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L58) |
| <a id="loadmore"></a> `loadMore` | (`numItems`) => `void` | Fetch `numItems` more rows. Takes effect once the live subscription has its first page (`status` no longer derived from the server page). | [src/runtime/nuxt/composables/use-async-paginated-query.ts:63](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L63) |
| <a id="refresh"></a> `refresh` | (`opts?`) => `Promise`\<`void`\> | Re-run the server-side first-page fetch (client-side it is a no-op — the subscription is live). | [src/runtime/nuxt/composables/use-async-paginated-query.ts:65](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L65) |

***

### AsyncPaginatedQueryReturn

Defined in: [src/runtime/nuxt/composables/use-async-paginated-query.ts:74](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L74)

Result of [useAsyncPaginatedQuery](#useasyncpaginatedquery): awaitable like `useAsyncData`, and
the refs of [AsyncPaginatedQueryData](#asyncpaginatedquerydata).

#### Extends

- `PromiseLike`\<[`AsyncPaginatedQueryData`](#asyncpaginatedquerydata)\<`Item`\>\>.[`AsyncPaginatedQueryData`](#asyncpaginatedquerydata)\<`Item`\>

#### Type Parameters

| Type Parameter |
| ------ |
| `Item` |

#### Properties

| Property | Type | Description | Inherited from | Defined in |
| ------ | ------ | ------ | ------ | ------ |
| <a id="results-1"></a> `results` | `ComputedRef`\<`Item`[]\> | The rows: the server-rendered first page until the live subscription delivers its own, then every loaded page, live. The server page is shown for the initial args only — after an args change the list is empty until the new first page arrives. | [`AsyncPaginatedQueryData`](#asyncpaginatedquerydata).[`results`](#results) | [src/runtime/nuxt/composables/use-async-paginated-query.ts:49](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L49) |
| <a id="status-1"></a> `status` | `ComputedRef`\<`"LoadingFirstPage"` \| `"CanLoadMore"` \| `"LoadingMore"` \| `"Exhausted"`\> | `usePaginatedQuery`'s status. Before the live subscription has its first page it is derived from the server page: `'CanLoadMore'` or `'Exhausted'`. | [`AsyncPaginatedQueryData`](#asyncpaginatedquerydata).[`status`](#status) | [src/runtime/nuxt/composables/use-async-paginated-query.ts:54](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L54) |
| <a id="isloading-1"></a> `isLoading` | `ComputedRef`\<`boolean`\> | `true` while no page — server or live — is available yet, or more rows are loading. | [`AsyncPaginatedQueryData`](#asyncpaginatedquerydata).[`isLoading`](#isloading) | [src/runtime/nuxt/composables/use-async-paginated-query.ts:56](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L56) |
| <a id="error-1"></a> `error` | `ComputedRef`\<`Error` \| `null`\> | The SSR fetch error or the live subscription's, `null` when none. Never thrown. | [`AsyncPaginatedQueryData`](#asyncpaginatedquerydata).[`error`](#error) | [src/runtime/nuxt/composables/use-async-paginated-query.ts:58](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L58) |
| <a id="loadmore-1"></a> `loadMore` | (`numItems`) => `void` | Fetch `numItems` more rows. Takes effect once the live subscription has its first page (`status` no longer derived from the server page). | [`AsyncPaginatedQueryData`](#asyncpaginatedquerydata).[`loadMore`](#loadmore) | [src/runtime/nuxt/composables/use-async-paginated-query.ts:63](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L63) |
| <a id="refresh-1"></a> `refresh` | (`opts?`) => `Promise`\<`void`\> | Re-run the server-side first-page fetch (client-side it is a no-op — the subscription is live). | [`AsyncPaginatedQueryData`](#asyncpaginatedquerydata).[`refresh`](#refresh) | [src/runtime/nuxt/composables/use-async-paginated-query.ts:65](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L65) |

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
| `TResult1` | [`AsyncPaginatedQueryData`](#asyncpaginatedquerydata)\<`Item`\> |
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

***

### AsyncQueryOptions

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:37](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L37)

Options for [useAsyncQuery](#useasyncquery).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="key-1"></a> `key?` | `string` | Key for the underlying `useAsyncData` entry (payload dedup across components). Defaults to a key derived from the query name and the initial args. Provide an explicit key when two call sites must not share a payload entry. | [src/runtime/nuxt/composables/use-async-query.ts:44](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L44) |
| <a id="server-1"></a> `server?` | `boolean` | Fetch the query on the server during SSR and embed the result in the Nuxt payload. Set `false` to fetch on the client only. **Default** `true` | [src/runtime/nuxt/composables/use-async-query.ts:51](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L51) |
| <a id="lazy-1"></a> `lazy?` | `boolean` | Mirror `useAsyncData`'s `lazy` option: don't block client-side navigation on the initial fetch. **Default** `false` | [src/runtime/nuxt/composables/use-async-query.ts:58](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L58) |
| <a id="live"></a> `live?` | `boolean` | Upgrade to a live WebSocket subscription on the client. Set `false` for SSR + hydration *without* realtime updates — no WebSocket is opened for this query, and [refresh](#refresh-2) becomes the way to get fresh data. **Default** `true` | [src/runtime/nuxt/composables/use-async-query.ts:67](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L67) |
| <a id="token-1"></a> `token?` | `string` \| (() => `string` \| `Promise`\<`string` \| `null`\> \| `null`) | JWT to authenticate the SSR fetch, or a function resolving one. Defaults to the token the Better Auth server plugin prefetched for this request (when that integration is enabled); pass a value here to integrate any other server-side auth source. The client-side live subscription authenticates through the Convex client's own `setAuth` wiring. | [src/runtime/nuxt/composables/use-async-query.ts:75](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L75) |

***

### AsyncQueryReturn

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:85](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L85)

Reactive result of [useAsyncQuery](#useasyncquery). Also awaitable — `await
useAsyncQuery(...)` blocks until the initial fetch settles, like
`useAsyncData`.

#### Extends

- `PromiseLike`\<[`AsyncQueryData`](#asyncquerydata)\<`T`\>\>

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="data"></a> `data` | `ComputedRef`\<`T` \| `undefined`\> | The query result: the server-fetched value first, replaced by the live subscription's value once the client receives one. `undefined` while nothing has loaded (or while skipped). | [src/runtime/nuxt/composables/use-async-query.ts:91](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L91) |
| <a id="error-2"></a> `error` | `ComputedRef`\<`Error` \| `null`\> | The initial-fetch or live-subscription error, `null` when none. | [src/runtime/nuxt/composables/use-async-query.ts:93](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L93) |
| <a id="status-2"></a> `status` | `ComputedRef`\<[`AsyncQueryStatus`](#asyncquerystatus)\> | Initial-fetch status. Live pushes don't churn it: once data exists it stays `'success'` unless the live subscription errors. | [src/runtime/nuxt/composables/use-async-query.ts:98](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L98) |
| <a id="refresh-2"></a> `refresh` | (`opts?`) => `Promise`\<`void`\> | Re-run the one-shot fetch. With a live subscription (`live: true`) the server already pushes updates, so this is mainly for retrying after an error; with `live: false` it is the way to get fresh data. | [src/runtime/nuxt/composables/use-async-query.ts:104](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L104) |

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
| `TResult1` | [`AsyncQueryData`](#asyncquerydata)\<`T`\> |
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

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:30](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L30)

Request status of a [useAsyncQuery](#useasyncquery) call — mirrors Nuxt's
`useAsyncData` statuses.

***

### AsyncQueryData

```ts
type AsyncQueryData<T> = Pick<AsyncQueryReturn<T>, "data" | "error" | "status" | "refresh">;
```

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:113](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L113)

The reactive half of [AsyncQueryReturn](#asyncqueryreturn) — what `await useAsyncQuery(...)`
resolves to, and the shape to annotate a value passed on from the call site.

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Variables

### useConvexAsyncPaginatedQuery

```ts
const useConvexAsyncPaginatedQuery: <Query>(query, args, options) => AsyncPaginatedQueryReturn<PaginatedQueryItem<Query>> = useAsyncPaginatedQuery;
```

Defined in: [src/runtime/nuxt/composables/use-async-paginated-query.ts:235](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L235)

A paginated Convex query the Nuxt way: the first page is fetched during SSR
and hydrated from the payload, then [usePaginatedQuery](/api-reference/reference/client#usepaginatedquery) takes over on
the client — live rows and `loadMore`, no loading flash for the first page.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](/api-reference/reference/client#paginatedqueryreference) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public paginated query. |
| `args` | `MaybeRefOrGetter`\< \| `"skip"` \| [`PaginatedQueryArgs`](/api-reference/reference/client#paginatedqueryargs)\<`Query`\>\> | the query's arguments without `paginationOpts`, or `'skip'`. Accepts a ref, computed, or getter. |
| `options` | [`AsyncPaginatedQueryOptions`](#asyncpaginatedqueryoptions) | [AsyncPaginatedQueryOptions](#asyncpaginatedqueryoptions). |

#### Returns

[`AsyncPaginatedQueryReturn`](#asyncpaginatedqueryreturn)\<[`PaginatedQueryItem`](/api-reference/reference/client#paginatedqueryitem)\<`Query`\>\>

An awaitable [AsyncPaginatedQueryReturn](#asyncpaginatedqueryreturn).

#### Example

```vue
<script setup lang="ts">
import { api } from '#convex/api'

const { results, status, loadMore } = useAsyncPaginatedQuery(
  api.messages.list,
  {},
  { initialNumItems: 20 },
)
</script>
```

The payload entry is keyed on the query name, the *initial* args and
`initialNumItems` (override with `options.key`). Client-side navigation does
not fetch a page over HTTP: the subscription opens straight away, and the
server page only matters for the first paint.

***

### useConvexAsyncQuery

```ts
const useConvexAsyncQuery: <Query>(query, args?, options) => AsyncQueryReturn<FunctionReturnType<Query>> = useAsyncQuery;
```

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:317](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L317)

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
| `Query` *extends* [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public query to run, like `api.dir1.dir2.filename.func`. |
| `args?` | `MaybeRefOrGetter`\<`"skip"` \| [`FunctionArgs`](/api-reference/reference/client#functionargs)\<`Query`\>\> | The arguments to the query function, or `'skip'`. Accepts a ref, computed, or getter for reactive args. |
| `options?` | [`AsyncQueryOptions`](#asyncqueryoptions) | [AsyncQueryOptions](#asyncqueryoptions). |

#### Returns

[`AsyncQueryReturn`](#asyncqueryreturn)\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>\>

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

### useAsyncPaginatedQuery()

```ts
function useAsyncPaginatedQuery<Query>(
   query, 
   args, 
   options
): AsyncPaginatedQueryReturn<PaginatedQueryItem<Query>>;
```

Defined in: [src/runtime/nuxt/composables/use-async-paginated-query.ts:110](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-paginated-query.ts#L110)

A paginated Convex query the Nuxt way: the first page is fetched during SSR
and hydrated from the payload, then [usePaginatedQuery](/api-reference/reference/client#usepaginatedquery) takes over on
the client — live rows and `loadMore`, no loading flash for the first page.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`PaginatedQueryReference`](/api-reference/reference/client#paginatedqueryreference) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public paginated query. |
| `args` | `MaybeRefOrGetter`\< \| `"skip"` \| [`PaginatedQueryArgs`](/api-reference/reference/client#paginatedqueryargs)\<`Query`\>\> | the query's arguments without `paginationOpts`, or `'skip'`. Accepts a ref, computed, or getter. |
| `options` | [`AsyncPaginatedQueryOptions`](#asyncpaginatedqueryoptions) | [AsyncPaginatedQueryOptions](#asyncpaginatedqueryoptions). |

#### Returns

[`AsyncPaginatedQueryReturn`](#asyncpaginatedqueryreturn)\<[`PaginatedQueryItem`](/api-reference/reference/client#paginatedqueryitem)\<`Query`\>\>

An awaitable [AsyncPaginatedQueryReturn](#asyncpaginatedqueryreturn).

#### Example

```vue
<script setup lang="ts">
import { api } from '#convex/api'

const { results, status, loadMore } = useAsyncPaginatedQuery(
  api.messages.list,
  {},
  { initialNumItems: 20 },
)
</script>
```

The payload entry is keyed on the query name, the *initial* args and
`initialNumItems` (override with `options.key`). Client-side navigation does
not fetch a page over HTTP: the subscription opens straight away, and the
server page only matters for the first paint.

***

### useAsyncQuery()

```ts
function useAsyncQuery<Query>(
   query, 
   args?, 
   options?
): AsyncQueryReturn<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:160](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L160)

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
| `Query` *extends* [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public query to run, like `api.dir1.dir2.filename.func`. |
| `args?` | `MaybeRefOrGetter`\<`"skip"` \| [`FunctionArgs`](/api-reference/reference/client#functionargs)\<`Query`\>\> | The arguments to the query function, or `'skip'`. Accepts a ref, computed, or getter for reactive args. |
| `options?` | [`AsyncQueryOptions`](#asyncqueryoptions) | [AsyncQueryOptions](#asyncqueryoptions). |

#### Returns

[`AsyncQueryReturn`](#asyncqueryreturn)\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>\>

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
