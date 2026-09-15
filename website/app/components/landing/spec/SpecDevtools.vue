<template>
  <!-- A postage-stamp of the Nuxt DevTools window as it actually lays out:
       the icon RAIL down the left — the Nuxt mark on top, the built-in
       tabs greyed, the Convex tab seated and lit — and the panel it opens
       on the right: the connection lamp, then the live subscriptions with
       their result sizes. The Convex mark keeps its own three colours (it
       IS the Convex tab); everything live breathes in the card's emerald
       band. Reduced motion shows the open panel at rest. -->
  <div class="window flex w-full overflow-hidden rounded-lg border border-accented font-mono">
    <aside class="rail flex flex-none flex-col items-center gap-1.5 border-r border-accented px-1.5 py-1.5">
      <UIcon
        name="i-simple-icons-nuxt"
        class="size-3.5 text-dimmed"
        aria-hidden="true"
      />
      <i class="my-0.5 h-px w-3.5 bg-(--ui-border-accented)" />
      <UIcon
        v-for="icon in RAIL"
        :key="icon"
        :name="icon"
        class="size-3 text-dimmed opacity-60"
        aria-hidden="true"
      />
      <span class="band-fill grid size-5 place-items-center rounded-[4px]">
        <svg
          viewBox="0 0 32 32"
          class="size-3.5"
          aria-hidden="true"
        >
          <path
            d="M19.2 25.9c4.4-.5 8.5-2.8 10.8-6.6-1.1 9.5-11.6 15.5-20.3 11.8-.8-.34-1.5-.8-2-1.5-2.2-2.9-3-6.6-1.9-10.1 3 5 8 6.9 13.4 6.4z"
            fill="#F3B01C"
          />
          <path
            d="M8.4 15.4c-1.8 4-1.9 8.8.4 12.6C1.1 22.3.2 10.3 7 4.2c.7-.6 1.5-1 2.4-1.1 3.6-.5 7.3.9 9.6 3.6-5.8 0-10.3 3.4-12.6 8.7z"
            fill="#8D2676"
          />
          <path
            d="M20.7 7c-2.6-3.5-6.7-6-11.2-6C18.1-2.9 28.5 3.2 29.7 12.5c.1.9 0 1.8-.4 2.6-1.5 3.3-4.5 5.6-8.1 5.9 2.9-5.1 2.7-9.9-.5-14z"
            fill="#EE342F"
          />
        </svg>
      </span>
    </aside>
    <div class="flex min-w-0 flex-1 flex-col">
      <div class="flex items-center gap-2 border-b border-accented px-3 py-1.5 text-[0.56rem] font-bold tracking-[0.12em]">
        <span class="text-highlighted">Convex</span>
        <span class="ml-auto flex items-center gap-1.5 text-dimmed"><i class="led size-1.5 flex-none rounded-full" />connected</span>
      </div>
      <div class="flex flex-col gap-1 px-3 py-2 text-[0.58rem] leading-4">
        <div
          v-for="(query, n) in QUERIES"
          :key="query.name"
          class="row flex min-w-0 items-center gap-2"
          :style="{ '--i': n }"
        >
          <i class="led size-1.5 flex-none rounded-full" />
          <span class="truncate text-toned">{{ query.name }}</span>
          <span class="ml-auto flex-none text-dimmed">{{ query.result }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// The first built-in tabs above the Convex one, as DevTools orders them:
// overview, pages, components. Three is enough to read as "the rail".
const RAIL = [
  'i-lucide-layout-dashboard',
  'i-lucide-file',
  'i-lucide-box',
]
const QUERIES = [
  { name: 'messages.list', result: '12 rows' },
  { name: 'messages.count', result: '12' },
  { name: 'users.me', result: '{…}' },
]
</script>

<style scoped>
.led {
  background: var(--band, var(--color-signal-500));
  box-shadow: var(--band-glow, var(--glow-primary-soft));
}
@media (prefers-reduced-motion: no-preference) {
  .led {
    animation: devtools-led 2.4s ease-in-out infinite;
    animation-delay: calc(var(--i, 0) * 0.4s);
  }
}
@keyframes devtools-led {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}
</style>
