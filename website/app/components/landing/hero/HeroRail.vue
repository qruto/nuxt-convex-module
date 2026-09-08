<script setup lang="ts">
// THE STATUS RAIL — the panel's one readout, and the only place it reports
// state. A recessed strip machined into the plate: the cells are scribed apart
// rather than spaced apart, so it reads as one instrument with divisions
// instead of a row of loose chips.
//
// The zones are the same in both acts, which is what lets one strip serve a
// recording and a live socket without either borrowing the other's idiom:
//
//   state    the lamp. REC while the script runs (signal orange — authored,
//            ours), LIVE once the socket is up (green — a machine fact, and
//            the conventional colour for one). OFFLINE kills the light rather
//            than recolouring it.
//   subject  what is being reported on: the scene, or the table.
//   event    the last thing that happened: the sim chip, or the hydration /
//            commit latency / a rejected write.
//   action   REPLAY, in its own bay past the last scribe.
const props = defineProps<{
  mode: 'recording' | 'live'
  /** Index of the scene on the plate, and the roster it indexes into. */
  scene: number
  scenes: readonly { id: string, label: string }[]
  /** The recording's own event chip, when a scene is reporting one. */
  chip: string | null
  online: boolean
  documents: number
  rejection: string | null
  rtt: number | null
  replayDisabled: boolean
}>()

defineEmits<{ replay: [] }>()

// One lamp, one label, one paint — OFFLINE is a dead lamp, not a recoloured
// one, so the state and its light are decided together.
const lamp = computed(() => (props.online
  ? { dot: 'lamp-live', ink: 'text-toned', label: 'LIVE' }
  : { dot: 'lamp-dead', ink: 'text-dimmed', label: 'OFFLINE' }))

// The EVENT cell, in priority order. A REJECTION is never optional — an error
// the panel is hiding is worse than a rail that scrolls — so that branch alone
// takes the flexible bay and carries no `rail-optional`.
const event = computed(() => {
  if (props.rejection) return { text: props.rejection, cell: 'min-w-0 flex-1 tracking-[0.02em] text-error' }
  if (props.rtt !== null) return { text: `COMMIT ${props.rtt} MS`, cell: 'rail-optional text-primary-700 dark:text-primary-300' }
  return { text: 'SSR HYDRATED', cell: 'rail-optional text-dimmed' }
})
</script>

<template>
  <figcaption class="concave rounded-[10px] mt-3.5 flex min-h-[2.15rem] items-stretch font-mono text-[0.62rem] font-semibold tracking-[0.13em]">
    <template v-if="mode === 'recording'">
      <span class="rail-cell">
        <i
          aria-hidden="true"
          class="lamp lamp-rec"
        />
        <span class="concave-text text-primary-700 dark:text-primary-300">REC</span>
      </span>
      <span class="rail-cell concave-text text-toned">SCENE 0{{ scene + 1 }} · {{ scenes[scene]!.label }}</span>
      <span
        class="rail-cell rail-optional gap-1.5"
        aria-hidden="true"
      >
        <i
          v-for="(s, index) in scenes"
          :key="s.id"
          class="size-1.5 rounded-full transition-colors duration-300"
          :class="index <= scene ? 'bg-primary' : 'bg-(--ui-border-accented)'"
        />
      </span>
      <span
        v-if="chip"
        class="rail-cell rail-optional concave-text ml-auto text-primary-700 dark:text-primary-300"
      >{{ chip }}</span>
    </template>
    <template v-else>
      <span class="rail-cell">
        <i
          aria-hidden="true"
          class="lamp"
          :class="lamp.dot"
        />
        <span
          class="concave-text"
          :class="lamp.ink"
        >{{ lamp.label }}</span>
      </span>
      <span class="rail-cell concave-text text-dimmed">{{ documents }} DOCUMENTS</span>
      <span
        class="rail-cell concave-text"
        :class="event.cell"
      ><span class="truncate">{{ event.text }}</span></span>
      <!-- One more pass of the recording — simulated, so no cost to ask. -->
      <UButton
        size="xs"
        color="neutral"
        variant="ghost"
        class="rail-cell ml-auto font-mono text-[0.56rem] font-bold tracking-[0.14em] text-dimmed hover:text-toned"
        :disabled="replayDisabled"
        @click="$emit('replay')"
      >
        REPLAY
      </UButton>
    </template>
  </figcaption>
</template>

<style scoped>
/* The rail is a groove cut across the foot of the plate — the shallow
   `concave` to the source tray's `concave-2` above it, so the two
   recesses read as one machining pass rather than as a well and a card.
   The shape and the paint are on the element (depth.css); what is left
   here is only the layout.

   Deliberately NOT overflow:hidden. Nothing in here needs clipping — the
   scribes are inset well clear of the rounding — and REPLAY's focus ring
   is an outline drawn OUTSIDE its box, so a clip would swallow the only
   indicator a keyboard user gets on the one control in the rail. */
.rail-cell {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.42rem;
  padding-inline: 0.72rem;
  white-space: nowrap;
}
/* A status bar that wraps is not a status bar, and the full set needs
   about 26rem of rail. Below that the EVENT cell goes: SSR HYDRATED and
   COMMIT n MS are transient notes, while the lamp, the document count and
   REPLAY are the standing readout and the one control. The recording act
   sheds the same way — the scene pips and the sim chip go, and "SCENE 03"
   already says how far along the tour is.

   Written as a container query HERE rather than as a `@max-[26rem]:hidden`
   utility on the markup, because `.rail-cell` above is unlayered scoped CSS
   and beats the layered `hidden` outright: the class sat on the element
   looking correct and never took effect. (The query resolves against the
   panel's `figure.convex-3` @container — and note the panel's own
   `@max-[30rem]:px-4.5` cannot work at all, since an element is never its
   own query container.) */
@container (max-width: 26rem) {
  .rail-optional {
    display: none;
  }
}
/* Cells are SCRIBED apart, not spaced apart: a shade line with its light
   catch one pixel to its right — the same two-line rule the mill finishes
   cut into the section grounds (landing.css), turned on its side. Inset
   vertically so the scribe stops short of the groove's own lip instead of
   colliding with it. Drawn on a pseudo rather than as a border so the
   rail's rounding clips it and the first cell can opt out. */
.rail-cell:not(:first-child)::before {
  content: "";
  position: absolute;
  inset-block: 0.4rem;
  inset-inline-start: 0;
  inline-size: 2px;
  background-image: linear-gradient(90deg,
    light-dark(oklch(0% 0 0 / 0.11), oklch(0% 0 0 / 0.5)) 0 1px,
    light-dark(oklch(100% 0 0 / 0.8), oklch(100% 0 0 / 0.05)) 1px 2px);
}
/* The lamp sits in a counterbore — a ring of shade around the light, which
   is what stops a coloured dot on a metal panel reading as a sticker. The
   glow is the lamp's own spill and only the LIT states get one. */
.lamp {
  --lamp-bore: 0 0 0 2px light-dark(oklch(0% 0 0 / 0.07), oklch(0% 0 0 / 0.55));
  flex: none;
  inline-size: 0.4rem;
  block-size: 0.4rem;
  border-radius: 999px;
  background: var(--ui-text-dimmed);
  box-shadow: var(--lamp-bore);
}
/* Green for the socket, signal orange for the recording. The split is the
   point of having one lamp: a machine fact and an authored one are not the
   same kind of state, and the colour is what says which you are looking
   at. */
.lamp-live {
  background: var(--ui-color-success-500);
  box-shadow: var(--lamp-bore), var(--glow-success);
}
.lamp-rec {
  background: var(--ui-primary);
  box-shadow: var(--lamp-bore), var(--glow-primary-soft);
}
/* Offline is a DEAD lamp, not a differently coloured one: it keeps the
   counterbore and loses the light. */
.lamp-dead {
  background: var(--ui-text-dimmed);
}
/* The theme's pulse-ring keyframes set box-shadow outright, which would
   drop the counterbore for the length of the pulse and leave the lamp
   floating on the rail. This one carries the bore through both frames. */
@media (prefers-reduced-motion: no-preference) {
  .lamp-rec {
    animation: lamp-pulse 2.4s ease-in-out infinite;
  }
  @keyframes lamp-pulse {
    0%, 100% {
      box-shadow: var(--lamp-bore),
        0 0 0 0 color-mix(in srgb, var(--ui-primary) 35%, transparent);
      opacity: 1;
    }
    50% {
      box-shadow: var(--lamp-bore), 0 0 0 6px transparent;
      opacity: 0.6;
    }
  }
}
</style>
