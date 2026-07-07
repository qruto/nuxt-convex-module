<script setup lang="ts">
import { api } from '#backend/api'

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

async function onPickOne(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) await upload(file)
  input.value = ''
}

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

function onPickMany(event: Event) {
  const input = event.target as HTMLInputElement
  enqueue(input.files)
  input.value = ''
}

function formatSize(size: number) {
  return size < 1024 ? `${size} B` : `${(size / 1024).toFixed(1)} KB`
}
</script>

<template>
  <PlaygroundDemo title="File storage — useUpload + useUploadQueue + useStorageUrl">
    <div class="files">
      <section>
        <h4 class="files-heading">
          Single upload — <code>useUpload</code>
        </h4>
        <div class="files-row">
          <input
            type="file"
            accept="image/*"
            class="files-input"
            :disabled="isUploading"
            aria-label="Upload one image"
            @change="onPickOne"
          >
          <progress
            v-if="isUploading"
            class="files-progress"
            :value="progress"
            max="1"
          />
        </div>
        <p
          v-if="error"
          class="files-error"
        >
          {{ error.message }}
        </p>
        <p
          v-else-if="storageId"
          class="files-note"
        >
          Stored as <code>{{ storageId }}</code> —
          <template v-if="latestUrl === undefined">
            resolving URL via <code>useStorageUrl</code>…
          </template>
          <a
            v-else-if="latestUrl"
            :href="latestUrl"
            target="_blank"
            rel="noopener"
          >served URL</a>
          <template v-else>
            file no longer exists
          </template>
        </p>
        <p
          v-else
          class="files-note"
        >
          No upload yet — <code>useStorageUrl</code> skips its query while the id is <code>null</code>.
        </p>
      </section>

      <section>
        <h4 class="files-heading">
          Batch upload — <code>useUploadQueue</code>
        </h4>
        <div class="files-row">
          <input
            type="file"
            accept="image/*"
            multiple
            class="files-input"
            aria-label="Upload several images"
            @change="onPickMany"
          >
          <progress
            v-if="queueBusy"
            class="files-progress"
            :value="queueProgress"
            max="1"
          />
          <button
            v-if="items.length > 0 && !queueBusy"
            class="files-button files-button-subtle"
            type="button"
            @click="clearQueue"
          >
            Clear list
          </button>
        </div>
        <ul
          v-if="items.length > 0"
          class="files-queue"
        >
          <li
            v-for="item in items"
            :key="item.id"
          >
            <span class="files-queue-name">{{ fileMeta(item.file).name }}</span>
            <span
              class="files-queue-status"
              :data-status="item.status"
            >
              {{ item.status === 'uploading' ? `${Math.round(item.progress * 100)}%` : item.status }}
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h4 class="files-heading">
          Gallery — live <code>useQuery</code> with resolved URLs
        </h4>
        <p
          v-if="files === undefined"
          class="files-note"
        >
          Loading files…
        </p>
        <p
          v-else-if="files.length === 0"
          class="files-note"
        >
          Nothing stored yet — upload a small image above.
        </p>
        <ul
          v-else
          class="files-gallery"
        >
          <li
            v-for="file in files"
            :key="file._id"
            class="files-card"
          >
            <img
              v-if="file.type.startsWith('image/') && file.url"
              :src="file.url"
              :alt="file.name"
              class="files-thumb"
            >
            <span
              v-else
              class="files-thumb files-thumb-generic"
            >📄</span>
            <span
              class="files-card-name"
              :title="file.name"
            >{{ file.name }}</span>
            <span class="files-card-size">{{ formatSize(file.size) }}</span>
            <button
              class="files-remove"
              type="button"
              :aria-label="`Remove ${file.name}`"
              @click="removeFile({ id: file._id })"
            >
              ×
            </button>
          </li>
        </ul>
      </section>
    </div>
  </PlaygroundDemo>
</template>

<style scoped>
.files {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.875rem;
}

.files-heading {
  margin: 0 0 0.5rem;
  font-size: 0.8125rem;
  font-weight: 600;
}

.files-row {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-wrap: wrap;
}

.files-input {
  font-size: 0.8125rem;
  max-width: 100%;
}

.files-progress {
  width: 8rem;
  height: 0.5rem;
}

.files-button {
  padding: 0.25rem 0.625rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  font-size: 0.75rem;
  cursor: pointer;
}

.files-button-subtle {
  color: var(--ui-text-muted);
}

.files-note {
  margin: 0.375rem 0 0;
  color: var(--ui-text-muted);
  font-size: 0.8125rem;
  overflow-wrap: anywhere;
}

.files-error {
  margin: 0.375rem 0 0;
  color: var(--ui-color-error-500, #ef4444);
  font-size: 0.8125rem;
}

.files-queue {
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  font-size: 0.8125rem;
}

.files-queue li {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}

.files-queue-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.files-queue-status {
  color: var(--ui-text-muted);
}

.files-queue-status[data-status='success'] {
  color: var(--ui-color-success-500, #22c55e);
}

.files-queue-status[data-status='error'] {
  color: var(--ui-color-error-500, #ef4444);
}

.files-gallery {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7.5rem, 1fr));
  gap: 0.625rem;
}

.files-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-muted);
}

.files-thumb {
  width: 100%;
  height: 4.5rem;
  object-fit: cover;
  border-radius: 0.25rem;
  background: var(--ui-bg);
}

.files-thumb-generic {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.files-card-name {
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.files-card-size {
  font-size: 0.6875rem;
  color: var(--ui-text-muted);
}

.files-remove {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  width: 1.25rem;
  height: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  background: var(--ui-bg-elevated);
  color: var(--ui-text-muted);
  font-size: 0.875rem;
  line-height: 1;
  cursor: pointer;
}
</style>
