<script setup lang="ts">
// One simulated client in the sync walkthrough. Both panes render the SAME
// rows array — that's the section's whole claim (one table, every client);
// the pane only decides which author chip reads as "self". The send chip is
// the manual control that keeps working after the recording stops.
export interface OperationRow {
  id: number
  author: string
  body: string
}

defineProps<{
  label: string
  self: string
  rows: OperationRow[]
  busy: boolean
}>()

defineEmits<{ send: [] }>()

const VISIBLE = 5
</script>

<template>
  <article class="plate flex h-full min-w-0 flex-col gap-2.5 px-4 pt-3.5 pb-4 [--plate-radius:18px]">
    <header class="flex items-center justify-between gap-3 font-mono text-[0.6rem] font-semibold tracking-[0.14em]">
      <span class="etched text-toned">{{ label }}</span>
      <span class="etched inline-flex items-center gap-1.5 text-dimmed"><i
        aria-hidden="true"
        class="size-1.5 rounded-full bg-success shadow-(--glow-success)"
      />SUB</span>
    </header>
    <div class="well flex-1 overflow-hidden px-3.5 py-3 [--well-radius:12px]">
      <ul
        class="m-0 flex h-full max-h-[8.4rem] min-h-[6rem] list-none flex-col justify-end gap-1.5 p-0 font-mono text-xs"
        aria-live="polite"
      >
        <li
          v-for="row in rows.slice(-VISIBLE)"
          :key="row.id"
          class="-mx-1.5 flex min-w-0 items-baseline gap-2 rounded-[7px] px-1.5 text-default motion-safe:animate-row-land"
        >
          <span
            class="max-w-[14ch] flex-none truncate rounded-[5px] border px-1 py-px text-[0.6rem] font-bold tracking-[0.08em] uppercase"
            :class="row.author === self
              ? 'border-primary/40 text-primary-700 dark:text-primary-300'
              : 'border-accented text-muted'"
          >{{ row.author }}</span>
          <span class="min-w-0 truncate">{{ row.body }}</span>
        </li>
        <li
          v-if="!rows.length"
          class="text-muted"
        >
          …
        </li>
      </ul>
    </div>
    <UButton
      size="xs"
      color="neutral"
      variant="ghost"
      class="self-end font-mono text-[0.56rem] font-bold tracking-[0.14em] text-dimmed"
      :disabled="busy"
      @click="$emit('send')"
    >
      SEND <span aria-hidden="true">→</span>
    </UButton>
  </article>
</template>
