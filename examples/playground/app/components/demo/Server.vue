<script setup lang="ts">
import { api } from '#convex/api'

// Fetched on the server during rendering, sent to the browser in the Nuxt
// payload, then kept live over the WebSocket. View the page source: the
// number is in the HTML.
const { data: clicks, status } = useAsyncQuery(api.counters.get, { name: 'clicks' })

// Set once, where the page is rendered, and sent with the payload.
const renderedAt = useState('rendered-at', () => new Date().toISOString())

const response = ref<string | null>(null)
const { pending, error, run } = useCall()
const fetchTotals = () => $fetch('/api/totals')

async function callRoute() {
  const started = performance.now()
  const totals = await run(fetchTotals)
  if (totals) {
    response.value = `${JSON.stringify(totals, null, 2)}\n// ${Math.round(performance.now() - started)} ms`
  }
}
</script>

<template>
  <DemoCard title="server & ssr" icon="server" :apis="['useAsyncQuery()', 'fetchQuery()']" :error="error">
    <div class="rendered concave">
      <output>{{ status === 'success' ? clicks : '…' }}</output>
      <span>
        clicks, in the HTML rendered at
        <time :datetime="renderedAt"><ClientOnly>{{ new Date(renderedAt).toLocaleTimeString() }}</ClientOnly></time>
      </span>
    </div>
    <button type="button" class="button" :disabled="pending" @click="callRoute">
      Call <code>/api/totals</code>
    </button>
    <pre v-if="response" class="concave">{{ response }}</pre>
    <p v-else class="note">
      The route runs <code>fetchQuery</code> in Nitro, for API handlers, webhooks and middleware.
    </p>
  </DemoCard>
</template>

<style scoped>
.rendered {
  display: flex;
  gap: 0.8rem;
  align-items: baseline;
  padding: 0.7rem 1rem;
  border-radius: var(--radius-recess);
}

output {
  color: var(--text-strong);
  font: 600 2.4rem/1 var(--font-mono);
}

.rendered span {
  color: var(--text-muted);
  font: 0.8rem var(--font-mono);
}

pre {
  margin: 0;
  padding: 0.7rem 1rem;
  overflow-x: auto;
  border-radius: var(--radius-recess);
  color: var(--text-strong);
  font-size: 0.8rem;
}

.note {
  padding: 0 0.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}
</style>
