<script setup lang="ts">
import { api } from '#convex/api'

const roll = useAction(api.dice.roll)
const { pending, error, run } = useCall()

const result = ref<{ value: number, milliseconds: number } | null>(null)

async function rollDie() {
  const started = performance.now()
  const value = await run(() => roll({}))
  if (value !== undefined) {
    result.value = { value, milliseconds: Math.round(performance.now() - started) }
  }
}
</script>

<template>
  <DemoCard title="actions" icon="zap" :apis="['useAction()']" :error="error">
    <div class="result concave">
      <output>{{ result?.value ?? '–' }}</output>
      <span>{{ result ? `returned in ${result.milliseconds} ms` : 'no roll yet' }}</span>
    </div>
    <button type="button" class="button convex-accent" :disabled="pending" @click="rollDie">
      {{ pending ? 'Rolling…' : 'Roll a die on the server' }}
    </button>
    <p class="note">
      An action can do what a query or mutation can't, like call another API. This one rolls a die
      and records the roll with <code>ctx.runMutation</code>: it lands in the pagination feed.
    </p>
  </DemoCard>
</template>

<style scoped>
/* The readout takes whatever height the card is given, its line centred. */
.result {
  display: flex;
  flex: 1;
  flex-wrap: wrap;
  gap: 0.8rem;
  align-content: center;
  align-items: baseline;
  padding: 0.7rem 1rem;
  border-radius: var(--radius-recess);
}

output {
  color: var(--accent);
  font: 600 2.4rem/1 var(--font-mono);
}

.result span {
  color: var(--text-muted);
  font: 0.8rem var(--font-mono);
}

.note {
  padding: 0 0.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
