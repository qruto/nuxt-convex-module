<script setup lang="ts">
const state = usePanelState()
</script>

<template>
  <div class="flex flex-col gap-2">
    <NPanelGrids v-if="!state.queries.length">
      <span class="op50">No active query subscriptions.</span>
    </NPanelGrids>

    <QuerySubscription
      v-for="query of state.queries"
      :key="query.token"
      :query="query"
    />
  </div>
</template>
