<script setup lang="ts">
// One simulated client in the sync walkthrough. Both panes render the SAME
// rows array — that's the section's whole claim (one table, every client);
// the pane only decides which author chip reads as "self". The send chip is
// the manual control that keeps working after the recording stops.
//
// Two signals come down from the script and are the pane's only tie to the
// operation block under the stage: `subscribed` lights the SUB lamp (dead
// until step 01 has landed the table, so the lamp is a fact and not a
// sticker), and `active` lights the label while the step in progress is
// this client's — the same chip the step names, on the pane it names.
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
  subscribed: boolean
  active: boolean
}>()

defineEmits<{ send: [] }>()

const VISIBLE = 5
</script>

<template>
  <article class="convex bevel rounded-card flex h-full min-w-0 flex-col gap-2.5 px-4 pt-3.5 pb-4">
    <header class="flex items-center justify-between gap-3 font-mono text-[0.6rem] font-semibold tracking-[0.14em]">
      <span
        class="concave-text transition-colors duration-300"
        :class="active ? 'text-primary-700 dark:text-primary-300' : 'text-toned'"
      >{{ label }}</span>
      <span
        class="concave-text inline-flex items-center gap-1.5 transition-colors duration-300"
        :class="subscribed ? 'text-dimmed' : 'text-dimmed/60'"
      ><i
        aria-hidden="true"
        class="size-1.5 rounded-full transition-[background,box-shadow] duration-300"
        :class="subscribed ? 'bg-success shadow-(--glow-success)' : 'bg-(--ui-text-dimmed)'"
      />SUB</span>
    </header>
    <!-- The row well. The lip is NOT decoration: `concave-2` paints the tray
         with shadow alone, and against these panes' own ground the cut read
         as a smudge with no edge to it — the code plate beside it has one
         (ProsePre draws a border), so the two halves of the same section were
         showing the same recess two different ways. --recess-edge is the
         hero plate's well and rail edge, so all three wells on the page are
         now cut to one depth. -->
    <div class="concave-2 rounded-well flex-1 overflow-hidden border border-(--recess-edge) px-3.5 py-3">
      <ul
        class="m-0 flex h-full max-h-[8.4rem] min-h-[6rem] list-none flex-col justify-end gap-1.5 p-0 font-mono text-xs"
        aria-live="polite"
      >
        <li
          v-for="row in rows.slice(-VISIBLE)"
          :key="row.id"
          class="-mx-1.5 flex min-w-0 items-baseline gap-2 rounded-strip px-1.5 text-default motion-safe:animate-row-land"
        >
          <span
            class="max-w-[14ch] flex-none truncate rounded-chip border px-1 py-px text-[0.6rem] font-bold tracking-[0.08em] uppercase"
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
