<script setup lang="ts">
import { api } from '#convex/api'

// Several subscriptions in one call, kept live together. A value is
// `undefined` until its first result arrives, and an `Error` if it failed.
const totals = useQueries({
  clicks: { query: api.counters.get, args: { name: 'clicks' } },
  posts: { query: api.counters.get, args: { name: 'posts' } },
  files: { query: api.counters.get, args: { name: 'files' } },
})

const rows = [
  { key: 'clicks', label: 'clicks' },
  { key: 'posts', label: 'posts' },
  { key: 'files', label: 'uploads' },
] as const

function show(value: unknown) {
  if (value === undefined) return '…'
  return value instanceof Error ? 'error' : String(value)
}
</script>

<template>
  <DemoCard title="live queries" icon="radio" :apis="['useQueries()']">
    <dl class="totals">
      <div v-for="row in rows" :key="row.key" class="concave">
        <dt>{{ row.label }}</dt>
        <!-- A new key restarts the flash each time the value changes. -->
        <dd :key="show(totals[row.key])" class="flash">{{ show(totals[row.key]) }}</dd>
      </div>
    </dl>
    <p class="note">
      Totals written by the other cards. The server pushes each change here, with no polling.
    </p>
  </DemoCard>
</template>

<style scoped>
.totals {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  margin: 0;
}

.totals div {
  padding: 0.7rem 0.8rem;
  border-radius: var(--radius-recess);
}

dt {
  color: var(--text-muted);
  font: 0.75rem var(--font-mono);
}

dd {
  margin: 0.2rem 0 0;
  color: var(--text-strong);
  font: 600 1.6rem/1.1 var(--font-mono);
  font-variant-numeric: tabular-nums;
}

.flash {
  animation: flash 0.9s ease-out;
}

@keyframes flash {
  from { color: var(--accent); }
}

@media (prefers-reduced-motion: reduce) {
  .flash { animation: none; }
}

.note {
  padding: 0 0.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
