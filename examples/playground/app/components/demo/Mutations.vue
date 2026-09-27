<script setup lang="ts">
import { api } from '#convex/api'

const clicks = useQuery(api.counters.get, { name: 'clicks' })

const add = useMutation(api.counters.add)
// The same mutation with an optimistic update: it changes the local query
// result at once, and the server's answer replaces it when it arrives.
const addOptimistically = useMutation(api.counters.add).withOptimisticUpdate((store, { amount }) => {
  const current = store.getQuery(api.counters.get, { name: 'clicks' })
  if (current !== undefined) {
    store.setQuery(api.counters.get, { name: 'clicks' }, current + amount)
  }
})

const optimistic = ref(true)
const { error, run } = useCall()

function click(amount: number) {
  run(() => (optimistic.value ? addOptimistically : add)({ amount }))
}
</script>

<template>
  <DemoCard title="mutations" icon="pencil" :apis="['useMutation()', '.withOptimisticUpdate()', 'useQuery()']" :error="error">
    <div class="counter concave">
      <output>{{ clicks ?? '…' }}</output>
      <span>clicks</span>
    </div>
    <div class="actions">
      <button type="button" class="button" @click="click(-1)">−1</button>
      <button type="button" class="button convex-accent" @click="click(1)">+1</button>
      <button type="button" class="button" @click="click(10)">+10</button>
      <label class="toggle">
        <input v-model="optimistic" type="checkbox">
        optimistic
      </label>
    </div>
    <p class="note">
      Optimistic on, the number moves before the server answers. Off, it waits for the round trip.
    </p>
  </DemoCard>
</template>

<style scoped>
.counter {
  display: flex;
  gap: 0.6rem;
  align-items: baseline;
  padding: 0.7rem 1rem;
  border-radius: var(--radius-recess);
}

output {
  color: var(--text-strong);
  font: 600 2.4rem/1 var(--font-mono);
}

.counter span {
  color: var(--text-muted);
  font: 0.8rem var(--font-mono);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
}

.actions .button {
  min-width: 3.25rem;
  font-family: var(--font-mono);
}

.toggle {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  margin-left: auto;
  color: var(--text-muted);
  font: 0.8rem var(--font-mono);
  cursor: pointer;
}

.toggle input {
  accent-color: var(--signal-500);
}

.note {
  padding: 0 0.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
