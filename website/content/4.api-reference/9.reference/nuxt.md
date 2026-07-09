---
navigation: true
---

# nuxt

Helpers for integrating Convex into Nuxt applications using server rendering.

This module contains:
1. [preloadQuery](#preloadquery), for preloading data for reactive client components.
2. [fetchQuery](#fetchquery), [fetchMutation](#fetchmutation) and [fetchAction](#fetchaction) for loading and mutating Convex data
  from Nuxt server routes, API handlers, and middleware.

## Usage

All exported functions assume that a Convex deployment URL is set in the
`NUXT_PUBLIC_CONVEX_URL` environment variable. `npx convex dev` will
automatically set it during local development.

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

Defined in: [src/runtime/nuxt/index.ts:57](https://github.com/qruto/nuxt-convex-module/blob/59ccdc4dfc6db70ba57565d2ff93bf533456f929/src/runtime/nuxt/index.ts#L57)

Options to [preloadQuery](#preloadquery), [fetchQuery](#fetchquery), [fetchMutation](#fetchmutation) and [fetchAction](#fetchaction).

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="token"></a> `token?` | `string` | The JWT-encoded OpenID Connect authentication token to use for the function call. | [src/runtime/nuxt/index.ts:61](https://github.com/qruto/nuxt-convex-module/blob/59ccdc4dfc6db70ba57565d2ff93bf533456f929/src/runtime/nuxt/index.ts#L61) |
| <a id="url"></a> `url?` | `string` | The URL of the Convex deployment to use for the function call. Defaults to `process.env.NUXT_PUBLIC_CONVEX_URL` if not provided. Explicitly passing undefined here (such as from missing ENV variables) will throw an error in the future. | [src/runtime/nuxt/index.ts:68](https://github.com/qruto/nuxt-convex-module/blob/59ccdc4dfc6db70ba57565d2ff93bf533456f929/src/runtime/nuxt/index.ts#L68) |
| <a id="skipconvexdeploymenturlcheck"></a> `skipConvexDeploymentUrlCheck?` | `boolean` | Skip validating that the Convex deployment URL looks like `https://happy-animal-123.convex.cloud` or localhost. This can be useful if running a self-hosted Convex deployment that uses a different URL. The default value is `false` | [src/runtime/nuxt/index.ts:83](https://github.com/qruto/nuxt-convex-module/blob/59ccdc4dfc6db70ba57565d2ff93bf533456f929/src/runtime/nuxt/index.ts#L83) |

## Functions

### preloadQuery()

```ts
function preloadQuery<Query>(query, ...args): Promise<Preloaded<Query>>;
```

Defined in: [src/runtime/nuxt/index.ts:100](https://github.com/qruto/nuxt-convex-module/blob/59ccdc4dfc6db70ba57565d2ff93bf533456f929/src/runtime/nuxt/index.ts#L100)

Execute a Convex query function and return a `Preloaded`
payload which can be passed to `usePreloadedQuery` in a client
component.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public query to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`ArgsAndOptions`](/api-reference/reference/vue#argsandoptions)\<`Query`, [`NuxtOptions`](#nuxtoptions)\> | The arguments object for the query. If this is omitted, the arguments will be `{}`. |

#### Returns

`Promise`\<[`Preloaded`](/api-reference/reference/vue#preloaded)\<`Query`\>\>

A promise of the `Preloaded` payload.

***

### preloadedQueryResult()

```ts
function preloadedQueryResult<Query>(preloaded): FunctionReturnType<Query>;
```

Defined in: [src/runtime/nuxt/index.ts:121](https://github.com/qruto/nuxt-convex-module/blob/59ccdc4dfc6db70ba57565d2ff93bf533456f929/src/runtime/nuxt/index.ts#L121)

Returns the result of executing a query via [preloadQuery](#preloadquery).

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `preloaded` | [`Preloaded`](/api-reference/reference/vue#preloaded)\<`Query`\> | The `Preloaded` payload returned by [preloadQuery](#preloadquery). |

#### Returns

[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Query`\>

The query result.

***

### fetchQuery()

```ts
function fetchQuery<Query>(query, ...args): Promise<FunctionReturnType<Query>>;
```

Defined in: [src/runtime/nuxt/index.ts:139](https://github.com/qruto/nuxt-convex-module/blob/59ccdc4dfc6db70ba57565d2ff93bf533456f929/src/runtime/nuxt/index.ts#L139)

Execute a Convex query function.

#### Type Parameters

| Type Parameter |
| ------ |
| `Query` *extends* [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a `FunctionReference` for the public query to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`ArgsAndOptions`](/api-reference/reference/vue#argsandoptions)\<`Query`, [`NuxtOptions`](#nuxtoptions)\> | The arguments object for the query. If this is omitted, the arguments will be `{}`. |

#### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Query`\>\>

A promise of the query's result.

***

### fetchMutation()

```ts
function fetchMutation<Mutation>(mutation, ...args): Promise<FunctionReturnType<Mutation>>;
```

Defined in: [src/runtime/nuxt/index.ts:160](https://github.com/qruto/nuxt-convex-module/blob/59ccdc4dfc6db70ba57565d2ff93bf533456f929/src/runtime/nuxt/index.ts#L160)

Execute a Convex mutation function.

#### Type Parameters

| Type Parameter |
| ------ |
| `Mutation` *extends* [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"mutation"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `mutation` | `Mutation` | A `FunctionReference` for the public mutation to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`ArgsAndOptions`](/api-reference/reference/vue#argsandoptions)\<`Mutation`, [`NuxtOptions`](#nuxtoptions)\> | The arguments object for the mutation. If this is omitted, the arguments will be `{}`. |

#### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Mutation`\>\>

A promise of the mutation's result.

***

### fetchAction()

```ts
function fetchAction<Action>(action, ...args): Promise<FunctionReturnType<Action>>;
```

Defined in: [src/runtime/nuxt/index.ts:183](https://github.com/qruto/nuxt-convex-module/blob/59ccdc4dfc6db70ba57565d2ff93bf533456f929/src/runtime/nuxt/index.ts#L183)

Execute a Convex action function.

#### Type Parameters

| Type Parameter |
| ------ |
| `Action` *extends* [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"action"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `action` | `Action` | A `FunctionReference` for the public action to run like `api.dir1.dir2.filename.func`. |
| ...`args` | [`ArgsAndOptions`](/api-reference/reference/vue#argsandoptions)\<`Action`, [`NuxtOptions`](#nuxtoptions)\> | The arguments object for the action. If this is omitted, the arguments will be `{}`. |

#### Returns

`Promise`\<[`FunctionReturnType`](/api-reference/reference/vue#functionreturntype)\<`Action`\>\>

A promise of the action's result.
