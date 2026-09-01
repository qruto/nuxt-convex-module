<script setup lang="ts">
// The deployment tray: a case-foam cutout (recessed well) with each step
// seated in it like a tool. The commands ride in from content/index.md as
// three fenced bash blocks in the default slot (order is the contract, see
// codeSlotParts), so they render through ProsePre — same chrome and copy
// button as every command in the docs. The section's CTA links live in
// content/index.md.
const steps = [
  {
    id: 'MODULE',
    note: 'One module. Composables, components, and server helpers auto-import.',
  },
  {
    id: 'DEPLOY',
    note: 'Point it at your Convex deployment from .env.',
  },
  {
    id: 'RUN',
    note: 'Run Convex beside Nuxt and read live data with useQuery.',
  },
] as const

const parts = codeSlotParts(useSlots(), steps.length)
</script>

<template>
  <div>
    <!-- The case-foam tray — a well carved into the ground itself; each step
         sits in the foam like a tool. -->
    <ol class="concave-2 rounded-[22px] m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-4.5 p-4.5">
      <li
        v-for="(step, index) in steps"
        :key="step.id"
        class="convex rounded-lg px-5 pt-4.5 pb-5"
      >
        <span class="concave-text mb-3 inline-block font-mono text-[0.65rem] font-bold tracking-[0.16em] text-toned after:mt-1 after:block after:h-0.5 after:w-full after:rounded-full after:bg-primary/85 after:content-['']">{{ step.id }}</span>
        <!-- The command wraps rather than scrolling: a horizontally-clipped
             command reads as a short one — people copy what they can see.
             (ProsePre's own copy button covers the retyping case.) -->
        <div class="mb-3 [&>div]:my-0 [&_pre]:py-2.5 [&_pre]:pr-10 [&_pre]:pl-2.5 [&_pre]:text-[0.85rem] [&_pre]:leading-normal [&_pre]:wrap-break-word [&_pre]:whitespace-pre-wrap lg:[&_pre]:text-[0.76rem]">
          <component :is="parts[index]" />
        </div>
        <p class="m-0 text-sm leading-relaxed text-toned">
          {{ step.note }}
        </p>
      </li>
    </ol>
    <!-- No Nuxt? The same client, one subpath over. -->
    <p class="m-0 mt-4 text-center text-sm leading-relaxed text-toned">
      No Nuxt? The <code class="font-mono text-[0.92em] text-highlighted">nuxt-convex-module/vue</code>
      subpath ships the same composables for any Vue app —
      <NuxtLink
        to="/guide/plain-vue"
        class="font-semibold text-primary-700 hover:underline dark:text-primary-300"
      >plain Vue guide</NuxtLink>.
    </p>
  </div>
</template>
