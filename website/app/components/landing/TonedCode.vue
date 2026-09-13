<script setup lang="ts">
// A code well built from markup rather than a fence: one `code-line` per
// line, one span per segment, coloured by the segment's tone with the three
// inks the site's shiki theme uses. The landing's comparison wells hand-set
// their snippets this way so a line can be swapped without a highlighter
// in the browser.
export interface Seg { text: string, tone?: 'key' | 'str' | 'fn' | 'dim' }

defineProps<{ lines: Seg[][] }>()
</script>

<template>
  <pre class="part-code m-0 overflow-x-auto px-3 py-3.5 font-mono text-[0.66rem] leading-[1.9] sm:px-4 sm:text-[0.78rem]"><code><span
    v-for="(l, i) in lines"
    :key="i"
    class="code-line block"
    :line="i + 1"
  ><span
    v-for="(seg, j) in l"
    :key="j"
    :class="seg.tone ? `tone-${seg.tone}` : 'text-highlighted'"
  >{{ seg.text }}</span></span></code></pre>
</template>

<style scoped>
.tone-key { color: var(--ui-primary); }
.tone-fn { color: light-dark(var(--ui-color-primary-700), var(--ui-color-primary-300)); }
.tone-str { color: light-dark(var(--ui-color-primary-600), var(--ui-color-primary-300)); }
.tone-dim { color: var(--ui-text-dimmed); font-style: italic; }
</style>
