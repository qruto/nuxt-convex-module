<script setup lang="ts">
const state = usePanelState()

// Tabs, not routes: the panel is one page, so it ships without vue-router.
const tabs = [
  { id: 'connection', label: 'Connection', icon: 'carbon-plug' },
  { id: 'queries', label: 'Queries', icon: 'carbon-data-share' },
  { id: 'auth', label: 'Auth', icon: 'carbon-user-avatar' },
  { id: 'logs', label: 'Logs', icon: 'carbon-terminal' },
] as const

const active = ref<(typeof tabs)[number]['id']>('connection')
</script>

<template>
  <div class="h-screen flex of-hidden font-sans text-sm">
    <nav class="w-36 shrink-0 flex flex-col gap-0.5 p2 border-r n-border-base">
      <button
        v-for="tab of tabs"
        :key="tab.id"
        type="button"
        class="px2 py1.5 rounded flex items-center gap-2 text-left op65 hover:(op100 n-bg-active)"
        :class="{ 'n-bg-active op100!': active === tab.id }"
        :aria-current="active === tab.id || undefined"
        @click="active = tab.id"
      >
        <NIcon :icon="tab.icon" />
        {{ tab.label }}
        <NBadge
          v-if="tab.id === 'queries' && state.queries.length"
          n="green"
          class="ml-auto"
        >
          {{ state.queries.length }}
        </NBadge>
      </button>
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
      <PanelConnection v-else-if="active === 'connection'" />
      <PanelQueries v-else-if="active === 'queries'" />
      <PanelAuth v-else-if="active === 'auth'" />
      <PanelLogs v-else />
    </main>
  </div>
</template>
