<script setup lang="ts">
// The deployment tray: a case-foam cutout (recessed well) with each step
// seated in it like a tool. Steps are the real ones from the install guide;
// the section's CTA links live in content/index.md.
const steps = [
  {
    id: 'MODULE',
    cmd: 'npx nuxi module add nuxt-convex-module',
    note: 'One module. Composables, components, and server helpers auto-import.',
  },
  {
    id: 'DEPLOY',
    cmd: 'NUXT_PUBLIC_CONVEX_URL=https://…',
    note: 'Point it at your Convex deployment from .env.',
  },
  {
    id: 'RUN',
    cmd: 'npx convex dev',
    note: 'Run Convex beside Nuxt and read live data with useQuery.',
  },
]

// These are the commands people actually retype, so they get a copy button.
const copied = ref<string | null>(null)
let clear: ReturnType<typeof setTimeout> | undefined

async function copy(step: (typeof steps)[number]) {
  try {
    await navigator.clipboard.writeText(step.cmd)
    copied.value = step.id
    clearTimeout(clear)
    clear = setTimeout(() => (copied.value = null), 1600)
  }
  catch {
    // Clipboard blocked (insecure context, denied permission) — the command
    // is selectable text either way, so there's nothing to recover from.
  }
}

onBeforeUnmount(() => clearTimeout(clear))
</script>

<template>
  <!-- The case-foam tray — a well carved into the ground itself; each step
       sits in the foam like a tool. -->
  <ol class="well m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(270px,1fr))] gap-4.5 p-4.5 [--well-radius:22px]">
    <li
      v-for="step in steps"
      :key="step.id"
      class="raised px-5 pt-4.5 pb-5"
    >
      <!-- COPY sits on the label row, not beside the command, so the command
           well keeps the card's full width — at three columns the install
           line only just fits. -->
      <header class="flex items-start justify-between gap-3">
        <span class="etched mb-3 inline-block font-mono text-[0.65rem] font-bold tracking-[0.16em] text-toned after:mt-1 after:block after:h-0.5 after:w-full after:rounded-full after:bg-primary/85 after:content-['']">{{ step.id }}</span>
        <UButton
          size="xs"
          color="neutral"
          variant="outline"
          class="font-mono text-[0.56rem] font-bold tracking-[0.12em]"
          :aria-label="`Copy the ${step.id.toLowerCase()} command`"
          @click="copy(step)"
        >
          {{ copied === step.id ? 'COPIED' : 'COPY' }}
        </UButton>
      </header>
      <!-- The command well wraps rather than scrolling: a horizontally-
           clipped command reads as a short one — people copy what they
           can see. -->
      <code class="well mb-3 block px-2.5 py-2 font-mono text-[0.74rem] leading-normal wrap-break-word whitespace-pre-wrap text-highlighted [--well-inset:var(--inset-1)] [--well-radius:10px]">{{ step.cmd }}</code>
      <p class="m-0 text-sm leading-relaxed text-toned">
        {{ step.note }}
      </p>
    </li>
  </ol>
</template>
