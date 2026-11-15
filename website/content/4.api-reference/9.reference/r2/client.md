---
navigation: false
description: "A Vue port of @convex-dev/r2/vue: useUploadFile, on the module's own client rather than the community convex-vue that upstream's entry imports."
seo:
  title: "API reference: r2/client"
---

# r2/client

A Vue port of `@convex-dev/r2/vue`: [useUploadFile](#useuploadfile), on the module's
own client rather than the community `convex-vue` that upstream's entry
imports.

## Functions

### useUploadFile()

```ts
function useUploadFile(api): (file, options?) => Promise<string>;
```

Defined in: [src/runtime/r2/vue/index.ts:39](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/r2/vue/index.ts#L39)

A composable that allows you to upload a file to R2.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `api` | `Pick`\<`ClientApi`, `"generateUploadUrl"` \| `"syncMetadata"`\> | The client API object from the R2 component, including at least `generateUploadUrl` and `syncMetadata`. |

#### Returns

A function that uploads a file to R2.

(`file`, `options?`) => `Promise`\<`string`\>

#### Example

```vue
<script setup lang="ts">
import { api } from '~~/convex/_generated/api'

const uploadFile = useUploadFile(api.example)

async function onChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) await uploadFile(file)
}
</script>

<template>
  <input type="file" @change="onChange">
</template>
```
