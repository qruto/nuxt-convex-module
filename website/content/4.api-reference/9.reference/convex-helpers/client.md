---
navigation: false
description: "A Vue port of convex-helpers/react: useQuery with a status object, makeUseQueryWithStatus, and usePaginatedQuery for the stream and paginator server helpers."
seo:
  title: "API reference: convex-helpers/client"
---

# convex-helpers/client

A Vue port of `convex-helpers/react`: [useQuery](#usequery) with a status object,
[makeUseQueryWithStatus](#makeusequerywithstatus), and [usePaginatedQuery](#usepaginatedquery) for the
`stream` and `paginator` server helpers.

## Variables

### useQuery

```ts
const useQuery: <Query>(query, ...queryArgs) => ComputedRef<
  | {
  status: "success";
  data: FunctionReturnType<Query>;
  error: undefined;
  isSuccess: true;
  isPending: false;
  isError: false;
}
  | {
  status: "pending";
  data: undefined;
  error: undefined;
  isSuccess: false;
  isPending: true;
  isError: false;
}
  | {
  status: "error";
  data: undefined;
  error: Error;
  isSuccess: false;
  isPending: false;
  isError: true;
}>;
```

Defined in: [src/runtime/convex-helpers/vue/index.ts:36](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/index.ts#L36)

Use in place of `useQuery` from `nuxt-convex-module` to fetch data, with a
status object the result refs carry.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-__typequery"></a> `Query` *extends* \| [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`\> \| [`FunctionReference_future`](/api-reference/reference/client#functionreference_future)\<`"query"`\> |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `query` | `Query` |
| ...`queryArgs` | [`OptionalRestArgsOrSkip`](/api-reference/reference/client#optionalrestargsorskip)\<`Query`\> |

#### Returns

`ComputedRef`\<
  \| \{
  `status`: `"success"`;
  `data`: [`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>;
  `error`: `undefined`;
  `isSuccess`: `true`;
  `isPending`: `false`;
  `isError`: `false`;
\}
  \| \{
  `status`: `"pending"`;
  `data`: `undefined`;
  `error`: `undefined`;
  `isSuccess`: `false`;
  `isPending`: `true`;
  `isError`: `false`;
\}
  \| \{
  `status`: `"error"`;
  `data`: `undefined`;
  `error`: `Error`;
  `isSuccess`: `false`;
  `isPending`: `false`;
  `isError`: `true`;
\}\>

#### Example

```ts
const result = useQuery(api.foo.bar, { arg: 'baz' })
// result.value.status, result.value.data, result.value.error, …
```

## Functions

### makeUseQueryWithStatus()

```ts
function makeUseQueryWithStatus(useQueriesHook): <Query>(query, ...queryArgs) => ComputedRef<
  | {
  status: "success";
  data: FunctionReturnType<Query>;
  error: undefined;
  isSuccess: true;
  isPending: false;
  isError: false;
}
  | {
  status: "pending";
  data: undefined;
  error: undefined;
  isSuccess: false;
  isPending: true;
  isError: false;
}
  | {
  status: "error";
  data: undefined;
  error: Error;
  isSuccess: false;
  isPending: false;
  isError: true;
}>;
```

Defined in: [src/runtime/convex-helpers/vue/index.ts:51](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/index.ts#L51)

Makes a `useQuery` with a status object on any `useQueries`, such as the
cached one of `nuxt-convex-module/convex-helpers/cache`:
```ts
import { useQueries } from 'nuxt-convex-module/convex-helpers/cache'
export const useQuery = makeUseQueryWithStatus(useQueries)
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `useQueriesHook` | (`queries`) => `ShallowRef`\<`Record`\<`string`, `any`\>\> | The `useQueries` to load the query on. |

#### Returns

A `useQuery` whose result is a ref of
`{ status, data, error, isSuccess, isPending, isError }`. It never throws.

\<`Query`\>(`query`, ...`queryArgs`) => `ComputedRef`\<
  \| \{
  `status`: `"success"`;
  `data`: [`FunctionReturnType`](/api-reference/reference/client#functionreturntype)\<`Query`\>;
  `error`: `undefined`;
  `isSuccess`: `true`;
  `isPending`: `false`;
  `isError`: `false`;
\}
  \| \{
  `status`: `"pending"`;
  `data`: `undefined`;
  `error`: `undefined`;
  `isSuccess`: `false`;
  `isPending`: `true`;
  `isError`: `false`;
\}
  \| \{
  `status`: `"error"`;
  `data`: `undefined`;
  `error`: `Error`;
  `isSuccess`: `false`;
  `isPending`: `false`;
  `isError`: `true`;
\}\>

***

### usePaginatedQuery()

```ts
function usePaginatedQuery<Query>(
   query, 
   args, 
   options
): UsePaginatedQueryReturnType<Query>;
```

Defined in: [src/runtime/convex-helpers/vue/index.ts:158](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/convex-helpers/vue/index.ts#L158)

This is a clone of the `usePaginatedQuery` composable from
`nuxt-convex-module` made for use with the `stream` and `paginator` helpers,
which don't automatically "grow" until you explicitly call `loadMore`.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-query"></a> `Query` *extends* [`PaginatedQueryReference`](/api-reference/reference/client#paginatedqueryreference) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `query` | `Query` | A FunctionReference to the public query function to run. |
| `args` | `MaybeRefOrGetter`\< \| `"skip"` \| [`PaginatedQueryArgs`](/api-reference/reference/client#paginatedqueryargs)\<`Query`\>\> | The arguments object for the query function, excluding the `paginationOpts` property, as a value, a ref or a getter. |
| `options` | \{ `initialNumItems`: `number`; \} | An object specifying the `initialNumItems` to be loaded in the first page. |
| `options.initialNumItems` | `number` | - |

#### Returns

[`UsePaginatedQueryReturnType`](/api-reference/reference/client#usepaginatedqueryreturntype)\<`Query`\>

The refs of the currently loaded items and the status of the
pagination, and a `loadMore` function.
