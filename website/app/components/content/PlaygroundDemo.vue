<script setup lang="ts">
// Shared chrome for playground demos: frames the live example and surfaces the
// WebSocket connection state so a stopped local deployment reads as "offline"
// instead of a silently empty demo. Same material language as the landing
// page's plates: a raised plate with the demo seated in a recessed well.
withDefaults(defineProps<{ title?: string }>(), { title: 'Demo' })

// Read in the browser only (useClientConnectionState): the server renders
// the lamp off, and so does the client until the socket is up.
const connectionState = useClientConnectionState()

const isConnected = computed(() => connectionState.value?.isWebSocketConnected ?? false)
</script>

<template>
  <div class="part-card sheen my-6">
    <div class="flex items-center justify-between gap-4 px-4 pt-3 pb-2.5">
      <h2 class="m-0 stamp text-toned">
        {{ title }}
      </h2>
      <span
        class="inline-flex flex-none items-center gap-1.5 stamp"
        :class="isConnected ? 'text-toned' : 'text-muted'"
      >
        <i
          aria-hidden="true"
          class="lamp"
          :class="{ 'lamp-live': isConnected }"
        />
        {{ isConnected ? 'live' : 'offline' }}
      </span>
    </div>
    <div class="part-tray mx-3 mb-3 p-4">
      <slot />
    </div>
  </div>
</template>
