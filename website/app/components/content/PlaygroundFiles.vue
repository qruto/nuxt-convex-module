<script setup lang="ts">
import { api } from '#convex/api'

// File storage: `useUpload` for a single file, `useUploadQueue` for batches,
// `useStorageUrl` to resolve a served URL from a (possibly null) storage id.
const files = useQuery(api.files.list, {})
const save = useMutation(api.files.save)
const removeFile = useMutation(api.files.remove)

function fileMeta(file: Blob) {
  const named = file instanceof File ? file : undefined
  return { name: named?.name ?? 'blob', type: file.type, size: file.size }
}

// 1) Single upload with reactive progress/error state.
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
const pickedOne = ref<File | null>(null)
watch(pickedOne, async (file) => {
  if (!file) return
  await upload(file)
  pickedOne.value = null
})

// 3) `useStorageUrl` skips the query while `storageId` is still null, so it is
// safe to bind before anything has been uploaded.
const latestUrl = useStorageUrl(api.files.url, storageId)

// 2) Multi-file queue: two uploads at a time, each saved as it finishes.
const {
  items,
  enqueue,
  isUploading: queueBusy,
  progress: queueProgress,
  clear: clearQueue,
} = useUploadQueue(api.files.generateUploadUrl, {
  concurrency: 2,
  onItemSuccess: async (id, item) => {
    await save({ storageId: id, ...fileMeta(item.file) })
  },
})

const pickedMany = ref<File[]>([])
watch(pickedMany, (picked) => {
  if (!picked?.length) return
  enqueue(picked)
  pickedMany.value = []
})

function formatSize(size: number) {
  return size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`
}
</script>

<template>
  <PlaygroundDemo title="File storage — useUpload + useUploadQueue + useStorageUrl">
    <div class="flex flex-col gap-4 text-sm">
      <section>
        <h4 class="m-0 mb-2 text-[0.8125rem] font-semibold text-highlighted">
          Single upload — <ProseCode>useUpload</ProseCode>
        </h4>
        <div class="flex flex-wrap items-center gap-2.5">
          <UFileUpload
            v-model="pickedOne"
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

      <section>
        <h4 class="m-0 mb-2 text-[0.8125rem] font-semibold text-highlighted">
          Batch upload — <ProseCode>useUploadQueue</ProseCode>
        </h4>
        <div class="flex flex-wrap items-center gap-2.5">
          <UFileUpload
            v-model="pickedMany"
            accept="image/*"
            multiple
            aria-label="Upload several images"
            class="min-h-24 w-full"
          />
          <UProgress
            v-if="queueBusy"
            size="sm"
            class="w-32"
            :model-value="queueProgress"
            :max="1"
            :ui="{ base: 'bg-default shadow-(--inset-shadow-1)' }"
          />
          <UButton
            v-if="items.length > 0 && !queueBusy"
            type="button"
            size="xs"
            color="neutral"
            variant="outline"
            @click="clearQueue"
          >
            Clear list
          </UButton>
        </div>
        <ul
          v-if="items.length > 0"
          class="m-0 mt-2 flex list-none flex-col gap-1 p-0 text-xs"
        >
          <li
            v-for="item in items"
            :key="item.id"
            class="flex justify-between gap-3"
          >
            <span class="truncate text-default">{{ fileMeta(item.file).name }}</span>
            <span
              class="flex-none tabular-nums"
              :class="item.status === 'success' ? 'text-success'
                : item.status === 'error' ? 'text-error' : 'text-muted'"
            >
              {{ item.status === 'uploading' ? `${Math.round(item.progress * 100)}%` : item.status }}
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h4 class="m-0 mb-2 text-[0.8125rem] font-semibold text-highlighted">
          Gallery — live <ProseCode>useQuery</ProseCode> with resolved URLs
        </h4>
        <p
          v-if="files === undefined"
          class="m-0 text-xs text-muted"
        >
          Loading files…
        </p>
        <p
          v-else-if="files.length === 0"
          class="m-0 text-xs text-muted"
        >
          Nothing stored yet — upload a small image above.
        </p>
        <ul
          v-else
          class="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-2.5 p-0"
        >
          <li
            v-for="file in files"
            :key="file._id"
            class="convex-0 rounded-[10px] relative flex flex-col gap-1 p-2"
          >
            <img
              v-if="file.type.startsWith('image/') && file.url"
              :src="file.url"
              :alt="file.name"
              class="h-18 w-full rounded-sm bg-default object-cover"
            >
            <span
              v-else
              class="flex h-18 w-full items-center justify-center rounded-sm bg-default text-2xl"
            >📄</span>
            <span
              class="truncate text-xs text-default"
              :title="file.name"
            >{{ file.name }}</span>
            <span class="text-[0.6875rem] text-muted">{{ formatSize(file.size) }}</span>
            <UButton
              icon="i-lucide-x"
              size="xs"
              color="neutral"
              variant="outline"
              square
              class="absolute top-1 right-1"
              :aria-label="`Remove ${file.name}`"
              @click="removeFile({ id: file._id })"
            />
          </li>
        </ul>
      </section>
    </div>
  </PlaygroundDemo>
</template>
