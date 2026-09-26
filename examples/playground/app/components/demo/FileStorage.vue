<script setup lang="ts">
import { api } from '#convex/api'

const files = useQuery(api.files.list, {})
const save = useMutation(api.files.save)

// Asks the deployment for a one-time upload URL, uploads with progress, then
// hands the new storage id to `onSuccess`.
const { upload, isUploading, progress, error } = useUpload(api.files.generateUploadUrl, {
  onSuccess: async (storageId) => {
    await save({ storageId })
  },
})

// Draws a small image in the browser, so the upload needs no file of yours.
function sampleImage() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 240
  const context = canvas.getContext('2d')!
  const gradient = context.createLinearGradient(0, 0, 240, 240)
  gradient.addColorStop(0, `hsl(${15 + Math.random() * 30} 100% 60%)`)
  gradient.addColorStop(1, `hsl(${Math.random() * 360} 70% 30%)`)
  context.fillStyle = gradient
  context.fillRect(0, 0, 240, 240)
  context.fillStyle = '#fff'
  context.font = '600 34px "Kode Mono", monospace'
  context.textAlign = 'center'
  context.fillText(new Date().toLocaleTimeString([], { hour12: false }), 120, 132)
  return new Promise<Blob>(resolve => canvas.toBlob(blob => resolve(blob!), 'image/png'))
}

async function uploadSample() {
  await upload(await sampleImage())
}

function uploadPicked(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (file) upload(file)
}
</script>

<template>
  <DemoCard title="file storage" icon="upload" :apis="['useUpload()', '<ConvexImage>']" :error="error?.message">
    <div class="actions">
      <button type="button" class="button convex-accent" :disabled="isUploading" @click="uploadSample">
        Upload a sample image
      </button>
      <label class="button">
        Choose…
        <input type="file" accept="image/*" :disabled="isUploading" @change="uploadPicked">
      </label>
    </div>

    <div class="progress concave" role="progressbar" :aria-valuenow="Math.round(progress * 100)" aria-valuemin="0" aria-valuemax="100">
      <span :style="{ width: `${progress * 100}%` }" />
    </div>

    <ul class="gallery">
      <li v-for="file in files" :key="file._id" class="concave">
        <!-- Resolves the storage id to a served URL, live: it follows the file if it is replaced or deleted. -->
        <ConvexImage :get-url="api.files.getUrl" :storage-id="file.storageId" alt="" />
      </li>
      <li v-for="index in Math.max(0, 6 - (files?.length ?? 0))" :key="`empty-${index}`" class="concave" />
    </ul>
  </DemoCard>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 0.5rem;
}

.actions .convex-accent {
  flex: 1;
}

input[type="file"] {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
}

.button:has(input:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.progress {
  height: 0.5rem;
  overflow: hidden;
  border-radius: 999px;
}

.progress span {
  display: block;
  height: 100%;
  background: var(--accent-gradient);
  transition: width 150ms;
}

.gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.gallery li {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: var(--radius-recess);
}

/* An image covers the cut's own shading, so the walls are laid over it. */
.gallery li:has(img)::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  box-shadow: var(--concave-shadow);
  pointer-events: none;
}

.gallery img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
