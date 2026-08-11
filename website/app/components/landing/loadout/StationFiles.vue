<script setup lang="ts">
import LoadoutStation from './LoadoutStation.vue'

// Files: progress ticks up, then a storage ID lands.
const uploadPct = ref<number | null>(null)
const storageId = ref('')
let uploadTimer: ReturnType<typeof setInterval> | undefined
function uploadDemo() {
  if (uploadTimer) return
  storageId.value = ''
  uploadPct.value = 0
  uploadTimer = setInterval(() => {
    if (uploadPct.value === null) return
    uploadPct.value = Math.min(uploadPct.value + 9, 100)
    if (uploadPct.value === 100) {
      clearInterval(uploadTimer)
      uploadTimer = undefined
      storageId.value = 'kg24d8mn7apf…9d1'
    }
  }, 70)
}
onUnmounted(() => {
  if (uploadTimer) clearInterval(uploadTimer)
})
</script>

<template>
  <LoadoutStation
    title="File storage"
    readout-label="progress · storageId"
  >
    <template #body>
      <ProseCode>useUpload</ProseCode> tracks progress and hands back a
      storage ID; <ProseCode>useStorageUrl</ProseCode> resolves it to a URL.
      <ProseCode>useUploadQueue</ProseCode> does the same for many files.
    </template>
    <template #code>
      <pre
        data-tokens
        class="well m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.76rem] leading-[1.8] whitespace-pre text-highlighted"
      ><code><span class="tk-k">const</span> { upload, progress } =
  <span class="tk-f">useUpload</span>(api.files.generateUploadUrl)
<span class="tk-k">const</span> storageId = <span class="tk-k">await</span> <span class="tk-f">upload</span>(file)</code></pre>
    </template>
    <template #readout>
      <!-- Upload progress — an inset track with an accent fill. -->
      <UProgress
        size="sm"
        class="w-full"
        :model-value="uploadPct ?? 0"
        :ui="{ base: 'bg-default shadow-(--inset-1)' }"
      />
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          @click="uploadDemo"
        >
          upload(file)
        </UButton>
        <span
          v-if="storageId"
          class="font-mono text-[0.66rem] font-semibold tracking-[0.08em] text-primary-700 dark:text-primary-300"
        >{{ storageId }}</span>
      </div>
    </template>
  </LoadoutStation>
</template>
