---
navigation: false
description: "A Vue port of @convex-dev/rate-limiter/react: useRateLimit — generated TypeScript API reference for nuxt-convex-module/rate-limiter/client."
seo:
  title: "API reference: rate-limiter/client"
---

# rate-limiter/client

A Vue port of `@convex-dev/rate-limiter/react`: [useRateLimit](#useratelimit).

## Type Aliases

### RateLimitConfig

```ts
type RateLimitConfig = 
  | TokenBucketConfig & ShardedConfig
  | TokenBucketConfig & AsyncConfig
  | FixedWindowConfig & ShardedConfig
  | FixedWindowConfig & AsyncConfig;
```

Defined in: node\_modules/@convex-dev/rate-limiter/dist/shared.d.ts:116

One of the supported rate limits.
See tokenBucketValidator and fixedWindowValidator for more
information.

***

### RateLimitError

```ts
type RateLimitError = {
  kind: "RateLimited";
  name: string;
  retryAfter: number;
};
```

Defined in: node\_modules/@convex-dev/rate-limiter/dist/shared.d.ts:338

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="kind"></a> `kind` | `"RateLimited"` | node\_modules/@convex-dev/rate-limiter/dist/shared.d.ts:339 |
| <a id="name"></a> `name` | `string` | node\_modules/@convex-dev/rate-limiter/dist/shared.d.ts:340 |
| <a id="retryafter"></a> `retryAfter` | `number` | node\_modules/@convex-dev/rate-limiter/dist/shared.d.ts:341 |

***

### UseRateLimitOptions

```ts
type UseRateLimitOptions = {
  name?: string;
  key?: string;
  count?: number;
  sampleShards?: number;
  getServerTimeMutation?: GetServerTimeMutation;
  config?: RateLimitConfig;
};
```

Defined in: [src/runtime/rate-limiter/vue/index.ts:48](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L48)

Options of [useRateLimit](#useratelimit).

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="name-1"></a> `name?` | `string` | [src/runtime/rate-limiter/vue/index.ts:49](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L49) |
| <a id="key"></a> `key?` | `string` | [src/runtime/rate-limiter/vue/index.ts:50](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L50) |
| <a id="count"></a> `count?` | `number` | [src/runtime/rate-limiter/vue/index.ts:51](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L51) |
| <a id="sampleshards"></a> `sampleShards?` | `number` | [src/runtime/rate-limiter/vue/index.ts:52](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L52) |
| <a id="getservertimemutation"></a> `getServerTimeMutation?` | [`GetServerTimeMutation`](#getservertimemutation-1) | [src/runtime/rate-limiter/vue/index.ts:53](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L53) |
| <a id="config"></a> `config?` | [`RateLimitConfig`](#ratelimitconfig) | [src/runtime/rate-limiter/vue/index.ts:54](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L54) |

***

### GetRateLimitValueQuery

```ts
type GetRateLimitValueQuery = FunctionReference<"query", "public", GetValueArgs, GetValueReturns>;
```

Defined in: [src/runtime/rate-limiter/vue/index.ts:62](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L62)

The `getRateLimit` query that `rateLimiter.hookAPI()` creates.

***

### GetServerTimeMutation

```ts
type GetServerTimeMutation = FunctionReference<"mutation", "public", Record<string, never>, number>;
```

Defined in: [src/runtime/rate-limiter/vue/index.ts:74](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L74)

The `getServerTime` mutation that `rateLimiter.hookAPI()` creates.

## Functions

### isRateLimitError()

```ts
function isRateLimitError(error): error is { data: RateLimitError };
```

Defined in: node\_modules/@convex-dev/rate-limiter/dist/client/index.d.ts:11

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `error` | `unknown` |

#### Returns

`error is { data: RateLimitError }`

***

### useRateLimit()

```ts
function useRateLimit(getRateLimitValueQuery, opts?): {
  status: ComputedRef<
     | {
     ok: true;
     retryAt: undefined;
   }
     | {
     ok: false;
     retryAt: number;
   }
    | undefined>;
  check: (ts?, count?) => RateLimitCheck | undefined;
};
```

Defined in: [src/runtime/rate-limiter/vue/index.ts:123](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L123)

A composable for using rate limits in Vue components.
This composable provides information about the current rate limit status,
including the ability to check if an action is allowed and when it can be retried.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `getRateLimitValueQuery` | [`GetRateLimitValueQuery`](#getratelimitvaluequery) | The query function returned by rateLimiter.hookAPI().getRateLimit |
| `opts?` | `MaybeRefOrGetter`\<[`UseRateLimitOptions`](#useratelimitoptions) \| `undefined`\> | The options, as a value, a ref or a getter. `getServerTimeMutation` is a mutation that returns the current server time (Date.now()), and `sampleShards` the number of shards to sample (default: 1). |

#### Returns

```ts
{
  status: ComputedRef<
     | {
     ok: true;
     retryAt: undefined;
   }
     | {
     ok: false;
     retryAt: number;
   }
    | undefined>;
  check: (ts?, count?) => RateLimitCheck | undefined;
}
```

An object containing:
  - status: A ref of the current status of the rate limit (ok, retryAt)
    If the rate limit value is below the count (or 0 if unspecified), the
    retryAt will be set to the time when the client can retry.
  - check: A function that returns the current value of the rate limit

| Name | Type | Defined in |
| ------ | ------ | ------ |
| `status` | `ComputedRef`\< \| \{ `ok`: `true`; `retryAt`: `undefined`; \} \| \{ `ok`: `false`; `retryAt`: `number`; \} \| `undefined`\> | [src/runtime/rate-limiter/vue/index.ts:127](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L127) |
| `check()` | (`ts?`, `count?`) => `RateLimitCheck` \| `undefined` | [src/runtime/rate-limiter/vue/index.ts:128](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/rate-limiter/vue/index.ts#L128) |

#### Example

```vue
<script setup lang="ts">
import { api } from '~~/convex/_generated/api'

const { status, check } = useRateLimit(api.example.getRateLimit, {
  getServerTimeMutation: api.example.getServerTime,
  count: 1,
})
</script>

<template>
  <button :disabled="status?.ok === false">Send</button>
</template>
```
