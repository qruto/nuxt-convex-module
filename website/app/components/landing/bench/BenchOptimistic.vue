<script setup lang="ts">
import BenchPlate from './BenchPlate.vue'

// Optimistic updates: the write renders as a ghost row the instant it's
// dispatched, then flips solid when the (simulated) server commits.
const props = defineProps<{ initialDelay?: number }>()

interface Row {
  id: number
  body: string
  pending: boolean
}

let seq = 3
const rows = ref<Row[]>([
  { id: 1, body: 'write #1', pending: false },
  { id: 2, body: 'write #2', pending: false },
])
const commitMs = ref<number | null>(null)

function beginWrite() {
  const id = seq++
  rows.value = [...rows.value.slice(-2), { id, body: `write #${id}`, pending: true }]
  commitMs.value = null
  return id
}

function commitWrite(id: number) {
  rows.value = rows.value.map(r => (r.id === id ? { ...r, pending: false } : r))
  // Deterministic per row, believable as a round trip.
  commitMs.value = 40 + (id * 7) % 21
}

const plate = ref<{ $el: HTMLElement } | null>(null)
const root = computed(() => plate.value?.$el ?? null)
useDemoScript(root, async ({ wait }) => {
  await wait(500)
  const id = beginWrite()
  await wait(650)
  commitWrite(id)
}, {
  loop: true,
  initialDelay: props.initialDelay,
  reducedMotion: () => {
    rows.value = [...rows.value, { id: seq++, body: 'write #3', pending: false }]
    commitMs.value = 47
  },
})

// The manual control drives the same refs the recording does.
let manualTimer: ReturnType<typeof setTimeout> | undefined
function sendDemo() {
  const id = beginWrite()
  clearTimeout(manualTimer)
  manualTimer = setTimeout(() => commitWrite(id), 650)
}
onUnmounted(() => clearTimeout(manualTimer))
</script>

<template>
  <BenchPlate
    ref="plate"
    label="OPTIMISTIC"
    stamp=".withOptimisticUpdate"
    title="Commit-speed UI"
    readout-label="local · committed"
  >
    <template #body>
      <code class="font-mono text-[0.92em] text-highlighted">.withOptimisticUpdate</code>
      renders the write immediately and reconciles when the server commits.
    </template>
    <template #code>
      <slot name="code" />
    </template>
    <template #readout>
      <ul
        class="m-0 flex min-h-[4.6rem] w-full list-none flex-col justify-end gap-1.5 p-0 font-mono text-xs"
        aria-live="polite"
      >
        <li
          v-for="row in rows"
          :key="row.id"
          class="flex min-w-0 items-baseline gap-2 motion-safe:animate-fade-up [animation-duration:240ms]"
          :class="row.pending ? 'text-dimmed' : 'text-default'"
        >
          <span
            class="flex-none rounded-[5px] border px-1 py-px text-[0.6rem] font-bold tracking-[0.08em]"
            :class="row.pending
              ? 'border-dashed border-primary/40 text-primary-700 dark:text-primary-300'
              : 'border-accented text-muted'"
          >{{ row.pending ? 'LOCAL' : 'DB' }}</span>
          <span class="min-w-0 truncate">{{ row.body }}</span>
        </li>
      </ul>
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          color="neutral"
          variant="outline"
          size="sm"
          @click="sendDemo"
        >
          send({ body })
        </UButton>
        <span
          v-if="commitMs !== null"
          class="font-mono text-[0.66rem] font-semibold tracking-[0.08em] text-primary-700 dark:text-primary-300"
        >COMMIT {{ commitMs }} MS</span>
      </div>
    </template>
  </BenchPlate>
</template>
