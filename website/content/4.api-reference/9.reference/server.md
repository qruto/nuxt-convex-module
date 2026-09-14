---
navigation: true
description: "Helpers for integrating Convex into Nuxt applications using server rendering — generated TypeScript API reference for nuxt-convex-module/server."
seo:
  title: "API reference: server"
---

# server

Helpers for integrating Convex into Nuxt applications using server rendering.

This module contains:
1. [preloadQuery](#preloadquery), for preloading data for reactive client components.
2. [fetchQuery](#fetchquery), [fetchMutation](#fetchmutation) and [fetchAction](#fetchaction) for loading and mutating Convex data
  from Nuxt server routes, API handlers, and middleware.

## Usage

All exported functions assume that a Convex deployment URL is configured —
`convex.url` in `nuxt.config`, `NUXT_PUBLIC_CONVEX_URL`, or the `CONVEX_URL`
that `npx convex dev` writes to `.env.local`. Unlike its Next counterpart,
`npx convex dev` does *not* set the framework-prefixed name for Nuxt: the
Convex CLI has no Nuxt case in its framework detection, so it writes the
unprefixed `CONVEX_URL`, which the module reads too.

### Preloading data

Preload data inside a server route:

```typescript
// server/api/tasks.get.ts
export default defineEventHandler(async () => {
  return await preloadQuery(api.foo.baz)
})
```

And pass it to a client component:
```vue
<script setup lang="ts">
const props = defineProps<{
  preloaded: Preloaded<typeof api.foo.baz>
}>()

const data = usePreloadedQuery(props.preloaded)
// render `data`...
</script>
```

## Type Aliases

### NuxtOptions

```ts
type NuxtOptions = {
  token?: string;
  url?: string;
  skipConvexDeploymentUrlCheck?: boolean;
};
```

Defined in: [src/runtime/nuxt/index.ts:60](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/index.ts#L60)

Options to [preloadQuery](#preloadquery), [fetchQuery](#fetchquery), [fetchMutation](#fetchmutation) and [fetchAction](#fetchaction).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="token"></a> `token?` | `string` | The JWT-encoded OpenID Connect authentication token to use for the function call. | [src/runtime/nuxt/index.ts:64](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/index.ts#L64) |
| <a id="url"></a> `url?` | `string` | The URL of the Convex deployment to use for the function call. Defaults to `runtimeConfig.public.convex.url`, then to `process.env.NUXT_PUBLIC_CONVEX_URL`, if not provided. Explicitly passing undefined here (such as from missing ENV variables) will throw an error in the future. | [src/runtime/nuxt/index.ts:72](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/index.ts#L72) |
| <a id="skipconvexdeploymenturlcheck"></a> `skipConvexDeploymentUrlCheck?` | `boolean` | Skip validating that the Convex deployment URL looks like `https://happy-animal-123.convex.cloud` or localhost. This can be useful if running a self-hosted Convex deployment that uses a different URL. The default value is `false` | [src/runtime/nuxt/index.ts:87](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/index.ts#L87) |

## Functions

### preloadQuery()

```ts
function preloadQuery<Query>(query, ...args): Promise<Preloaded<Query>>;
```

Defined in: [src/runtime/nuxt/index.ts:104](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/index.ts#L104)

Execute a Convex query function and return a `Preloaded`
payload which can be passed to `usePreloadedQuery` in a client
component.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public query to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`ArgsAndOptions`](/api-reference/reference/client#argsandoptions)\<`Query`, [`NuxtOptions`](#nuxtoptions)\> | The arguments object for the query. If this is omitted, the arguments will be `{}`. |

#### Returns

`Promise`\<[`Preloaded`](/api-reference/reference/client#preloaded)\<`Query`\>\>

A promise of the `Preloaded` payload.

***

### preloadedQueryResult()

```ts
function preloadedQueryResult<Query>(preloaded): FunctionReturnType<Query>;
```

Defined in: [src/runtime/nuxt/index.ts:125](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/index.ts#L125)

Returns the result of executing a query via [preloadQuery](#preloadquery).

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `preloaded` | [`Preloaded`](/api-reference/reference/client#preloaded)\<`Query`\> | The `Preloaded` payload returned by [preloadQuery](#preloadquery). |

#### Returns

[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>

The query result.

***

### fetchQuery()

```ts
function fetchQuery<Query>(query, ...args): Promise<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/nuxt/index.ts:143](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/index.ts#L143)

Execute a Convex query function.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public query to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`ArgsAndOptions`](/api-reference/reference/client#argsandoptions)\<`Query`, [`NuxtOptions`](#nuxtoptions)\> | The arguments object for the query. If this is omitted, the arguments will be `{}`. |

#### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>\>

A promise of the query's result.

***

### fetchMutation()

```ts
function fetchMutation<Mutation>(mutation, ...args): Promise<FunctionReturnType<Mutation>>;
```

Defined in: [src/runtime/nuxt/index.ts:164](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/index.ts#L164)

Execute a Convex mutation function.

#### Type Parameters

| Type Parameter |
| ------ |
| `Mutation` *extends* [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mutation` | `Mutation` | A `FunctionReference` for the public mutation to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`ArgsAndOptions`](/api-reference/reference/client#argsandoptions)\<`Mutation`, [`NuxtOptions`](#nuxtoptions)\> | The arguments object for the mutation. If this is omitted, the arguments will be `{}`. |

#### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Mutation`\>\>

A promise of the mutation's result.

***

### fetchAction()

```ts
function fetchAction<Action>(action, ...args): Promise<FunctionReturnType<Action>>;
```

Defined in: [src/runtime/nuxt/index.ts:187](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/nuxt/index.ts#L187)

Execute a Convex action function.

#### Type Parameters

| Type Parameter |
| ------ |
| `Action` *extends* [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"action"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | `Action` | A `FunctionReference` for the public action to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`ArgsAndOptions`](/api-reference/reference/client#argsandoptions)\<`Action`, [`NuxtOptions`](#nuxtoptions)\> | The arguments object for the action. If this is omitted, the arguments will be `{}`. |

#### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Action`\>\>

A promise of the action's result.
