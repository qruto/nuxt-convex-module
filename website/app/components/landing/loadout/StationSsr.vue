<script setup lang="ts">
import LoadoutStation from './LoadoutStation.vue'

// SSR: replay the server-render → payload → live handoff.
const ssrStep = ref(3)
let ssrTimers: ReturnType<typeof setTimeout>[] = []
function replaySsr() {
  ssrTimers.forEach(clearTimeout)
  ssrStep.value = 0
  ssrTimers = [
    setTimeout(() => { ssrStep.value = 1 }, 120),
    setTimeout(() => { ssrStep.value = 2 }, 520),
    setTimeout(() => { ssrStep.value = 3 }, 920),
  ]
}
onUnmounted(() => ssrTimers.forEach(clearTimeout))
</script>

<template>
  <LoadoutStation
    title="Server-rendered, no flash"
    readout-label="request timeline"
  >
    <template #body>
      <ProseCode>useAsyncQuery</ProseCode> and
      <ProseCode>preloadQuery</ProseCode> fetch on the server and hydrate
      into the live subscription — no flash of loading state.
    </template>
    <template #code>
      <pre
        data-tokens
        class="well m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.76rem] leading-[1.8] whitespace-pre text-highlighted"
      ><code><span class="tk-c">// runs on the server first
</span><span class="tk-k">const</span> { data: messages } =
  <span class="tk-k">await</span> <span class="tk-f">useAsyncQuery</span>(api.messages.list, {})</code></pre>
    </template>
    <template #readout>
      <ol class="m-0 flex list-none flex-col gap-2 p-0 font-mono text-[0.62rem] font-semibold tracking-[0.12em]">
        <li
          v-for="(step, i) in ['SERVER FETCH', 'HTML + PAYLOAD', 'LIVE ON CLIENT']"
          :key="step"
          class="flex items-center gap-2 transition-colors duration-180 ease-out"
          :class="ssrStep >= i + 1 ? 'text-toned' : 'text-dimmed'"
        >
          <i
            aria-hidden="true"
            class="size-2 flex-none rounded-full transition-[background,box-shadow] duration-180 ease-out"
            :class="ssrStep >= i + 1 ? 'bg-primary shadow-(--glow-primary-soft)' : 'bg-(--ui-border-accented)'"
          />{{ step }}
        </li>
      </ol>
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        @click="replaySsr"
      >
        replay request
      </UButton>
    </template>
  </LoadoutStation>
</template>
