<script setup lang="ts">
// Shared chrome for playground demos: frames the live example and surfaces the
// WebSocket connection state so a stopped local deployment reads as "offline"
// instead of a silently empty demo.
withDefaults(defineProps<{ title?: string }>(), { title: 'Demo' })

const connectionState = useConvexConnectionState()

const isConnected = computed(() => connectionState.value.isWebSocketConnected)
</script>

<template>
  <div class="playground-demo not-prose">
    <div class="playground-demo-header">
      <span class="playground-demo-title">{{ title }}</span>
      <span
        class="playground-demo-status"
        :data-connected="isConnected"
      >
        <span class="playground-demo-status-dot" />
        {{ isConnected ? 'Live' : 'Offline' }}
      </span>
    </div>
    <div class="playground-demo-body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.playground-demo {
  border: 1px solid var(--ui-border);
  border-radius: var(--ui-radius, 0.5rem);
  margin: 1rem 0;
  overflow: hidden;
}

.playground-demo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  border-bottom: 1px solid var(--ui-border);
  background: var(--ui-bg-muted);
  font-size: 0.875rem;
}

.playground-demo-title {
  font-weight: 600;
}

.playground-demo-status {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--ui-text-muted);
  font-size: 0.75rem;
}

.playground-demo-status-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--ui-color-error-500, #ef4444);
}

.playground-demo-status[data-connected='true'] .playground-demo-status-dot {
  background: var(--ui-color-success-500, #22c55e);
}

.playground-demo-body {
  padding: 1rem;
}
</style>
