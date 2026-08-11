<script setup lang="ts">
import LoadoutStation from './LoadoutStation.vue'

// DevTools: a static readout — the panel itself ships with the module.
</script>

<template>
  <LoadoutStation
    title="A Convex panel in Nuxt DevTools"
    readout-label="devtools · convex"
  >
    <template #body>
      Connection state, live subscriptions with their results, per-query
      server logs, auth state, and open-in-editor for Convex functions.
      On by default in dev.
    </template>
    <template #code>
      <pre
        data-tokens
        class="well m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.76rem] leading-[1.8] whitespace-pre text-highlighted"
      ><code><span class="tk-c">// nuxt.config.ts — opt out if you like
</span>convex: { devtools: <span class="tk-n">false</span> }</code></pre>
    </template>
    <template #readout>
      <ul class="m-0 flex list-none flex-col gap-2 p-0 font-mono text-[0.7rem] text-toned">
        <li class="flex items-center gap-2">
          <i
            aria-hidden="true"
            class="size-1.5 flex-none rounded-full bg-success shadow-(--glow-success)"
          />CONNECTED · WS OPEN
        </li>
        <li class="flex items-center gap-2">
          <i
            aria-hidden="true"
            class="size-1.5 flex-none rounded-full bg-(--ui-text-dimmed)"
          />messages.list · 3 docs · 12 ms
        </li>
        <li class="flex items-center gap-2">
          <i
            aria-hidden="true"
            class="size-1.5 flex-none rounded-full bg-(--ui-text-dimmed)"
          />auth · signed in · open in editor ↗
        </li>
      </ul>
    </template>
  </LoadoutStation>
</template>
