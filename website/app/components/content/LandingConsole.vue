<script setup lang="ts">
import { api } from '#convex/api'

// THE CONSOLE — three instruments on one plate, every one of them a row in
// a real Convex table read live by everyone on the page, and every one of
// them satisfying on your own:
//
//   the bank     eight switches; a flip is one mutation, optimistically
//                applied, and the lamp above each is the committed row
//   the fader    one shared level; drag it and the meter beside it climbs
//                for everyone — writes are throttled to a few a second
//   the counter  every press anywhere adds one; the drum rolls to the total
//
// Nothing here names who did what (2026-09-08: the "you" chips under every
// switch made the board read as a mirror). The rail says how many hands are
// on the console right now, and that is the only person it mentions.
//
// Offline (no client, or the socket is down) the console keeps working on
// local state so the stage never reads as broken — the rail says so.
interface SwitchRow {
  position: number
  on: boolean
  by: string
  at: number
}

const POSITIONS = 8
const blank = (): SwitchRow[] =>
  Array.from({ length: POSITIONS }, (_, position) => ({ position, on: false, by: '', at: 0 }))

const client = useConvex()
const { data: switchData, error } = client
  ? await useAsyncQuery(api.switches.list, {})
  : { data: shallowRef<SwitchRow[] | undefined>(undefined), error: shallowRef(null) }
const { data: consoleData } = client
  ? await useAsyncQuery(api.console.read, {})
  : { data: shallowRef<{ level: number, pulses: number } | undefined>(undefined) }

const { handle, sid } = useVisitor()
const { count: here } = usePresence(sid)
const online = useDemoOnline(error)

// ---- the bank ------------------------------------------------------------
const flipRemote = client
  ? useMutation(api.switches.flip).withOptimisticUpdate((store, { position, by }) => {
      const rows = store.getQuery(api.switches.list, {})
      if (!rows) return
      store.setQuery(api.switches.list, {}, rows.map(row =>
        row.position === position ? { ...row, on: !row.on, by, at: Date.now() } : row))
    })
  : undefined
const localSwitches = ref<SwitchRow[]>(blank())
const switches = computed<SwitchRow[]>(() => (online.value && switchData.value ? switchData.value : localSwitches.value))
const busy = ref<number | null>(null)

async function flip(position: number) {
  rejection.value = null
  if (!flipRemote || !online.value) {
    const row = localSwitches.value[position]!
    localSwitches.value[position] = { ...row, on: !row.on, by: handle.value, at: Date.now() }
    return
  }
  busy.value = position
  const t0 = performance.now()
  try {
    await flipRemote({ position, by: handle.value })
    rtt.value = Math.round(performance.now() - t0)
  }
  catch (e) {
    rejection.value = demoRejectionReason(e)
  }
  finally {
    busy.value = null
  }
}

// ---- the fader -----------------------------------------------------------
const setLevelRemote = client
  ? useMutation(api.console.setLevel).withOptimisticUpdate((store, { value }) => {
      const current = store.getQuery(api.console.read, {})
      if (current) store.setQuery(api.console.read, {}, { ...current, level: value })
    })
  : undefined
const localLevel = ref(40)
// While the hand is on the fader the knob follows the hand, not the table:
// the committed value catches up a round trip later and must not yank the
// knob back mid-drag.
const dragging = ref<number | null>(null)
const level = computed(() => dragging.value ?? (online.value && consoleData.value ? consoleData.value.level : localLevel.value))
let sendTimer: ReturnType<typeof setTimeout> | undefined
let pendingLevel: number | null = null

function onLevel(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  dragging.value = value
  if (!setLevelRemote || !online.value) {
    localLevel.value = value
    return
  }
  // Throttle: at most one write per 120 ms, the last value always lands.
  pendingLevel = value
  if (sendTimer) return
  sendTimer = setTimeout(async () => {
    sendTimer = undefined
    const v = pendingLevel
    pendingLevel = null
    if (v === null) return
    try {
      await setLevelRemote({ value: v })
    }
    catch (e) {
      rejection.value = demoRejectionReason(e)
    }
  }, 120)
}
function onLevelRelease() {
  // Let the last throttled write go out, then hand the knob back to the table.
  setTimeout(() => {
    dragging.value = null
  }, 200)
}
onUnmounted(() => sendTimer && clearTimeout(sendTimer))

const METER = 10
const litSegments = computed(() => Math.round((level.value / 100) * METER))

// ---- the counter ---------------------------------------------------------
const pulseRemote = client
  ? useMutation(api.console.pulse).withOptimisticUpdate((store) => {
      const current = store.getQuery(api.console.read, {})
      if (current) store.setQuery(api.console.read, {}, { ...current, pulses: current.pulses + 1 })
    })
  : undefined
const localPulses = ref(0)
const pulses = computed(() => (online.value && consoleData.value ? consoleData.value.pulses : localPulses.value))
const digits = computed(() => String(pulses.value).padStart(6, '0').split(''))
const pulsing = ref(false)

async function pulse() {
  rejection.value = null
  pulsing.value = true
  setTimeout(() => {
    pulsing.value = false
  }, 260)
  if (!pulseRemote || !online.value) {
    localPulses.value++
    return
  }
  const t0 = performance.now()
  try {
    await pulseRemote({})
    rtt.value = Math.round(performance.now() - t0)
  }
  catch (e) {
    rejection.value = demoRejectionReason(e)
  }
}

const rtt = ref<number | null>(null)
const rejection = ref<string | null>(null)
const onCount = computed(() => switches.value.filter(row => row.on).length)
</script>

<template>
  <figure
    class="part-plate sheen noise @container relative m-0 w-full px-6 pt-5 pb-5 @max-[30rem]:px-4.5"
    aria-label="A console of shared instruments: eight switches, a level fader and a pulse counter, live for everyone on this page"
  >
    <header class="mb-4 flex items-center justify-between gap-4 stamp text-toned">
      <span class="concave-text">console · one shared table</span>
      <span
        class="inline-flex items-center gap-1.5"
        :class="online ? 'text-toned' : 'text-dimmed'"
      >
        <i
          aria-hidden="true"
          class="lamp"
          :class="online ? 'lamp-live' : 'lamp-dead'"
        />
        {{ online ? (here === undefined ? 'live' : `${here} ${here === 1 ? 'hand' : 'hands'} on it`) : 'offline · local only' }}
      </span>
    </header>

    <!-- THE BANK. -->
    <div class="part-tray grid grid-cols-4 gap-x-3 gap-y-5 px-4 pt-5 pb-4 sm:grid-cols-8 sm:gap-x-2">
      <button
        v-for="row in switches"
        :key="row.position"
        type="button"
        class="switch group flex flex-col items-center gap-2.5 rounded-strip py-1 outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :aria-pressed="row.on"
        :aria-label="`Switch ${row.position + 1}, ${row.on ? 'on' : 'off'}`"
        :disabled="busy === row.position"
        @click="flip(row.position)"
      >
        <i
          aria-hidden="true"
          class="lamp transition-[background,box-shadow] duration-200"
          :class="row.on ? 'lamp-live' : 'lamp-dead'"
        />
        <span
          class="slot part-well relative h-16 w-9"
          aria-hidden="true"
        >
          <span
            class="knob convex bevel absolute inset-x-1 h-6.5 rounded-strip transition-[translate] duration-200 ease-out group-active:scale-[0.97]"
            :class="row.on ? 'translate-y-1' : 'translate-y-[calc(4rem-1.625rem-0.25rem)]'"
          ><i class="absolute inset-x-2 top-1/2 h-px -translate-y-1/2 bg-(--seam-shade) shadow-[0_1px_0_var(--seam-catch)]" /></span>
        </span>
        <span class="stamp text-dimmed">0{{ row.position + 1 }}</span>
      </button>
    </div>

    <!-- THE FADER and THE COUNTER, side by side. -->
    <div class="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div class="part-tray flex flex-col gap-3 px-4 pt-3.5 pb-4">
        <div class="flex items-center justify-between stamp">
          <span class="concave-text text-toned">level</span>
          <span class="concave-text text-lit tabular-nums">{{ level }}</span>
        </div>
        <div class="flex items-center gap-4">
          <!-- The meter: ten segments, lit from the left to the level. -->
          <span
            class="meter grid flex-1 grid-cols-10 gap-1"
            aria-hidden="true"
          >
            <i
              v-for="n in METER"
              :key="n"
              class="segment h-2 rounded-[2px] transition-[background,box-shadow] duration-150"
              :class="n <= litSegments ? (n > 8 ? 'is-hot' : 'is-lit') : ''"
            />
          </span>
        </div>
        <label class="fader block">
          <span class="sr-only">Shared level, 0 to 100</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            :value="level"
            :disabled="!online && !client && false"
            @input="onLevel"
            @change="onLevelRelease"
            @pointerup="onLevelRelease"
            @keyup="onLevelRelease"
          >
        </label>
      </div>

      <div class="part-tray flex flex-col gap-3 px-4 pt-3.5 pb-4">
        <div class="flex items-center justify-between stamp">
          <span class="concave-text text-toned">pulses · all time</span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span
            class="counter flex gap-0.5"
            aria-live="polite"
            :aria-label="`${pulses} pulses`"
          >
            <span
              v-for="(d, i) in digits"
              :key="i"
              class="digit"
              aria-hidden="true"
            ><span
              class="drum"
              :style="{ translate: `0 ${-Number(d) * 10}%` }"
            ><i
              v-for="n in 10"
              :key="n"
            >{{ n - 1 }}</i></span></span>
          </span>
          <button
            type="button"
            class="pulse-key convex-accent hard-cast grid size-11 flex-none place-items-center rounded-full text-primary-900 outline-none focus-visible:ring-2 focus-visible:ring-primary"
            :class="pulsing ? 'is-pulsing' : ''"
            aria-label="Send a pulse"
            @click="pulse"
          >
            <UIcon
              name="i-lucide-activity"
              class="concave-icon size-4.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- THE RAIL — the plate's one readout. -->
    <figcaption class="part-well mt-3.5 flex min-h-[2.15rem] flex-wrap items-stretch stamp">
      <span class="rail-cell">
        <i
          aria-hidden="true"
          class="lamp"
          :class="online ? 'lamp-live' : 'lamp-dead'"
        />
        <span
          class="concave-text"
          :class="online ? 'text-toned' : 'text-dimmed'"
        >{{ online ? 'live' : 'offline' }}</span>
      </span>
      <span class="rail-cell concave-text text-dimmed">{{ onCount }} of {{ switches.length }} on</span>
      <span
        v-if="rejection"
        class="rail-cell concave-text min-w-0 flex-1 text-error"
      ><span class="truncate">{{ rejection }}</span></span>
      <span
        v-if="rtt !== null"
        class="rail-cell rail-optional concave-text ml-auto text-lit"
      >commit {{ rtt }} ms</span>
      <span
        v-else
        class="rail-cell rail-optional concave-text ml-auto text-dimmed"
      >ssr hydrated</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.switch:disabled { cursor: progress; }
.knob { cursor: pointer; }

/* The meter's segments: dead is the well's own floor tone; lit is green
   with the lamp's glow; the last two run hot in the accent. */
.segment {
  background: var(--ui-border-accented);
}
.segment.is-lit {
  background: var(--ui-color-success-500);
  box-shadow: var(--glow-success);
}
.segment.is-hot {
  background: var(--ui-primary);
  box-shadow: var(--glow-primary-soft);
}

/* THE FADER — a native range, drawn as a groove with a raised knob so it
   stays a real slider (keyboard, touch, screen readers) and still reads
   as a part of the plate. */
.fader input {
  inline-size: 100%;
  block-size: 1.5rem;
  margin: 0;
  background: transparent;
  appearance: none;
  cursor: grab;
}
.fader input:active { cursor: grabbing; }
.fader input::-webkit-slider-runnable-track {
  block-size: 0.5rem;
  border-radius: 999px;
  background: var(--gradient-recessed);
  box-shadow: var(--inset-shadow-1), var(--recess-lip);
}
.fader input::-moz-range-track {
  block-size: 0.5rem;
  border-radius: 999px;
  background: var(--gradient-recessed);
  box-shadow: var(--inset-shadow-1), var(--recess-lip);
}
.fader input::-webkit-slider-thumb {
  appearance: none;
  inline-size: 1.6rem;
  block-size: 1.1rem;
  margin-block-start: -0.3rem;
  border-radius: var(--radius-strip);
  background: var(--gradient-surface);
  box-shadow: var(--elevation-1);
  border: 1px solid transparent;
  background-clip: padding-box;
}
.fader input::-moz-range-thumb {
  inline-size: 1.6rem;
  block-size: 1.1rem;
  border-radius: var(--radius-strip);
  background: var(--gradient-surface);
  box-shadow: var(--elevation-1);
  border: 1px solid transparent;
}
.fader input:focus-visible { outline: none; }
.fader input:focus-visible::-webkit-slider-thumb {
  box-shadow: var(--elevation-1), 0 0 0 2px var(--ui-primary);
}

/* THE COUNTER — a mechanical drum per digit: ten figures stacked in a
   slot one figure tall, translated to the figure showing. Rolling to the
   next total is the drum turning, not a number swapping. */
.counter {
  font-family: var(--font-mono);
  font-size: 1.15rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.digit {
  display: block;
  inline-size: 0.85em;
  block-size: 1.3em;
  overflow: hidden;
  border-radius: 3px;
  background: light-dark(oklch(27% 0.004 255), oklch(14% 0.004 255));
  color: light-dark(oklch(94% 0 0), oklch(88% 0 0));
  box-shadow:
    inset 0 1px 0 rgb(255 255 255 / 0.08),
    inset 0 -1px 0 rgb(0 0 0 / 0.5),
    0 1px 0 light-dark(rgb(255 255 255 / 0.55), rgb(255 255 255 / 0.05));
}
.drum {
  display: block;
  transition: translate 0.45s var(--ease-out);
}
.drum i {
  display: grid;
  place-items: center;
  block-size: 1.3em;
  font-style: normal;
  line-height: 1;
}
@media (prefers-reduced-motion: reduce) {
  .drum { transition: none; }
}
/* The pulse key: the accent part, wordless; the press flashes its glow. */
.pulse-key.is-pulsing {
  box-shadow: var(--accent-edge), var(--elevation-accent), 0 0 0 6px color-mix(in srgb, var(--ui-primary) 25%, transparent);
}
</style>
