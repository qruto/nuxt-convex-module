---
navigation: false
description: "A Vue port of @convex-dev/presence/react: usePresence — generated TypeScript API reference for nuxt-convex-module/presence/client."
seo:
  title: "API reference: presence/client"
---

# presence/client

A Vue port of `@convex-dev/presence/react`: [usePresence](#usepresence).

## Interfaces

### PresenceAPI

Defined in: [src/runtime/presence/vue/index.ts:46](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L46)

The presence functions of a Convex app, usually `api.presence`.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="list"></a> `list` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`, `"public"`, \{ `roomToken`: `string`; \}, [`PresenceState`](#presencestate)[]\> | [src/runtime/presence/vue/index.ts:47](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L47) |
| <a id="heartbeat"></a> `heartbeat` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `roomId`: `string`; `userId`: `string`; `sessionId`: `string`; `interval`: `number`; \}, \{ `roomToken`: `string`; `sessionToken`: `string`; \}\> | [src/runtime/presence/vue/index.ts:53](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L53) |
| <a id="disconnect"></a> `disconnect` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"mutation"`, `"public"`, \{ `sessionToken`: `string`; \}\> | [src/runtime/presence/vue/index.ts:59](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L59) |

***

### PresenceState

Defined in: [src/runtime/presence/vue/index.ts:67](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L67)

Presence state for a user within the given room.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="userid"></a> `userId` | `string` | [src/runtime/presence/vue/index.ts:68](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L68) |
| <a id="online"></a> `online` | `boolean` | [src/runtime/presence/vue/index.ts:69](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L69) |
| <a id="lastdisconnected"></a> `lastDisconnected` | `number` | [src/runtime/presence/vue/index.ts:70](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L70) |
| <a id="data"></a> `data?` | `unknown` | [src/runtime/presence/vue/index.ts:71](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L71) |
| <a id="name"></a> `name?` | `string` | [src/runtime/presence/vue/index.ts:74](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L74) |
| <a id="image"></a> `image?` | `string` | [src/runtime/presence/vue/index.ts:75](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L75) |

## Functions

### usePresence()

```ts
function usePresence(
   presence, 
   roomId, 
   userId, 
   interval?, 
   convexUrl?
): ComputedRef<PresenceState[] | undefined>;
```

Defined in: [src/runtime/presence/vue/index.ts:108](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/index.ts#L108)

Vue composable for maintaining presence state.

This composable is designed to be efficient and only sends a message to
users whenever a member joins or leaves the room, not on every heartbeat.

Use of this composable requires passing in a reference to the Convex
presence component defined in your Convex app.

#### Parameters

| Parameter | Type | Default value | Description |
| ------ | ------ | ------ | ------ |
| `presence` | [`PresenceAPI`](#presenceapi) | `undefined` | The presence functions of the app, usually `api.presence`. |
| `roomId` | `MaybeRefOrGetter`\<`string`\> | `undefined` | The room, as a value, a ref or a getter. |
| `userId` | `MaybeRefOrGetter`\<`string`\> | `undefined` | The user, as a value, a ref or a getter. |
| `interval?` | `MaybeRefOrGetter`\<`number` \| `undefined`\> | `10000` | Milliseconds between heartbeats. Default 10000, also when a ref or getter gives `undefined`. |
| `convexUrl?` | `MaybeRefOrGetter`\<`string` \| `undefined`\> | `undefined` | The deployment URL the unload beacon goes to. Defaults to the client's. |

#### Returns

`ComputedRef`\<[`PresenceState`](#presencestate)[] \| `undefined`\>

A ref of the room's users, the current user first, or `undefined` while loading.

#### Example

```vue
<script setup lang="ts">
import { api } from '~~/convex/_generated/api'

const presenceState = usePresence(api.presence, 'my-chat-room', name)
</script>

<template>
  <FacePile :presence-state="presenceState ?? []" />
</template>
```

## References

### default

Renames and re-exports [usePresence](#usepresence)
