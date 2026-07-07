<script setup lang="ts">
const state = usePanelState()

const tabs = [
  { to: '/', label: 'Connection', icon: 'carbon-plug' },
  { to: '/queries', label: 'Queries', icon: 'carbon-data-share' },
  { to: '/auth', label: 'Auth', icon: 'carbon-user-avatar' },
  { to: '/logs', label: 'Logs', icon: 'carbon-terminal' },
]
</script>

<template>
  <div class="h-screen flex of-hidden font-sans text-sm">
    <nav class="w-36 shrink-0 flex flex-col gap-0.5 p2 border-r border-base">
      <NuxtLink
        v-for="tab of tabs"
        :key="tab.to"
        :to="tab.to"
        class="px2 py1.5 rounded flex items-center gap-2 op65 hover:(op100 bg-active)"
        active-class="bg-active op100!"
      >
        <NIcon :icon="tab.icon" />
        {{ tab.label }}
        <NBadge
          v-if="tab.to === '/queries' && state.queries.length"
          n="green"
          class="ml-auto"
        >
          {{ state.queries.length }}
        </NBadge>
      </NuxtLink>
    </nav>

    <main class="flex-1 of-auto p4">
      <NTip
        v-if="state.bridgeAvailable === false"
        n="orange"
        icon="carbon-warning"
      >
        No Convex client found in this app. Make sure a Convex deployment URL is
        configured (<code>NUXT_PUBLIC_CONVEX_URL</code> or <code>convex.url</code>)
        and reload the page.
      </NTip>
      <NPanelGrids v-else-if="state.bridgeAvailable === null">
        <NLoading>Connecting to the app…</NLoading>
      </NPanelGrids>
      <NuxtPage v-else />
    </main>
  </div>
</template>
