---
navigation: false
description: "A Vue port of @convex-dev/persistent-text-streaming's useStream: useStream. It follows the package's Svelte entry, which reads the request options when a…"
seo:
  title: "API reference: persistent-text-streaming/client"
---

# persistent-text-streaming/client

A Vue port of `@convex-dev/persistent-text-streaming`'s `useStream`:
[useStream](#usestream). It follows the package's Svelte entry, which reads the
request options when a stream starts.

## Functions

### useStream()

```ts
function useStream(
   getPersistentBody, 
   streamUrl, 
   driven, 
   streamId, 
   opts?
): ComputedRef<StreamBody>;
```

Defined in: [src/runtime/persistent-text-streaming/vue/index.ts:56](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/persistent-text-streaming/vue/index.ts#L56)

Vue version of the React `useStream` hook. Reactive inputs are values, refs
or getters.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `getPersistentBody` | [`FunctionReference`](/api-reference/reference/client#functionreference)\<`"query"`, `"public"`, \{ `streamId`: `string`; \}, `StreamBody`\> | A query function reference that returns the body of a stream using the component's `getStreamBody` method. |
| `streamUrl` | `URL` | The URL of the http action that will kick off the stream generation and stream the result back to the client using the component's `stream` method. |
| `driven` | `MaybeRefOrGetter`\<`boolean`\> | Whether this particular session is driving the stream. True if this is the client session that first created the stream using the component's `createStream` method. If you're simply reloading an existing stream, false. |
| `streamId` | `MaybeRefOrGetter`\<`StreamId` \| `undefined`\> | The ID of the stream. While it is undefined, the text is empty and the status is `pending`. |
| `opts?` | `MaybeRefOrGetter`\< \| \{ `authToken?`: `string` \| `null`; `headers?`: `Record`\<`string`, `string`\>; \} \| `undefined`\> | Request options. They are read when a stream starts, so a changed auth token applies to the next stream without aborting the current one. |

#### Returns

`ComputedRef`\<`StreamBody`\>

A ref of the `text` and `status` of the stream.

#### Example

```vue
<script setup lang="ts">
import type { StreamId } from '@convex-dev/persistent-text-streaming'
import { api } from '~~/convex/_generated/api'

const props = defineProps<{ streamId: string, driven: boolean }>()
const stream = useStream(
  api.chat.getChatBody,
  new URL(`${useRuntimeConfig().public.convex.siteUrl}/chat-stream`),
  () => props.driven,
  () => props.streamId as StreamId,
)
</script>

<template>
  <p>{{ stream.text }}</p>
</template>
```
