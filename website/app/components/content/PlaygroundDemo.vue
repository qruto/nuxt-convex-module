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
  <div class="plate sheen my-6">
    <div class="flex items-center justify-between gap-4 px-4 pt-3 pb-2.5">
      <span class="etched font-mono text-xs font-semibold tracking-[0.04em] text-toned">{{ title }}</span>
      <span
        class="inline-flex flex-none items-center gap-1.5 font-mono text-[0.65rem] font-semibold tracking-[0.13em]"
        :class="isConnected ? 'text-toned' : 'text-dimmed'"
      >
        <span
          class="size-1.5 rounded-full"
          :class="isConnected ? 'bg-success shadow-(--glow-success)' : 'bg-error'"
        />
        {{ isConnected ? 'LIVE' : 'OFFLINE' }}
      </span>
    </div>
    <div class="well mx-3 mb-3 p-4 [--well-radius:14px]">
      <slot />
    </div>
  </div>
</template>
