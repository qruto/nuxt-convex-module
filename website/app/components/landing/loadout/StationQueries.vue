<script setup lang="ts">
import LoadoutStation from './LoadoutStation.vue'

// Live queries: one mutation in, the subscribed ref updates.
const docs = ref(['ship it', 'seen by every subscriber'])
let docN = 1
function sendDemo() {
  docs.value = [...docs.value.slice(-3), `hi — mutation #${docN++}`]
}
</script>

<template>
  <LoadoutStation
    title="Reactive live queries"
    readout-label="messages.value"
  >
    <template #body>
      Results are refs that update when the data does — <ProseCode>useQuery</ProseCode>,
      <ProseCode>useQueries</ProseCode>, <ProseCode>useMutation</ProseCode>,
      <ProseCode>useAction</ProseCode>, all VueUse-shaped.
    </template>
    <template #code>
      <pre
        data-tokens
        class="well m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.76rem] leading-[1.8] whitespace-pre text-highlighted"
      ><code><span class="tk-k">const</span> messages = <span class="tk-f">useQuery</span>(api.messages.list, {})
<span class="tk-k">const</span> send = <span class="tk-f">useMutation</span>(api.messages.send)</code></pre>
    </template>
    <template #readout>
      <ul
        class="m-0 flex w-full list-none flex-col gap-1.5 p-0 font-mono text-[0.76rem]"
        aria-live="polite"
      >
        <li
          v-for="d in docs"
          :key="d"
          class="wrap-anywhere text-default before:mr-2 before:text-primary-700 before:content-['▸'] motion-safe:animate-fade-up [animation-duration:240ms] dark:before:text-primary-300"
        >
          {{ d }}
        </li>
      </ul>
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        @click="sendDemo"
      >
        send({ body: 'hi' })
      </UButton>
    </template>
  </LoadoutStation>
</template>
