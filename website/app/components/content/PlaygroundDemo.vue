<script setup lang="ts">
// Shared chrome for playground demos: frames the live example and surfaces the
// WebSocket connection state so a stopped local deployment reads as "offline"
// instead of a silently empty demo. Same material language as the homepage
// bench: a raised plate with the demo seated in a recessed well.
withDefaults(defineProps<{ title?: string }>(), { title: 'Demo' })

const connectionState = useConvexConnectionState()

const isConnected = computed(() => connectionState.value.isWebSocketConnected)
</script>

<template>
  <div class="part-card sheen my-6">
    <div class="flex items-center justify-between gap-4 px-4 pt-3 pb-2.5">
      <span class="stamp text-toned">{{ title }}</span>
      <span
        class="inline-flex flex-none items-center gap-1.5 stamp"
        :class="isConnected ? 'text-toned' : 'text-dimmed'"
      >
        <i
          aria-hidden="true"
          class="lamp"
          :class="isConnected ? 'lamp-live' : 'lamp-dead'"
        />
        {{ isConnected ? 'live' : 'offline' }}
      </span>
    </div>
    <div class="part-tray mx-3 mb-3 p-4">
      <slot />
    </div>
  </div>
</template>
