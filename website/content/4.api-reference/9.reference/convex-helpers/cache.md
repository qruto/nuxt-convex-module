---
navigation: false
description: "A Vue port of convex-helpers/react/cache: queries whose subscriptions stay open for a while after the last component lets go, so a remount shows the result at…"
seo:
  title: "API reference: convex-helpers/cache"
---

# convex-helpers/cache

A Vue port of `convex-helpers/react/cache`: queries whose subscriptions
stay open for a while after the last component lets go, so a remount shows
the result at once.

## Type Aliases

### ConvexQueryCacheOptions

```ts
type ConvexQueryCacheOptions = {
  expiration?: number;
  maxIdleEntries?: number;
  debug?: boolean;
};
```

Defined in: [src/runtime/convex-helpers/vue/cache/provider.ts:70](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/provider.ts#L70)

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="expiration"></a> `expiration?` | `number` | How long, in milliseconds, to keep the subscription to the convex query alive even after all references in the app have been dropped. **Default** `300000` | [src/runtime/convex-helpers/vue/cache/provider.ts:77](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/provider.ts#L77) |
| <a id="maxidleentries"></a> `maxIdleEntries?` | `number` | How many "extra" idle query subscriptions are allowed to remain connected to your convex backend. **Default** `Infinity` | [src/runtime/convex-helpers/vue/cache/provider.ts:85](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/provider.ts#L85) |
| <a id="debug"></a> `debug?` | `boolean` | A debug flag that will cause information about the query cache to be logged to the console every 3 seconds. **Default** `false` | [src/runtime/convex-helpers/vue/cache/provider.ts:93](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/provider.ts#L93) |

## Variables

### usePaginatedQuery

```ts
const usePaginatedQuery: <Query>(query, args, options) => UsePaginatedQueryReturnType<Query>;
```

Defined in: [src/runtime/convex-helpers/vue/cache/hooks.ts:188](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/hooks.ts#L188)

Load data reactively from a paginated query to a create a growing list,
utilizing the query cache.

Note: This is a modified version of the original `usePaginatedQuery`
composable. The main difference is that subscriptions stay active longer.

This can be used to power "infinite scroll" UIs.

If the query reference or arguments change, the pagination state will be reset
to the first page. Similarly, if any of the pages result in an InvalidCursor
error or an error associated with too much data, the pagination state will also
reset to the first page.

To learn more about pagination, see [Paginated Queries](https://docs.convex.dev/database/pagination).

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-__typequery"></a> `Query` *extends* [`PaginatedQueryReference`](/api-reference/reference/client#paginatedqueryreference) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | A FunctionReference to the public query function to run. |
| `args` | `MaybeRefOrGetter`\< \| `"skip"` \| [`PaginatedQueryArgs`](/api-reference/reference/client#paginatedqueryargs)\<`Query`\>\> | The arguments object for the query function, excluding the `paginationOpts` property, as a value, a ref or a getter. That property is injected by this composable. |
| `options` | \{ `initialNumItems`: `number`; `customPagination?`: `boolean`; \} | An object specifying the `initialNumItems` to be loaded in the first page, and the `customPagination` to use. |
| `options.initialNumItems` | `number` | - |
| `options.customPagination?` | `boolean` | Set this to true if you are using the `stream` or `paginator` helpers. |

#### Returns

[`UsePaginatedQueryReturnType`](/api-reference/reference/client#usepaginatedqueryreturntype)\<`Query`\>

The refs of the currently loaded items and the status of the
pagination, and a `loadMore` function.

***

### ConvexQueryCacheKey

```ts
const ConvexQueryCacheKey: InjectionKey<{
  registry: CacheRegistry | null;
}>;
```

Defined in: [src/runtime/convex-helpers/vue/cache/provider.ts:19](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/provider.ts#L19)

The injection key [provideConvexQueryCache](#provideconvexquerycache) provides the cache under:
the Vue counterpart of upstream's `ConvexQueryCacheContext`.

***

### ConvexQueryCacheProvider

```ts
const ConvexQueryCacheProvider: DefineComponent<ExtractPropTypes<{
  debug: {
     type: BooleanConstructor;
     default: undefined;
  };
  expiration: {
     type: NumberConstructor;
     default: undefined;
  };
  maxIdleEntries: {
     type: NumberConstructor;
     default: undefined;
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
  debug: {
     type: BooleanConstructor;
     default: undefined;
  };
  expiration: {
     type: NumberConstructor;
     default: undefined;
  };
  maxIdleEntries: {
     type: NumberConstructor;
     default: undefined;
  };
}>, {
}>, {
  debug: boolean;
  expiration: number;
  maxIdleEntries: number;
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/convex-helpers/vue/cache/provider.ts:49](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/provider.ts#L49)

A thin component over [provideConvexQueryCache](#provideconvexquerycache), for templates that
mirror upstream's `<ConvexQueryCacheProvider>`.

## Functions

### useQueries()

```ts
function useQueries(queries): Readonly<ShallowRef<Record<string, any | undefined | Error>>>;
```

Defined in: [src/runtime/convex-helpers/vue/cache/hooks.ts:46](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/hooks.ts#L46)

Load a variable number of reactive Convex queries, utilizing
the query cache.

`useQueries` is similar to [useQuery](#usequery) but it allows
loading multiple queries which can be useful for loading a dynamic number
of queries.

Throws an error if not used under `provideConvexQueryCache`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `queries` | `MaybeRefOrGetter`\<`Record`\<`string`, \{ `query`: \| [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> \| [`FunctionReference_future`](/api-reference/reference/client#functionreference_future)\<`"query"`\>; `args`: `Record`\<`string`, [`Value`](/api-reference/reference/client#value)\>; \}\>\> | An object mapping identifiers to objects of `{query: string, args: Record<string, Value> }` describing which query functions to fetch, as a value, a ref or a getter. |

#### Returns

`Readonly`\<`ShallowRef`\<`Record`\<`string`, `any` \| `undefined` \| `Error`\>\>\>

A ref of an object with the same keys as the input. The values are
the result of the query function, `undefined` if it's still loading, or an
`Error` if it threw an exception.

***

### useQuery()

```ts
function useQuery<Query>(query, ...queryArgs): ComputedRef<
  | FunctionReturnType<Query>
| undefined>;
```

Defined in: [src/runtime/convex-helpers/vue/cache/hooks.ts:108](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/hooks.ts#L108)

Load a reactive query within a Vue component, utilizing the query cache.

Throws an error if not used under the Convex client and `provideConvexQueryCache`.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-query"></a> `Query` *extends* \| [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> \| [`FunctionReference_future`](/api-reference/reference/client#functionreference_future)\<`"query"`\> |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | a [FunctionReference](/api-reference/reference/client#functionreference) for the public query to run like `api.dir1.dir2.filename.func`. |
| ...`queryArgs` | [`OptionalRestArgsOrSkip`](/api-reference/reference/client#optionalrestargsorskip)\<`Query`\> | The arguments to the query function or the string "skip" if the query should not be loaded, as a value, a ref or a getter. |

#### Returns

`ComputedRef`\<
  \| [`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>
  \| `undefined`\>

A ref of the result of the query. If the query is loading it holds `undefined`.

***

### provideConvexQueryCache()

```ts
function provideConvexQueryCache(options?): void;
```

Defined in: [src/runtime/convex-helpers/vue/cache/provider.ts:29](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/cache/provider.ts#L29)

Establish a query cache for the component's descendants, so that cached
`useQuery` calls can be used: a port of upstream's
`<ConvexQueryCacheProvider>`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`ConvexQueryCacheOptions`](#convexquerycacheoptions) | Options for the query cache |

#### Returns

`void`
