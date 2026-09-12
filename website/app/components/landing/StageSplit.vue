<script setup lang="ts">
// The layout the two live plates share: the code that runs the plate, cut
// into the section ground beside it (a `part-dish`, like the hero's spec
// board), and the plate itself. The code fence rides in from content/index.md
// as the default slot; the plate is the named one.
//
// The code is set on the GROUND and not on a plate of its own: the plate is
// the instrument, and a second raised part beside it read as a second
// machine rather than as the label on the first.
defineProps<{
  /** The file tab scribed over the code. */
  file: string
  /** One line under the code — the thing to try. */
  note?: string
}>()
</script>

<template>
  <div class="grid grid-cols-1 items-center gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12">
    <div class="flex min-w-0 flex-col gap-3">
      <div class="flex items-center gap-3.5 stamp">
        <span class="concave-text flex-none text-toned">{{ file }}</span>
        <span
          class="scribe flex-1"
          aria-hidden="true"
        />
      </div>
      <div class="@container [&>div]:my-0 [&_button]:hidden [&_pre]:part-code [&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:px-4 [&_pre]:py-4 [&_pre]:text-[clamp(0.7rem,calc((100cqi-2rem)/34),0.85rem)] [&_pre]:leading-[1.75] ">
        <slot />
      </div>
      <p
        v-if="note"
        class="m-0 text-sm leading-relaxed text-muted"
      >
        {{ note }}
      </p>
    </div>
    <slot name="plate" />
  </div>
</template>
