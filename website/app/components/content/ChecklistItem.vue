<script setup lang="ts">
import { ChecklistKey } from '../../utils/checklist'

const list = inject(ChecklistKey)
const index = list?.register() ?? 0
const model = computed({
  get: () => list?.checked.value[index] ?? false,
  set: value => list?.toggle(index, value),
})
</script>

<template>
  <li class="my-0 ps-0">
    <UCheckbox
      v-model="model"
      size="lg"
      class="my-2.5 items-start [&_[data-slot=label]]:leading-7"
    >
      <template #label>
        <span
          class="transition-colors"
          :class="model && 'text-muted'"
        ><slot /></span>
      </template>
    </UCheckbox>
  </li>
</template>
