<script setup lang="ts">
// The deployment tray: a case-foam cutout (a `part-tray` cut into the
// ground) with each step seated in it like a tool (a `part-card`). The
// commands ride in from content/index.md as three fenced bash blocks in the
// default slot (order is the contract, see codeSlotParts), so they render
// through ProsePre — same chrome and copy button as every command in the
// docs. The section's CTA links live in content/index.md.
const steps = [
  {
    id: 'module',
    note: 'One module. Composables, components and server helpers auto-import.',
  },
  {
    id: 'deploy',
    note: 'Point it at your Convex deployment from .env.',
  },
  {
    id: 'run',
    note: 'Run Convex beside Nuxt and read live data with useQuery.',
  },
] as const

const parts = codeSlotParts(useSlots(), steps.length)
</script>

<template>
  <ol class="part-tray m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-4 rounded-plate p-4">
    <li
      v-for="(step, index) in steps"
      :key="step.id"
      class="part-card px-5 pt-4.5 pb-5"
    >
      <span class="stamp mb-3 inline-flex flex-col gap-1 text-toned">
        <span class="concave-text">0{{ index + 1 }} · {{ step.id }}</span>
        <i
          aria-hidden="true"
          class="block h-0.5 w-full rounded-full bg-primary/85"
        />
      </span>
      <!-- The command wraps rather than scrolling: a horizontally-clipped
           command reads as a short one — people copy what they can see. -->
      <!-- The copy key is centred on the well by MARGIN, not by a transform
             (2026-09-08). The theme presses every button with
             `active:translate-y-[0.5px]`, and a centring `-translate-y-1/2`
             is the same property: the moment the key was pressed the
             theme's nudge replaced the centring and the key jumped half
             its own height down the well. The key is 28px, so -14px of
             margin centres it and the press nudge still works. -->
      <div class="mb-3 [&>div]:my-0 [&>div]:relative [&_button]:top-1/2 [&_button]:-mt-3.5 [&_pre]:part-code [&_pre]:part-code-shell [&_pre]:py-2.5 [&_pre]:pr-11 [&_pre]:pl-3 [&_pre]:text-[0.85rem] [&_pre]:leading-normal [&_pre]:wrap-break-word [&_pre]:whitespace-pre-wrap lg:[&_pre]:text-[0.76rem]">
        <component :is="parts[index]" />
      </div>
      <p class="m-0 text-sm leading-relaxed text-toned">
        {{ step.note }}
      </p>
    </li>
  </ol>
</template>
