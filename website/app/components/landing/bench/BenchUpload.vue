<script setup lang="ts">
import BenchPlate from './BenchPlate.vue'

// File storage: progress ticks up an inset track, then a storage ID lands.
const props = defineProps<{ initialDelay?: number }>()

const STORAGE_ID = 'kg24d8mn7apf…9d1'
const uploadPct = ref<number | null>(null)
const storageId = ref('')

const plate = ref<{ $el: HTMLElement } | null>(null)
const root = computed(() => plate.value?.$el ?? null)
useDemoScript(root, async ({ wait }) => {
  await wait(400)
  storageId.value = ''
  uploadPct.value = 0
  while ((uploadPct.value ?? 0) < 100) {
    await wait(70)
    uploadPct.value = Math.min((uploadPct.value ?? 0) + 9, 100)
  }
  storageId.value = STORAGE_ID
  await wait(2000)
}, {
  loop: true,
  initialDelay: props.initialDelay,
  reducedMotion: () => {
    uploadPct.value = 100
    storageId.value = STORAGE_ID
  },
})

// The manual control drives the same refs the recording does.
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
      storageId.value = STORAGE_ID
    }
  }, 70)
}
onUnmounted(() => {
  if (uploadTimer) clearInterval(uploadTimer)
})
</script>

<template>
  <BenchPlate
    ref="plate"
    label="FILES"
    stamp="useUpload"
    title="File storage"
    readout-label="progress · storageId"
  >
    <template #body>
      <code class="font-mono text-[0.92em] text-highlighted">useUpload</code>
      tracks progress and hands back a storage ID;
      <code class="font-mono text-[0.92em] text-highlighted">useStorageUrl</code>
      resolves it to a URL.
    </template>
    <template #code>
      <slot name="code" />
    </template>
    <template #readout>
      <!-- Upload progress — an inset track with an accent fill. -->
      <UProgress
        size="sm"
        class="w-full"
        :model-value="uploadPct ?? 0"
        :ui="{ base: 'bg-default shadow-(--inset-shadow-1)' }"
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
  </BenchPlate>
</template>
