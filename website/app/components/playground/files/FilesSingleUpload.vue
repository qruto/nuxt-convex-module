<script setup lang="ts">
import { api } from '#convex/api'

// One file at a time: `useUpload` for the transfer with reactive progress and
// error state, then `useStorageUrl` to resolve a served URL from the storage
// id it produces. The pair is the point — the id is the only thing worth
// storing, and the URL is derived from it on demand.
const save = useMutation(api.files.save)

const { upload, isUploading, progress, error, storageId } = useUpload(
  api.files.generateUploadUrl,
  {
    onSuccess: async (id, file) => {
      await save({ storageId: id, ...fileMeta(file) })
    },
  },
)

// UFileUpload owns the picker; the v-model watch hands the file to `upload`
// and clears the model so the same file can be picked again.
const picked = ref<File | null>(null)
watch(picked, async (file) => {
  if (!file) return
  await upload(file)
  picked.value = null
})

// `useStorageUrl` skips the query while `storageId` is still null, so it is
// safe to bind before anything has been uploaded.
const latestUrl = useStorageUrl(api.files.url, storageId)
</script>

<template>
  <section>
    <h4 class="m-0 mb-2 text-[0.8125rem] font-semibold text-highlighted">
      Single upload — <ProseCode>useUpload</ProseCode>
    </h4>
    <div class="flex flex-wrap items-center gap-2.5">
      <UFileUpload
        v-model="picked"
        accept="image/*"
        variant="button"
        :disabled="isUploading"
        aria-label="Upload one image"
      />
      <UProgress
        v-if="isUploading"
        size="sm"
        class="w-32"
        :model-value="progress"
        :max="1"
        :ui="{ base: 'bg-default shadow-(--inset-shadow-1)' }"
      />
    </div>
    <p
      v-if="error"
      class="m-0 mt-1.5 text-xs text-error"
    >
      {{ error.message }}
    </p>
    <p
      v-else-if="storageId"
      class="m-0 mt-1.5 wrap-anywhere text-xs text-muted"
    >
      Stored as <ProseCode>{{ storageId }}</ProseCode> —
      <template v-if="latestUrl === undefined">
        resolving URL via <ProseCode>useStorageUrl</ProseCode>…
      </template>
      <a
        v-else-if="latestUrl"
        :href="latestUrl"
        target="_blank"
        rel="noopener"
        class="text-primary underline underline-offset-2"
      >served URL</a>
      <template v-else>
        file no longer exists
      </template>
    </p>
    <p
      v-else
      class="m-0 mt-1.5 text-xs text-muted"
    >
      No upload yet — <ProseCode>useStorageUrl</ProseCode> skips its query while the id is <ProseCode>null</ProseCode>.
    </p>
  </section>
</template>
