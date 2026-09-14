<script setup lang="ts">
// `::checklist{id="…"}` — a list the reader can tick off and come back to.
// Ticks live in localStorage under the id; Reset clears them. Items are
// `:::checklist-item` blocks so their markdown keeps the prose styling.
import { ChecklistKey } from '../../utils/checklist'

const props = defineProps<{ id: string }>()

const STORAGE_PREFIX = 'nc-checklist-'
const key = `${STORAGE_PREFIX}${props.id}`

const checked = useState<boolean[]>(key, () => [])
const count = ref(0)

onMounted(() => {
  try {
    const stored = localStorage.getItem(key)
    if (stored) checked.value = JSON.parse(stored) as boolean[]
  }
  catch {
    // Private mode or bad JSON — start unticked.
  }
})

function persist() {
  try {
    localStorage.setItem(key, JSON.stringify(checked.value))
  }
  catch {
    // Storage blocked: ticks last for the session only.
  }
}

function register() {
  return count.value++
}

function toggle(index: number, value: boolean) {
  const next = [...checked.value]
  next[index] = value
  checked.value = next
  persist()
}

function reset() {
  checked.value = []
  persist()
}

const done = computed(() => checked.value.filter(Boolean).length)

provide(ChecklistKey, { checked, register, toggle })
</script>

<template>
  <div class="checklist my-5">
    <div class="mb-3 flex items-center justify-between gap-3">
      <span class="font-mono text-xs font-semibold tracking-[0.06em] text-toned">
        {{ done }} / {{ count }} done
      </span>
      <UButton
        label="Reset"
        icon="i-lucide-rotate-ccw"
        color="neutral"
        variant="soft"
        size="xs"
        :disabled="done === 0"
        @click="reset"
      />
    </div>
    <ol class="checklist-items m-0 list-none p-0">
      <slot />
    </ol>
  </div>
</template>
