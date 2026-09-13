---
navigation: true
description: "Composables that need the Nuxt app context (#app) — the half of the package that runs in a Nuxt app but not in plain Vue."
seo:
  title: "API reference: app"
---

# app

Composables that need the Nuxt app context (`#app`) — the half of the
package that runs in a Nuxt app but not in plain Vue.

This module contains [useAsyncQuery](#useasyncquery): server-rendered Convex data
that upgrades to a live subscription after hydration.

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

### AsyncQueryOptions

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:38](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L38)

Options for [useAsyncQuery](#useasyncquery).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="key"></a> `key?` | `string` | Key for the underlying `useAsyncData` entry (payload dedup across components). Defaults to a key derived from the query name and the initial args. Provide an explicit key when two call sites must not share a payload entry. | [src/runtime/nuxt/composables/use-async-query.ts:45](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L45) |
| <a id="server"></a> `server?` | `boolean` | Fetch the query on the server during SSR and embed the result in the Nuxt payload. Set `false` to fetch on the client only. **Default** `true` | [src/runtime/nuxt/composables/use-async-query.ts:52](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L52) |
| <a id="lazy"></a> `lazy?` | `boolean` | Mirror `useAsyncData`'s `lazy` option: don't block client-side navigation on the initial fetch. **Default** `false` | [src/runtime/nuxt/composables/use-async-query.ts:59](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L59) |
| <a id="live"></a> `live?` | `boolean` | Upgrade to a live WebSocket subscription on the client. Set `false` for SSR + hydration *without* realtime updates — no WebSocket is opened for this query, and [refresh](#refresh) becomes the way to get fresh data. **Default** `true` | [src/runtime/nuxt/composables/use-async-query.ts:68](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L68) |
| <a id="token"></a> `token?` | `string` \| (() => `string` \| `Promise`\<`string` \| `null`\> \| `null`) | JWT to authenticate the SSR fetch, or a function resolving one. Defaults to the token the Better Auth server plugin prefetched for this request (when that integration is enabled); pass a value here to integrate any other server-side auth source. The client-side live subscription authenticates through the Convex client's own `setAuth` wiring. | [src/runtime/nuxt/composables/use-async-query.ts:76](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L76) |

***

### AsyncQueryReturn

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:86](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L86)

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
| <a id="data"></a> `data` | `ComputedRef`\<`T` \| `undefined`\> | The query result: the server-fetched value first, replaced by the live subscription's value once the client receives one. `undefined` while nothing has loaded (or while skipped). | [src/runtime/nuxt/composables/use-async-query.ts:92](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L92) |
| <a id="error"></a> `error` | `ComputedRef`\<`Error` \| `null`\> | The initial-fetch or live-subscription error, `null` when none. | [src/runtime/nuxt/composables/use-async-query.ts:94](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L94) |
| <a id="status"></a> `status` | `ComputedRef`\<[`AsyncQueryStatus`](#asyncquerystatus)\> | Initial-fetch status. Live pushes don't churn it: once data exists it stays `'success'` unless the live subscription errors. | [src/runtime/nuxt/composables/use-async-query.ts:99](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L99) |
| <a id="refresh"></a> `refresh` | (`opts?`) => `Promise`\<`void`\> | Re-run the one-shot fetch. With a live subscription (`live: true`) the server already pushes updates, so this is mainly for retrying after an error; with `live: false` it is the way to get fresh data. | [src/runtime/nuxt/composables/use-async-query.ts:105](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L105) |

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

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:31](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L31)

Request status of a [useAsyncQuery](#useasyncquery) call — mirrors Nuxt's
`useAsyncData` statuses.

***

### AsyncQueryData

```ts
type AsyncQueryData<T> = Pick<AsyncQueryReturn<T>, "data" | "error" | "status" | "refresh">;
```

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:108](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L108)

#### Type Parameters

| Type Parameter |
| ------ |
| `T` |

## Variables

### useConvexAsyncQuery

```ts
const useConvexAsyncQuery: <Query>(query, args?, options) => AsyncQueryReturn<FunctionReturnType<Query>> = useAsyncQuery;
```

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:303](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L303)

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

### useAsyncQuery()

```ts
function useAsyncQuery<Query>(
   query, 
   args?, 
   options?
): AsyncQueryReturn<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/nuxt/composables/use-async-query.ts:155](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/composables/use-async-query.ts#L155)

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
