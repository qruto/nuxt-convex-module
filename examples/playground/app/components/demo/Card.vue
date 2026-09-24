<script setup lang="ts">
// A card per feature, with the composables it demonstrates listed under the
// title. Icons are Lucide's (ISC licence).
defineProps<{
  title: string
  icon: string
  apis: string[]
  error?: string | null
}>()

const icons: Record<string, string> = {
  radio: 'M4.9 19.1C1 15.2 1 8.8 4.9 4.9M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M19.1 4.9C23 8.8 23 15.1 19.1 19M14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0',
  pencil: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497zM15 5l4 4',
  layers: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83zM2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17',
  upload: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7ZM14 2v4a2 2 0 0 0 2 2h4M12 12v6M15 15l-3-3-3 3',
  zap: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z',
  server: 'M4 2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2zM4 14h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2zM6 6h.01M6 18h.01',
}
</script>

<template>
  <article class="card convex">
    <header>
      <svg viewBox="0 0 24 24" aria-hidden="true"><path :d="icons[icon]" /></svg>
      <h2>{{ title }}</h2>
    </header>
    <p class="apis">
      <code v-for="name in apis" :key="name">{{ name }}</code>
    </p>
    <slot />
    <p v-if="error" class="error" role="alert">{{ error }}</p>
  </article>
</template>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  min-width: 0;
  padding: 1rem;
  border-radius: var(--radius-card);
}

header {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  padding: 0.35rem 0.5rem 0;
}

svg {
  flex: none;
  width: 1.15rem;
  height: 1.15rem;
  fill: none;
  stroke: var(--accent);
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

h2 {
  font-size: 1.2rem;
  line-height: 1.2;
}

.apis {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.9rem;
  margin-top: -0.5rem;
  padding: 0 0.5rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.error {
  padding: 0 0.5rem;
  color: var(--error);
  font-size: 0.85rem;
  overflow-wrap: anywhere;
}
</style>
