<script setup lang="ts">
// The rendered readout — the active scene's result as UI while recording, the
// real query result once live. Both acts push the same row shape here, so the
// list markup exists once: `mine` is the visitor's own row (their handle live,
// `you` in the recording) and `pending` is the pre-commit beat the recording
// plays. The panel decides which act is on; this only renders rows.
interface ReadoutRow {
  key: string
  author: string
  body: string
  mine: boolean
  pending: boolean
}

defineProps<{
  rows: ReadoutRow[]
  /** Upload progress 0–100 while the file scene runs, else null. */
  progress: number | null
  /** What an empty well says — differs per act, and live differs when offline. */
  emptyLabel: string
}>()

// The badge is the author chip: accented for your own row, and dashed while
// the write is still in flight.
function badgeClass(row: ReadoutRow) {
  if (!row.mine) return 'border-accented text-muted'
  return row.pending
    ? 'border-dashed border-primary/60 text-primary-700 dark:text-primary-300'
    : 'border-primary/40 text-primary-700 dark:text-primary-300'
}
</script>

<template>
  <!-- Bottom-anchored like a log; bounded rather than fixed so a near-empty
       list has no dead void. -->
  <div class="concave-2 rounded-[14px] overflow-hidden px-4.5 py-3.5">
    <ul
      class="m-0 flex max-h-[6.6rem] min-h-[3.3rem] list-none flex-col justify-end gap-1.5 p-0 font-mono text-xs"
      aria-live="polite"
    >
      <!-- Keyed on the pending flag too (see the panel's row builder): the
           pending→committed flip remounts the row, so the commit re-lands
           with its own flash. -->
      <li
        v-for="row in rows"
        :key="row.key"
        class="-mx-1.5 flex min-w-0 items-baseline gap-2 rounded-[7px] px-1.5 text-default motion-safe:animate-row-land"
        :class="row.pending ? 'opacity-60' : undefined"
      >
        <span
          class="max-w-[14ch] flex-none truncate rounded-[5px] border px-1 py-px text-[0.6rem] font-bold tracking-[0.08em] uppercase"
          :class="badgeClass(row)"
        >{{ row.author }}</span>
        <span class="min-w-0 truncate">{{ row.body }}</span>
      </li>
      <li
        v-if="progress !== null"
        class="flex min-w-0 items-center gap-2"
      >
        <span class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-(--ui-border-accented)">
          <span
            class="block h-full rounded-full bg-primary transition-[width] duration-100 ease-out"
            :style="{ width: `${progress}%` }"
          /></span>
        <span class="flex-none text-[0.6rem] font-bold tracking-[0.08em] text-primary-700 tabular-nums dark:text-primary-300">{{ progress }}%</span>
      </li>
      <li
        v-if="!rows.length && progress === null"
        class="text-muted"
      >
        {{ emptyLabel }}
      </li>
    </ul>
  </div>
</template>
