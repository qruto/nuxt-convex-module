<script setup lang="ts">
// The shared station chrome: title, body prose, then the demo pair — the
// station's hand-authored source (a `<pre>` the station brings, so Vue
// preserves its whitespace) beside a readout well. Station-specific widgets
// live in each station's own template; the vocabulary shared BY every
// readout is a pair of utility strings repeated verbatim across stations
// (act rows: `flex flex-wrap items-center gap-3`; status chips:
// `font-mono text-[0.66rem] font-semibold tracking-[0.08em]`).
defineProps<{
  title: string
  readoutLabel: string
}>()
</script>

<template>
  <div>
    <h3 class="m-0 mb-2 font-display text-lg font-semibold text-highlighted">
      {{ title }}
    </h3>
    <p class="m-0 mb-4 max-w-2xl text-sm leading-relaxed text-toned">
      <slot name="body" />
    </p>
    <div class="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <slot name="code" />
      <div class="well flex flex-col items-start gap-3 px-4 py-3.5">
        <span class="etched font-mono text-[0.58rem] font-semibold tracking-[0.14em] text-toned uppercase">{{ readoutLabel }}</span>
        <slot name="readout" />
      </div>
    </div>
  </div>
</template>
