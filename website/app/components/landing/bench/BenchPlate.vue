<script setup lang="ts">
// The shared bench chrome: stamped label row, title, one line of prose, the
// snippet (a fenced code block passed down from content/index.md, so it
// renders through ProsePre — the site's one code-block treatment), and a
// readout well. Demo-specific widgets live in each plate's own template;
// the vocabulary shared BY every readout is a pair of utility strings
// repeated verbatim across plates (act rows: `flex flex-wrap items-center
// gap-3`; status chips: `font-mono text-[0.66rem] font-semibold
// tracking-[0.08em]`).
defineProps<{
  label: string
  stamp: string
  title: string
  readoutLabel: string
}>()
</script>

<template>
  <article class="convex bevel rounded-xl flex h-full flex-col gap-3 px-5 pt-4.5 pb-5">
    <header class="flex items-baseline justify-between gap-3 font-mono text-[0.6rem] font-semibold tracking-[0.14em]">
      <span class="concave-text flex-none text-toned">{{ label }}</span>
      <span class="concave-text min-w-0 truncate text-dimmed">{{ stamp }}</span>
    </header>
    <h3 class="m-0 font-display text-[1.02rem] font-semibold text-highlighted">
      {{ title }}
    </h3>
    <p class="m-0 text-[0.84rem] leading-relaxed text-toned">
      <slot name="body" />
    </p>
    <!-- The snippet keeps ProsePre's docs chrome; only sizing is tightened
         for the plate, and the copy button is chrome a demo doesn't need.
         Full-width plates (below lg the bench stacks) get docs-sized type;
         only the three-across desktop bench compacts it. -->
    <div class="[&>div]:my-0 [&_button]:hidden [&_pre]:overflow-x-auto [&_pre]:text-[0.85rem] [&_pre]:leading-[1.8] [&_pre]:whitespace-pre lg:[&_pre]:text-[0.72rem]">
      <slot name="code" />
    </div>
    <div class="concave-2 rounded-md mt-auto flex flex-col items-start gap-3 px-4 py-3.5">
      <span class="concave-text font-mono text-[0.58rem] font-semibold tracking-[0.14em] text-toned uppercase">{{ readoutLabel }}</span>
      <slot name="readout" />
    </div>
  </article>
</template>
