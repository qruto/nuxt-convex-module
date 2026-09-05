<script setup lang="ts">
import type { UploadQueueItem } from 'nuxt-convex-module/client'
import { api } from '#convex/api'

// Many files at once: the queue runs two uploads in parallel and reports each
// one's own progress, saving every file as it lands rather than waiting for
// the batch.
const save = useMutation(api.files.save)

const {
  items,
  enqueue,
  isUploading,
  progress,
  clear,
} = useUploadQueue(api.files.generateUploadUrl, {
  concurrency: 2,
  onItemSuccess: async (id, item) => {
    await save({ storageId: id, ...fileMeta(item.file) })
  },
})

const picked = ref<File[]>([])
watch(picked, (files) => {
  if (!files?.length) return
  enqueue(files)
  picked.value = []
})

// A queued file reports either its live percentage or its settled status, in
// the colour that status earns.
function statusTone(status: UploadQueueItem['status']) {
  if (status === 'success') return 'text-success'
  if (status === 'error') return 'text-error'
  return 'text-muted'
}

function statusLabel(item: UploadQueueItem) {
  return item.status === 'uploading' ? `${Math.round(item.progress * 100)}%` : item.status
}
</script>

<template>
  <section>
    <h4 class="m-0 mb-2 text-[0.8125rem] font-semibold text-highlighted">
      Batch upload — <ProseCode>useUploadQueue</ProseCode>
    </h4>
    <div class="flex flex-wrap items-center gap-2.5">
      <UFileUpload
        v-model="picked"
        accept="image/*"
        multiple
        aria-label="Upload several images"
        class="min-h-24 w-full"
      />
      <UProgress
        v-if="isUploading"
        size="sm"
        class="w-32"
        :model-value="progress"
        :max="1"
        :ui="{ base: 'bg-default shadow-(--inset-shadow-1)' }"
      />
      <UButton
        v-if="items.length > 0 && !isUploading"
        type="button"
        size="xs"
        color="neutral"
        variant="outline"
        @click="clear"
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
          :class="statusTone(item.status)"
        >
          {{ statusLabel(item) }}
        </span>
      </li>
    </ul>
  </section>
</template>
