<script setup lang="ts">
const state = usePanelState()

const adapters = computed(() => {
  const integrations = state.info?.integrations
  if (!integrations) return []
  return [
    { name: 'Better Auth', enabled: integrations.betterAuth, observable: true },
    { name: 'Clerk', enabled: integrations.clerk, observable: false },
    { name: 'Auth0', enabled: integrations.auth0, observable: false },
  ].filter(adapter => adapter.enabled)
})

const authBadge = computed(() => {
  if (state.auth.isLoading) return { n: 'gray', text: 'Loading' }
  if (state.auth.isRefreshing) return { n: 'orange', text: 'Refreshing token' }
  return state.auth.isAuthenticated
    ? { n: 'green', text: 'Authenticated' }
    : { n: 'gray', text: 'Unauthenticated' }
})
</script>

<template>
  <div class="flex flex-col gap-4">
    <NCard class="p4">
      <div class="op50 text-xs mb2">
        Auth adapters
      </div>
      <div
        v-if="adapters.length"
        class="flex gap-2"
      >
        <NBadge
          v-for="adapter of adapters"
          :key="adapter.name"
          n="blue"
        >
          {{ adapter.name }}
        </NBadge>
      </div>
      <span
        v-else
        class="op50"
      >No auth integration enabled.</span>
    </NCard>

    <NCard
      v-if="state.auth.available"
      class="p4 flex items-center gap-3"
    >
      <NBadge :n="authBadge.n">
        {{ authBadge.text }}
      </NBadge>
      <span class="op50 text-xs font-mono">
        isLoading: {{ state.auth.isLoading }} · isAuthenticated: {{ state.auth.isAuthenticated }} · isRefreshing: {{ state.auth.isRefreshing }}
      </span>
    </NCard>
    <NTip
      v-else-if="adapters.length"
      n="blue"
      icon="carbon-information"
    >
      Auth state isn't observable for this adapter yet — Clerk and Auth0 provide
      their state at component level, which the DevTools bridge can't reach.
    </NTip>
  </div>
</template>
