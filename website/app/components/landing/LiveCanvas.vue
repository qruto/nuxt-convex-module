<script setup lang="ts">
import { api } from '#convex/api'

// THE CANVAS — the hero's instrument, and the same instrument in the small
// second window (/canvas, opened by the key on the hero plate's header). A
// 21 × 11 grid every visitor paints on, where every stroke is one committed
// row, and a scrubber that drags the query's `at` argument back through the
// table's history: paint a few cells, drag, and the same query re-renders
// the table as it stood at each commit. Slide to the end and it is live
// again. The strip starts at page load: the table keeps every visitor's
// rows, but the ticks are the commits since this window opened, and the
// left end is the frame as it was found.
//
// Two real subscriptions: `api.canvas.at` with a reactive argument (the
// frame), and `api.canvas.log` (the strip's ticks). Painting is only ever
// against `{ at: null }`, so the optimistic update targets that one key.
//
// THE OTHERS ARE VISIBLE (2026-09-13: "if someone is on the site, make it
// obvious"). The rail counts the windows on the canvas right now — the
// site's presence table, which the second window joins as its own visitor
// — and a stroke that arrives from any of them lands with a ring on its
// cell and a line on the rail, so a change you did not make never just
// appears.
//
// Offline (no client, or the socket is down) the canvas keeps working on
// local rows so the stage never reads as broken — the rail says so.

// Whether the plate can honestly say live — the hero reads it to sink the
// matching key in the copy. An emit rather than an expose: the value only
// exists after the awaited query below, and expose must come before it.
const emit = defineEmits<{ online: [value: boolean] }>()

type Ink = 'signal' | 'graphite' | 'none'
interface Commit { at: number, clear: boolean }

const COLUMNS = 21
const ROWS = 11
const CELLS = COLUMNS * ROWS
// Two inks. There is no eraser: a cell already wearing the chosen ink is
// wiped by the same click, and the cursor over it says so.
const INKS: { id: Ink, label: string }[] = [
  { id: 'signal', label: 'signal ink' },
  { id: 'graphite', label: 'graphite ink' },
]
const blank = (): Ink[] => Array.from({ length: CELLS }, () => 'none')

const client = useConvex()

// The cells this window is committing, and the rail's last line — declared
// up here because the frame watch below reads both.
const pending = ref(new Set<number>())
const event = ref<string>('ssr hydrated')

// `null` reads now; a timestamp reads the table as it stood then. The
// getter makes the argument reactive: moving the scrubber re-subscribes.
const at = ref<number | null>(null)
const { data: frame, error } = client
  ? await useAsyncQuery(api.canvas.at, () => ({ at: at.value }))
  : { data: shallowRef<Ink[] | undefined>(undefined), error: shallowRef(null) }
const { data: log } = client
  ? await useAsyncQuery(api.canvas.log, {})
  : { data: shallowRef<Commit[] | undefined>(undefined) }

const online = useDemoOnline(error)
watch(online, value => emit('online', value), { immediate: true })

// Who is here: this window heartbeats the presence table under its own
// session id, and reads the live count back — the same query the console
// shows as hands on it. The hero page and the second window are two ids,
// so opening the window ticks the count to 2 in both.
const { sid } = useVisitor()
const { count: here } = usePresence(sid)
// The rail's presence cell: nothing until the count arrives, dim while it
// is just this window, toned once someone else is on the canvas.
const hereCell = computed(() => {
  if (!online.value || here.value === undefined) return null
  return here.value <= 1
    ? { text: 'just you', tone: 'text-dimmed' }
    : { text: `${here.value} here`, tone: 'text-toned' }
})

// ---- local fallback --------------------------------------------------------
// The same fold the server does, over rows this browser wrote, for when
// there is no deployment to write to.
interface LocalRow { at: number, clear: boolean, cell?: number, ink?: Ink }
const localRows = ref<LocalRow[]>([])
function fold(rows: LocalRow[], upTo: number | null): Ink[] {
  const cells = blank()
  for (const row of rows) {
    if (upTo !== null && row.at > upTo) break
    if (row.clear) cells.fill('none')
    else if (row.cell !== undefined && row.ink) cells[row.cell] = row.ink
  }
  return cells
}

// A subscription with new arguments answers a beat later; the plate holds
// the last frame it had rather than blanking between the two.
//
// While the canvas is live, every cell the new frame changes that this
// window is not itself painting (its own strokes are optimistic, and sit
// in `pending` when their frame lands) came from another window: it gets
// a ring for a beat, and the rail says so.
const lastFrame = ref<Ink[]>(frame.value ?? blank())
const arrived = ref(new Set<number>())
const arrivedTimers = new Map<number, ReturnType<typeof setTimeout>>()
function ring(cell: number) {
  arrived.value.add(cell)
  clearTimeout(arrivedTimers.get(cell))
  arrivedTimers.set(cell, setTimeout(() => {
    arrived.value.delete(cell)
    arrivedTimers.delete(cell)
  }, 900))
}
onUnmounted(() => arrivedTimers.forEach(timer => clearTimeout(timer)))
watch(frame, (value) => {
  if (!value) return
  const previous = lastFrame.value
  lastFrame.value = value
  if (at.value !== null) return
  const changed: number[] = []
  value.forEach((ink, cell) => {
    if (ink !== previous[cell] && !pending.value.has(cell)) changed.push(cell)
  })
  if (changed.length === 0) return
  changed.forEach(ring)
  const swept = value.every(ink => ink === 'none') && changed.length > 1
  event.value = swept ? 'someone swept' : 'someone painted'
})
const cells = computed<Ink[]>(() => (online.value ? lastFrame.value : fold(localRows.value, at.value)))

// THE BASELINE — the instant this window arrived, taken as the last commit
// the log held then (the server's clock, so it lines up with the rows'
// `_creationTime`). Ticks before it are not on the strip; a reload starts
// a fresh one. Pinning `at` to it reads the frame as it was found.
const since = log.value?.at(-1)?.at ?? 0
const commits = computed<Commit[]>(() => (online.value && log.value ? log.value.filter(commit => commit.at > since) : localRows.value))
const painted = computed(() => cells.value.filter(ink => ink !== 'none').length)
const live = computed(() => at.value === null)
// The rail's lamp and its word: live (green — a machine fact: the socket
// is up and the query reads now), snapshot (signal orange — the query is
// pinned to a commit), offline (no light).
const state = computed(() => {
  if (!online.value) return { lamp: 'lamp-dead', tone: 'text-dimmed', label: 'offline' }
  return live.value
    ? { lamp: 'lamp-live', tone: 'text-toned', label: 'live' }
    : { lamp: 'lamp-rec', tone: 'text-toned', label: 'snapshot' }
})
// The query's arguments, verbatim: the tie between the scrubber and the
// code above.
const args = computed(() => `args { at: ${at.value === null ? 'null' : at.value} }`)
const gridLabel = computed(() => `a ${COLUMNS} by ${ROWS} canvas${live.value ? '' : ', reading a snapshot'}`)

// ---- the scrubber ----------------------------------------------------------
// The strip's position is derived from `at`, never stored twice: the end is
// live, and any other tick pins the query to that commit's instant.
const index = computed({
  get: () => {
    const list = commits.value
    if (at.value === null) return list.length
    const pinned = at.value
    return list.filter(commit => commit.at <= pinned).length
  },
  set: (value: number) => {
    const list = commits.value
    const next = value >= list.length ? null : value <= 0 ? since : list[value - 1]!.at
    if (next === at.value) return
    at.value = next
    event.value = next === null ? 'back to live' : 'args changed'
  },
})
function onScrub(e: Event) {
  index.value = Number((e.target as HTMLInputElement).value)
}
function backToLive() {
  at.value = null
  event.value = 'back to live'
}
const atLabel = computed(() => {
  if (at.value === null) return 'now'
  if (at.value === since) return 'on load'
  const d = new Date(at.value)
  return `${d.toLocaleTimeString([], { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0').slice(0, 2)}`
})

// ---- painting --------------------------------------------------------------
const ink = ref<Ink>('signal')
const rtt = ref<number | null>(null)
const rejection = ref<string | null>(null)

const paintRemote = client
  ? useMutation(api.canvas.paint).withOptimisticUpdate((store, { cell, ink }) => {
      const current = store.getQuery(api.canvas.at, { at: null })
      if (current) store.setQuery(api.canvas.at, { at: null }, current.map((v, i) => (i === cell ? ink : v)))
      const ticks = store.getQuery(api.canvas.log, {})
      if (ticks) store.setQuery(api.canvas.log, {}, [...ticks, { at: Math.max(Date.now(), since + 1), clear: false }])
    })
  : undefined
const clearRemote = client
  ? useMutation(api.canvas.clear).withOptimisticUpdate((store) => {
      if (store.getQuery(api.canvas.at, { at: null })) store.setQuery(api.canvas.at, { at: null }, blank())
      const ticks = store.getQuery(api.canvas.log, {})
      if (ticks) store.setQuery(api.canvas.log, {}, [...ticks, { at: Math.max(Date.now(), since + 1), clear: true }])
    })
  : undefined

async function commit(mark: number[], run: () => Promise<unknown>, local: () => void) {
  rejection.value = null
  if (!online.value) {
    local()
    return
  }
  for (const cell of mark) pending.value.add(cell)
  const t0 = performance.now()
  try {
    await run()
    rtt.value = Math.round(performance.now() - t0)
    event.value = `commit ${rtt.value} ms`
  }
  catch (e) {
    rejection.value = demoRejectionReason(e)
  }
  finally {
    for (const cell of mark) pending.value.delete(cell)
  }
}

function stroke(cell: number) {
  // The canvas takes strokes only while it is live; a snapshot is read-only.
  if (!live.value) return
  const current = cells.value[cell]
  const next: Ink = current === ink.value ? 'none' : ink.value
  if (current === next) return
  void commit(
    [cell],
    () => paintRemote!({ cell, ink: next }),
    () => localRows.value.push({ at: Date.now(), clear: false, cell, ink: next }),
  )
}

function sweep() {
  if (!live.value) at.value = null
  if (cells.value.every(v => v === 'none')) return
  void commit(
    Array.from({ length: CELLS }, (_, i) => i),
    () => clearRemote!({}),
    () => localRows.value.push({ at: Date.now(), clear: true }),
  )
}

// One drag paints every cell it crosses once. Pointer events land on the
// grid (the pointer is captured there), and the cell under the finger is
// read off the point — which is what makes a touch drag work at all, since
// touch never fires pointerenter across elements.
const grid = ref<HTMLElement | null>(null)
let dragging = false
let visited = new Set<number>()
function cellAt(e: PointerEvent): number | null {
  const el = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-cell]')
  return el ? Number(el.dataset.cell) : null
}
function onPointerDown(e: PointerEvent) {
  if (!live.value || e.button !== 0) return
  dragging = true
  visited = new Set()
  grid.value?.setPointerCapture(e.pointerId)
  onPointerMove(e)
}
function onPointerMove(e: PointerEvent) {
  if (!dragging) return
  const cell = cellAt(e)
  if (cell === null || visited.has(cell)) return
  visited.add(cell)
  stroke(cell)
}
function onPointerUp() {
  dragging = false
}
// Keyboard: a real click (Enter/Space on the cell) has no pointer, so only
// those reach here — a mouse click already painted on pointerdown.
function onCellClick(cell: number, e: MouseEvent) {
  if (e.detail === 0) stroke(cell)
}
</script>

<template>
  <!-- The canvas well: the ink keys, the count and the sweep on its head,
       the grid in a `part-tray`, the strip under it. -->
  <div class="part-well px-4.5 py-3.5 @max-[30rem]:px-3.5">
    <div class="mb-3 flex items-center gap-3 stamp">
      <span class="concave-text text-toned">canvas</span>
      <div
        class="flex gap-1.5"
        role="group"
        aria-label="ink"
      >
        <button
          v-for="option in INKS"
          :key="option.id"
          type="button"
          class="ink"
          :data-ink="option.id"
          :aria-pressed="ink === option.id"
          :aria-label="option.label"
          :title="option.label"
          @click="ink = option.id"
        >
          <i aria-hidden="true" />
        </button>
      </div>
      <!-- The scribe gives way first: on a phone it shrinks to nothing so
           the count and the sweep stay on the head's one line. -->
      <span
        class="scribe min-w-0 flex-1"
        aria-hidden="true"
      />
      <span class="concave-text whitespace-nowrap text-dimmed tabular-nums">{{ painted }} of {{ CELLS }} painted</span>
      <!-- The sweep: one more mutation, a commit that wipes the frame —
           the strip keeps it, so the scrubber can go back past it. -->
      <button
        type="button"
        class="iconkey text-dimmed hover:text-toned"
        aria-label="sweep the canvas"
        title="sweep the canvas"
        @click="sweep"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        ><path d="m16 22-1-4" /><path d="M19 13.99a1 1 0 0 0 1-1V12a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v.99a1 1 0 0 0 1 1" /><path d="M5 14h14l1.973 6.767A1 1 0 0 1 20 22H4a1 1 0 0 1-.973-1.233z" /><path d="m8 22 1-4" /></svg>
      </button>
    </div>

    <div
      ref="grid"
      class="part-tray grid touch-none select-none gap-[2px] p-1.5 transition-shadow duration-200"
      :class="live ? undefined : 'is-snapshot'"
      :style="{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }"
      :data-brush="ink"
      role="group"
      :aria-label="gridLabel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @lostpointercapture="onPointerUp"
    >
      <button
        v-for="(cell, i) in cells"
        :key="i"
        type="button"
        class="px"
        :data-cell="i"
        :data-ink="cell"
        :class="{ 'is-pending': pending.has(i), 'is-arrived': arrived.has(i) }"
        :disabled="!live"
        :aria-label="`cell ${(i % COLUMNS) + 1}, ${Math.floor(i / COLUMNS) + 1}`"
        @click="onCellClick(i, $event)"
      />
    </div>

    <!-- The strip: one tick per commit, the knob on the one the query
         reads. The end is live; anywhere else is a snapshot. -->
    <div class="strip mt-3 grid gap-1">
      <div class="flex items-center justify-between gap-2 stamp">
        <span class="concave-text text-dimmed tabular-nums">commit {{ index }} of {{ commits.length }}</span>
        <span
          class="concave-text tabular-nums"
          :class="live ? 'text-lit' : 'text-toned'"
        >{{ atLabel }}</span>
      </div>
      <label class="fader block">
        <span class="sr-only">Scrub through the table's commits</span>
        <input
          type="range"
          min="0"
          :max="commits.length"
          step="1"
          :value="index"
          @input="onScrub"
        >
      </label>
      <!-- The ticks are drawn, not laid out: one SVG the width of the
           knob's travel, a hairline per commit at its own x, so the count
           never rounds them off the track. Every tick is the same line —
           a sweep is a commit like any other; only the read one stands
           out. -->
      <svg
        class="ticks"
        :viewBox="`0 0 ${Math.max(commits.length, 1)} 1`"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <line
          v-for="n in commits.length + 1"
          :key="n"
          :x1="n - 1"
          :x2="n - 1"
          y1="0"
          y2="1"
          vector-effect="non-scaling-stroke"
          :class="n - 1 === index ? 'is-at' : undefined"
        />
      </svg>
      <div class="flex items-center justify-between gap-2 stamp">
        <span class="concave-text text-dimmed">on load</span>
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="stamp text-lit hover:text-lit"
          :disabled="live"
          @click="backToLive"
        >
          now
        </UButton>
      </div>
    </div>
  </div>

  <!-- THE STATUS RAIL — the panel's one readout, and the only place it
       reports state (the cells and their scribes are chrome.css's .rail).

         state    the lamp. live (green — a machine fact: the socket is
                  up and the query reads now), snapshot (signal orange —
                  the query is pinned to a commit), offline (no light).
         here     how many windows are on the canvas — presence, live.
         args     the arguments the query is running with, verbatim: the
                  tie between the scrubber and the code above.
         event    the last thing that happened: hydration, a commit's
                  latency, a change of arguments, or a rejected write. -->
  <figcaption class="part-well mt-3.5 flex min-h-[2.15rem] items-stretch stamp">
    <span class="rail-cell">
      <i
        aria-hidden="true"
        class="lamp"
        :class="state.lamp"
      />
      <span
        class="concave-text"
        :class="state.tone"
      >{{ state.label }}</span>
    </span>
    <!-- The count of windows on the canvas: the presence table, live.
         Two here means the second window (or a stranger) is on it. -->
    <span
      v-if="hereCell"
      class="rail-cell concave-text whitespace-nowrap tabular-nums"
      :class="hereCell.tone"
    >{{ hereCell.text }}</span>
    <span class="rail-cell concave-text min-w-0 text-dimmed"><span class="truncate">{{ args }}</span></span>
    <span
      v-if="rejection"
      class="rail-cell concave-text min-w-0 flex-1 text-error"
    ><span class="truncate">{{ rejection }}</span></span>
    <!-- Not `rail-optional`: the plate's content box sits under that
         query's 30rem, and this cell is where a commit's latency and a
         change of arguments are reported. It truncates instead. -->
    <span
      v-else
      class="rail-cell concave-text min-w-0 flex-1 text-lit"
    ><span class="truncate">{{ event }}</span></span>
  </figcaption>
</template>

<style scoped>
/* THE INK KEYS — a raised button with the ink as a lamp in its bore. The
   chosen key wears the accent ring. */
.ink {
  inline-size: 1.35rem;
  block-size: 1.35rem;
  padding: 0;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  display: grid;
  place-items: center;
  background: var(--gradient-surface) padding-box, var(--gradient-bevel) border-box;
  box-shadow: var(--elevation-1);
}
.ink i {
  display: block;
  inline-size: 0.6rem;
  block-size: 0.6rem;
  border-radius: 999px;
  box-shadow: 0 0 0 2px light-dark(oklch(0% 0 0 / 0.07), oklch(0% 0 0 / 0.55));
}
.ink[data-ink="signal"] i { background: var(--ui-primary); }
.ink[data-ink="graphite"] i { background: light-dark(oklch(35% 0 0), oklch(85% 0 0)); }
.ink[aria-pressed="true"],
.ink:focus-visible {
  outline: 2px solid var(--ui-primary);
  outline-offset: 2px;
}

/* THE SWEEP — an icon key, a marking on the well's head with no cast of
   its own. */
.iconkey {
  inline-size: 1.6rem;
  block-size: 1.6rem;
  padding: 0;
  border: 0;
  border-radius: var(--radius-chip);
  background: none;
  cursor: pointer;
  display: grid;
  place-items: center;
}
.iconkey svg { inline-size: 0.9rem; block-size: 0.9rem; }
.iconkey:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: -2px; }

/* THE CELLS — flat slots in the tray, an ink lifting the one it fills.
   Signal wears the accent with its glow; graphite is the plate's ink, so
   it flips with the scheme. A pending cell is outlined until its row
   commits. A snapshot reads only: the tray takes a dashed accent lip and
   the cells lose their cursor. */
.px {
  aspect-ratio: 1;
  padding: 0;
  border: 0;
  border-radius: 2px;
  cursor: crosshair;
  background: light-dark(oklch(89% 0 0), oklch(28% 0 0));
  box-shadow:
    inset 0 1px 0 light-dark(rgb(0 0 0 / 0.04), rgb(0 0 0 / 0.35)),
    0 1px 0 light-dark(rgb(255 255 255 / 0.5), rgb(255 255 255 / 0.04));
  transition: background 0.12s, box-shadow 0.12s;
}
.px[data-ink="signal"] {
  background: linear-gradient(180deg, color-mix(in oklab, var(--ui-color-primary-400), #fff 10%), var(--ui-primary));
  box-shadow: var(--glow-primary-soft), inset 0 1px 0 rgb(255 255 255 / 0.3);
}
.px[data-ink="graphite"] {
  background: light-dark(oklch(32% 0 0), oklch(88% 0 0));
  box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.12);
}
/* Over a cell already wearing the chosen ink the click wipes it, and the
   cursor says so: a small ⊗, white on black so it reads on either ink. */
[data-brush="signal"] .px[data-ink="signal"],
[data-brush="graphite"] .px[data-ink="graphite"] {
  cursor: url("data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' viewBox='0 0 20 20'%3E%3Ccircle cx='10' cy='10' r='8' fill='white' stroke='black' stroke-width='1.5'/%3E%3Cpath d='M7 7l6 6M13 7l-6 6' stroke='black' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E") 10 10, not-allowed;
}
.px.is-pending {
  outline: 1px dashed color-mix(in srgb, var(--ui-primary) 70%, transparent);
  outline-offset: -1px;
}
/* A stroke from another window lands with a ring that spreads and fades
   — the one motion on the grid, so a cell that changed under you is
   never a cell that was always so. */
.px.is-arrived {
  animation: arrive 0.9s ease-out both;
}
@keyframes arrive {
  0% { outline: 2px solid var(--ui-primary); outline-offset: 0px; }
  100% { outline: 2px solid transparent; outline-offset: 5px; }
}
@media (prefers-reduced-motion: reduce) {
  .px.is-arrived {
    animation: none;
    outline: 2px solid var(--ui-primary);
    outline-offset: 1px;
  }
}
.px:disabled { cursor: default; }
.px:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 1px; }
.is-snapshot {
  box-shadow: var(--recess-lip), var(--inset-shadow-2), inset 0 0 0 2px color-mix(in srgb, var(--ui-primary) 55%, transparent);
}

/* THE SCRUBBER — chrome.css's fader, with a round head instead of the
   console's strip, on a shorter travel. */
.fader {
  --fader-height: 1.2rem;
  --knob-width: 1.05rem;
  --knob-height: 1.05rem;
  --knob-radius: 999px;
  --knob-lift: -0.29rem;
}

/* THE TICKS — one hairline per commit under the groove, on the knob's
   own travel (inset by half the knob, so tick n sits under the knob at
   n). Drawn as an SVG stretched to the track: the lines keep their one
   pixel whatever the count, and snap to it. One weight for all of them;
   the read one is the accent. */
.ticks {
  display: block;
  inline-size: calc(100% - 1.05rem);
  block-size: 0.5rem;
  margin-inline: 0.525rem;
  overflow: visible;
}
.ticks line {
  stroke: var(--ui-text-dimmed);
  stroke-width: 1;
  opacity: 0.5;
  shape-rendering: crispEdges;
}
.ticks line.is-at { stroke: var(--ui-primary); stroke-width: 2; opacity: 1; }
</style>
