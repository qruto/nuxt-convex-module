<script setup lang="ts">
import LoadoutStation from './LoadoutStation.vue'

// Billing: CheckoutLink hands off to a Polar checkout session.
const checkedOut = ref(false)
</script>

<template>
  <LoadoutStation
    title="Billing, opt-in"
    readout-label="rendered"
  >
    <template #body>
      Install <ProseCode>@convex-dev/polar</ProseCode> and
      <ProseCode>CheckoutLink</ProseCode> /
      <ProseCode>CustomerPortalLink</ProseCode> register automatically —
      no extra modules, no config.
    </template>
    <template #code>
      <pre
        data-tokens
        class="well m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.76rem] leading-[1.8] whitespace-pre text-highlighted"
      ><code><span class="tk-t">&lt;CheckoutLink</span> :product-ids=<span class="tk-s">"[pro.id]"</span><span class="tk-t">&gt;</span>
  Upgrade to Pro
<span class="tk-t">&lt;/CheckoutLink&gt;</span></code></pre>
    </template>
    <template #readout>
      <div class="flex flex-wrap items-center gap-3">
        <UButton
          color="primary"
          size="sm"
          @click="checkedOut = true"
        >
          Upgrade to Pro
        </UButton>
        <span
          v-if="checkedOut"
          class="font-mono text-[0.66rem] font-semibold tracking-[0.08em] text-primary-700 dark:text-primary-300"
          aria-live="polite"
        >checkout session → polar.sh</span>
      </div>
    </template>
  </LoadoutStation>
</template>
