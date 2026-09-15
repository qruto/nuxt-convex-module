<script setup lang="ts">
// THE BOARD — the six headline features as six lines set straight on
// the hero ground, no housing (2026-09-13). The mark and the feature's
// name are plain type; every composable that is that feature is a code
// token written as a call, `useQuery()`, and each character of a token
// is one flap that flicks through the drum to its letter (the split
// hairline went 2026-09-13 — it read as a strike-through). All readable
// at rest; when the hero first comes into view the tokens clatter in
// line by line, and afterwards the board refreshes one line now and
// then, the way a departure board does.
//
// A line OPENS on hover, and the clock opens the line it refreshes: the
// parameters of every call on it clatter into the brackets —
// `useQuery(query, args?)` — and clear again when the pointer leaves or
// the clock moves on. A line is ONE row, open or closed: an open
// signature that outgrows the board's width does not wrap, it runs off
// the right edge and the row scrolls sideways (2026-09-14). Nothing
// under a line moves when it opens — "don't make the interface jump" —
// and nothing is clipped for good, only parked off the edge; the
// reserved second and third rows of the earlier setting went with this.
//
// THE SLOT. A row that overflows has to say so, and the clock opens
// lines with nobody's pointer on them, so a cursor alone does not
// (2026-09-14: "it's not obvious that we have a horizontal scroll
// here"). When a row overflows, a slot fades in around it: a shallow
// groove cut into the ground (the dish physics — the ground's own
// tone a step down, the lip, the cast under the top wall), and the
// type runs INTO the wall at either end — masked to nothing over the
// last 1.75rem — so the eye reads a tape passing under an edge rather
// than text that stops. The fade at the start only appears once there
// is something behind it. Then, when the CLOCK opened the line, the
// tape does the reading itself: a carriage sweep runs the row to its
// end, holds, and comes back, before the line closes. Hover owns its
// own line (no sweep; a wheel, a swipe, or a drag with the ew-resize
// pointer), and any touch of the tape stops a sweep in progress.
//
// Sound is a switch, off until asked (browsers will not play a note
// before a gesture anyway, and a landing page that clatters unasked is a
// landing page people mute). On, every flap is a short burst of
// band-limited noise; the choice is remembered per browser.
//
// This is the fourth setting of this block. The lit row, the seamed
// grid, the harness and the keypad all went ("no block — we already have
// one convex block, the demo, and one concave, the version board"). The
// board is type, not a part.
// A token is a name and the parameters it takes, as the reference
// writes them (content/4.api-reference).
interface Token {
  name: string
  params: string
}
interface Line {
  label: string
  tokens: Token[]
  icon: string
}
// The reading is one string to a screen reader, signatures and all; the
// flaps are the drawing.
function reading(line: Line) {
  return line.tokens.map(t => `${t.name}(${t.params})`).join(', ')
}

const LINES: Line[] = [
  {
    label: 'live queries',
    icon: 'i-lucide-radio',
    tokens: [
      { name: 'useQuery', params: 'query, args?' },
      { name: 'useQueries', params: 'queries' },
    ],
  },
  {
    label: 'mutations',
    icon: 'i-lucide-pen-line',
    tokens: [
      { name: 'useMutation', params: 'mutation' },
      { name: '.withOptimisticUpdate', params: 'update' },
    ],
  },
  {
    label: 'cursor pagination',
    icon: 'i-lucide-gallery-vertical-end',
    tokens: [
      { name: 'usePaginatedQuery', params: 'query, args, options' },
      { name: 'insertAtTop', params: 'options' },
    ],
  },
  {
    label: 'file storage',
    icon: 'i-lucide-file-up',
    tokens: [
      { name: 'useUpload', params: 'generateUploadUrl, options?' },
      { name: 'useUploadQueue', params: 'generateUploadUrl, options?' },
      { name: 'useStorageUrl', params: 'getUrl, storageId' },
    ],
  },
  {
    label: 'actions',
    icon: 'i-lucide-zap',
    tokens: [{ name: 'useAction', params: 'action' }],
  },
  {
    label: 'server & ssr',
    icon: 'i-lucide-server',
    tokens: [
      { name: 'useAsyncQuery', params: 'query, args?, options?' },
      { name: 'preloadQuery', params: 'query, args?' },
      { name: 'fetchQuery', params: 'query, args?' },
    ],
  },
]

// Which lines are open (parameters showing). Reactive: the parameter
// flaps are rendered only while their line is open.
const open = ref<boolean[]>(LINES.map(() => false))
// Which lines run past the board's edge, and so scroll. Measured when
// a line opens or closes (after the parameter flaps mount or go) and
// whenever the board is resized — a narrow board overflows at rest,
// closed — so the slot and the cursor only promise a scroll where
// there is one. `edge` is where the tape stands — at its start, at its
// end, or between — which is which wall the type fades under.
const scrolls = ref<boolean[]>(LINES.map(() => false))
const edge = ref<{ start: boolean, end: boolean }[]>(LINES.map(() => ({ start: true, end: true })))
const rails = new Map<number, HTMLElement>()
let sizer: ResizeObserver | null = null
function setRail(line: number, el: unknown) {
  const node = el as HTMLElement | null
  const prev = rails.get(line)
  if (prev && prev !== node) sizer?.unobserve(prev)
  if (node) {
    rails.set(line, node)
    sizer?.observe(node)
  }
  else rails.delete(line)
}
function measure(line: number) {
  const rail = rails.get(line)
  if (!rail) return
  scrolls.value[line] = rail.scrollWidth > rail.clientWidth
  readEdges(line)
}
function readEdges(line: number) {
  const rail = rails.get(line)
  if (!rail) return
  const max = rail.scrollWidth - rail.clientWidth
  edge.value[line] = { start: rail.scrollLeft <= 1, end: rail.scrollLeft >= max - 1 }
}

// ---- the carriage sweep ---------------------------------------------------
// When the clock opens a line that overflows, the tape runs to its end,
// holds, and comes back — the row reading itself out, since no pointer
// is there to. One rAF loop per line; anything real on the tape (a
// wheel, a drag, the pointer arriving) cancels it where it stands.
const SWEEP_OUT = 900
const SWEEP_HOLD = 700
const SWEEP_BACK = 900
const sweeps = new Map<number, number>()
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)
function sweep(line: number) {
  const rail = rails.get(line)
  if (!rail || reduced.value || hovered.has(line) || sweeps.has(line)) return
  const max = rail.scrollWidth - rail.clientWidth
  if (max <= 0) return
  const t0 = performance.now()
  const frame = (now: number) => {
    const t = now - t0
    let p: number
    if (t < SWEEP_OUT) p = easeInOut(t / SWEEP_OUT)
    else if (t < SWEEP_OUT + SWEEP_HOLD) p = 1
    else if (t < SWEEP_OUT + SWEEP_HOLD + SWEEP_BACK) p = 1 - easeInOut((t - SWEEP_OUT - SWEEP_HOLD) / SWEEP_BACK)
    else {
      rail.scrollLeft = 0
      sweeps.delete(line)
      return
    }
    rail.scrollLeft = p * max
    sweeps.set(line, requestAnimationFrame(frame))
  }
  sweeps.set(line, requestAnimationFrame(frame))
}
function stopSweep(line: number) {
  const id = sweeps.get(line)
  if (id !== undefined) cancelAnimationFrame(id)
  sweeps.delete(line)
}

// ---- the drag ---------------------------------------------------------------
// The ew-resize pointer is a promise: a mouse can take the tape and
// pull it. Touch pans natively (touch-action below), so only a mouse
// drags here.
let drag: { line: number, x: number, left: number } | null = null
function onDragStart(line: number, e: PointerEvent) {
  if (e.pointerType !== 'mouse' || !scrolls.value[line]) return
  const rail = rails.get(line)
  if (!rail) return
  stopSweep(line)
  drag = { line, x: e.clientX, left: rail.scrollLeft }
  rail.setPointerCapture(e.pointerId)
}
function onDragMove(e: PointerEvent) {
  if (!drag) return
  const rail = rails.get(drag.line)
  if (rail) rail.scrollLeft = drag.left - (e.clientX - drag.x)
}
function onDragEnd() {
  drag = null
}

// A word as flaps. Spaces are blank flaps: they hold their width and
// never turn. NBSP so the flex row cannot collapse them.
const NBSP = ' '
const flaps = (text: string) => Array.from(text, ch => (ch === ' ' ? NBSP : ch))

const GLYPHS = 'abcdefghijklmnopqrstuvwxyz0123456789.-_/:#'
const FLICK_MS = 70

// The flap elements, gathered off the template so the drum can turn
// them without a reactive string per character:
// [line][token][name | params][char].
type Part = 'name' | 'params'
const cells = new Map<string, HTMLElement>()
const cellKey = (line: number, token: number, part: Part, i: number) => `${line}:${token}:${part}:${i}`
function setCell(line: number, token: number, part: Part, i: number, el: unknown) {
  const node = el as HTMLElement | null
  if (node) cells.set(cellKey(line, token, part, i), node)
  else cells.delete(cellKey(line, token, part, i))
}

// ---- sound ------------------------------------------------------------------
const SOUND_KEY = 'nc-board-sound'
const sound = ref(false)
// The switch is written as the thing a press DOES, not the position it
// is in: everyone arrives with sound off, so the off position is the
// board's one call — "turn sound on", in the accent ink, the way the
// demo's "try real-time" is set. Once on, the same switch goes quiet
// (dim ink, "turn sound off"): a way back, not a call. The label
// changes with the state, so there is no aria-pressed on top of it.
const soundMark = computed(() => (sound.value
  ? { tone: 'text-dimmed hover:text-toned', icon: 'i-lucide-volume-x', label: 'turn sound off' }
  : { tone: 'text-lit', icon: 'i-lucide-volume-2', label: 'turn sound on' }))
let audio: AudioContext | null = null
let noise: AudioBuffer | null = null
let lastClack = 0

async function toggleSound() {
  sound.value = !sound.value
  try {
    localStorage.setItem(SOUND_KEY, sound.value ? '1' : '0')
  }
  catch {
    // Private mode or storage off: the switch still works for this visit.
  }
  if (!sound.value) return
  if (!audio) {
    audio = new AudioContext()
    noise = audio.createBuffer(1, Math.floor(audio.sampleRate * 0.05), audio.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  if (audio.state === 'suspended') await audio.resume()
  // Hear it at once: the board clatters in again.
  clatter()
}

function clack() {
  if (!sound.value || !audio || !noise) return
  const now = performance.now()
  if (now - lastClack < 16) return
  lastClack = now
  const t = audio.currentTime
  const src = audio.createBufferSource()
  src.buffer = noise
  const band = audio.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 1800 + Math.random() * 2200
  band.Q.value = 1.4
  const gain = audio.createGain()
  gain.gain.setValueAtTime(0.09, t)
  gain.gain.exponentialRampToValueAtTime(0.0008, t + 0.035)
  src.connect(band)
  band.connect(gain)
  gain.connect(audio.destination)
  src.start(t)
  src.stop(t + 0.045)
}

// ---- the drum ---------------------------------------------------------------
// Every turn of a flap is a timer; a generation number lets a new
// clatter (or unmount) cancel the ones still queued — a cancelled flap
// lands on its letter at once.
let generation = 0
const timers = new Set<ReturnType<typeof setTimeout>>()
function later(fn: () => void, ms: number) {
  const id = setTimeout(() => {
    timers.delete(id)
    fn()
  }, ms)
  timers.add(id)
}

function spin(el: HTMLElement, target: string, turns: number, delay: number, gen: number) {
  let i = 0
  const step = () => {
    if (gen !== generation) {
      el.textContent = target
      return
    }
    const done = i >= turns
    el.textContent = done ? target : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]!
    el.classList.remove('flick')
    void el.offsetWidth
    el.classList.add('flick')
    clack()
    if (!done) {
      i++
      later(step, FLICK_MS)
    }
  }
  later(step, delay)
}

function spinField(line: number, token: number, part: Part, text: string[], gen: number) {
  text.forEach((target, i) => {
    if (target === NBSP) return
    const el = cells.get(cellKey(line, token, part, i))
    if (!el) return
    spin(el, target, 2 + Math.floor(i / 4) + Math.floor(Math.random() * 3), i * 10, gen)
  })
}

const reduced = ref(false)
// Opening is a hover thing. Without a hover pointer (a phone) the lines
// stay closed and the board keeps its compact single rows (below).
const canHover = ref(false)
function spinLine(line: number) {
  if (reduced.value) return
  const gen = generation
  LINES[line]!.tokens.forEach((token, t) => spinField(line, t, 'name', flaps(token.name), gen))
}

// Open a line: its parameter flaps mount, then clatter in. Under
// reduced motion they simply appear.
async function openLine(line: number) {
  if (!canHover.value || open.value[line]) return
  open.value[line] = true
  await nextTick()
  if (!open.value[line]) return
  measure(line)
  if (reduced.value) return
  const gen = generation
  LINES[line]!.tokens.forEach((token, t) => spinField(line, t, 'params', flaps(token.params), gen))
}
async function closeLine(line: number) {
  open.value[line] = false
  stopSweep(line)
  // Back to the start of the row, so the next opening reads from the
  // name, not from wherever the last scroll left it.
  const rail = rails.get(line)
  if (rail) rail.scrollLeft = 0
  await nextTick()
  if (!open.value[line]) measure(line)
}

function clatter() {
  generation++
  LINES.forEach((_, line) => later(() => spinLine(line), line * 170))
}

// The board's own clock: clatter in on first sight, then every nine
// seconds or so refresh one line and open it for a few seconds — the
// tape sweeping if the line overflows, once its parameters have
// clattered in (~1s: the longest list is 27 flaps at 10ms plus up to
// ten turns at 70) — unless the pointer is on it, in which case the
// hover owns the close.
// useDemoScript gates it to the viewport and pauses it with the tab; a
// pointerdown or focus inside the board stops the clock for good (hover
// is not a takeover: it works a line by itself, below).
const hovered = new Set<number>()
const root = ref<HTMLElement | null>(null)
useDemoScript(root, async ({ wait }) => {
  clatter()
  for (;;) {
    await wait(9000)
    const line = Math.floor(Math.random() * LINES.length)
    spinLine(line)
    await openLine(line)
    if (scrolls.value[line]) later(() => sweep(line), 1000)
    await wait(SWEEP_OUT + SWEEP_HOLD + SWEEP_BACK + 2000)
    if (!hovered.has(line)) closeLine(line)
  }
}, { initialDelay: 400 })

// Hover opens a line and re-flips its names (the re-flip throttled so a
// pointer crossing back and forth does not keep the drum turning); the
// line closes a beat after the pointer leaves, so a brush across the
// gap between two lines does not blink.
const lastHover = new Map<number, number>()
const leaveTimers = new Map<number, ReturnType<typeof setTimeout>>()
function onEnter(line: number) {
  hovered.add(line)
  stopSweep(line)
  clearTimeout(leaveTimers.get(line))
  leaveTimers.delete(line)
  void openLine(line)
  const now = performance.now()
  if (now - (lastHover.get(line) ?? 0) < 1500) return
  lastHover.set(line, now)
  spinLine(line)
}
function onLeave(line: number) {
  hovered.delete(line)
  clearTimeout(leaveTimers.get(line))
  leaveTimers.set(line, setTimeout(() => {
    leaveTimers.delete(line)
    closeLine(line)
  }, 350))
}

onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  canHover.value = window.matchMedia('(hover: hover)').matches
  sizer = new ResizeObserver(() => LINES.forEach((_, line) => measure(line)))
  for (const rail of rails.values()) sizer.observe(rail)
  try {
    sound.value = localStorage.getItem(SOUND_KEY) === '1'
  }
  catch {
    // No storage: the switch starts off, as it should.
  }
})
onBeforeUnmount(() => {
  generation++
  for (const id of timers) clearTimeout(id)
  timers.clear()
  for (const id of leaveTimers.values()) clearTimeout(id)
  leaveTimers.clear()
  for (const line of sweeps.keys()) stopSweep(line)
  sizer?.disconnect()
  audio?.close()
})
</script>

<template>
  <div
    ref="root"
    class="board"
  >
    <ul
      aria-label="What the module ships"
      class="lines m-0 grid list-none gap-x-3 gap-y-5 p-0"
    >
      <li
        v-for="(entry, line) in LINES"
        :key="entry.label"
        class="line m-0 grid items-start p-0"
        @pointerenter="onEnter(line)"
        @pointerleave="onLeave(line)"
      >
        <UIcon
          :name="entry.icon"
          class="mt-[0.0625rem] size-4 text-toned"
          aria-hidden="true"
        />
        <span class="name pe-2 font-display text-[0.95rem] font-semibold text-highlighted">{{ entry.label }}</span>
        <!-- The composables are code, and written the way a reference
             writes a function: `useQuery()`, mono, the call parens in the
             dim ink, and the parameters in the dim ink inside them while
             the line is open. No box, no accent (2026-09-13: boxes were
             too many, the accent did not read as code — the parens do). -->
        <!-- The row: the slot (the groove, painted by ::before once the
             row overflows) around the rail (the scroller, its type
             fading under the walls) around the tape (the tokens, with
             the slot's wall clearance as its own padding, so the type
             stands where it would without any of this). -->
        <span
          class="fns"
          :class="{ 'is-scroll': scrolls[line] }"
        >
          <span class="sr-only">{{ reading(entry) }}</span>
          <span
            :ref="el => setRail(line, el)"
            aria-hidden="true"
            class="rail"
            :class="{ 'at-start': edge[line]!.start, 'at-end': edge[line]!.end }"
            @scroll.passive="readEdges(line)"
            @wheel.passive="stopSweep(line)"
            @touchstart.passive="stopSweep(line)"
            @pointerdown="onDragStart(line, $event)"
            @pointermove="onDragMove"
            @pointerup="onDragEnd"
            @pointercancel="onDragEnd"
          >
            <span class="tape flex w-max gap-x-3">
              <code
                v-for="(token, t) in entry.tokens"
                :key="token.name"
                class="token flex shrink-0 text-toned"
              >
                <span
                  v-for="(ch, i) in flaps(token.name)"
                  :key="i"
                  :ref="el => setCell(line, t, 'name', i, el)"
                  class="flap"
                >{{ ch }}</span><span class="text-dimmed">(</span><span
                  v-if="open[line]"
                  class="params flex text-dimmed"
                ><span
                  v-for="(ch, i) in flaps(token.params)"
                  :key="i"
                  :ref="el => setCell(line, t, 'params', i, el)"
                  class="flap"
                  :class="{ blank: ch === NBSP }"
                >{{ ch }}</span></span><span class="text-dimmed">)</span>
              </code>
            </span>
          </span>
        </span>
      </li>
    </ul>
    <!-- The sound switch at the board's foot. Off (everyone's arrival)
         it is the board's one call, in the accent ink; on, it is a
         quiet way back. -->
    <button
      type="button"
      class="switch stamp mt-5 inline-flex cursor-pointer items-center gap-1.5 rounded-strip px-1 py-0.5 text-[0.62rem] outline-none focus-visible:ring-2 focus-visible:ring-primary"
      :class="soundMark.tone"
      @click="toggleSound"
    >
      <UIcon
        :name="soundMark.icon"
        class="size-3"
        aria-hidden="true"
      />
      <span>{{ soundMark.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.board {
  container-type: inline-size;
}
/* Mark, name, composables on one line. The list is the grid and each
   line a subgrid row of it, so the name column is cut ONCE, to the
   longest name, and every row of tokens starts on one edge.

   One row of the board is --row; the name and the tokens share it so
   they sit on one baseline. A line's tokens are ONE row whether or not
   it is open: an open signature that does not fit runs past the edge
   and the row scrolls sideways (below), so opening moves nothing. */
.lines {
  --row: 0.95rem;
  grid-template-columns: 1rem max-content minmax(0, 1fr);
}
.line {
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}
.name {
  line-height: var(--row);
}
/* THE ROW of tokens: slot, rail, tape.

   The SLOT is the box a groove will be cut in. It is always there —
   one row plus a wall's clearance above and below, reaching --slot-x
   into the name's padding on the left and the same over the edge on
   the right — with the clearance paid back in negative margin, so the
   grid row stays one --row tall and the tape stands exactly where a
   bare row would. The groove itself is a ::before that fades in once
   the row overflows: the dish physics (the ground's tone a step down,
   an opaque fill that stops the mill grain, the lip, the cast under the
   top wall, the floor catch), not a plate's lighter well — the board
   is cut into the ground it sits on. */
.fns {
  --slot-x: 0.5rem;
  --slot-y: 0.3rem;
  position: relative;
  isolation: isolate;
  block-size: calc(var(--row) + 2 * var(--slot-y));
  margin-inline: calc(-1 * var(--slot-x));
  margin-block: calc(-1 * var(--slot-y));
  padding-block: var(--slot-y);
}
.fns::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: var(--radius-well);
  background: var(--gradient-recessed-ground);
  box-shadow: var(--recess-lip-ground), var(--inset-shadow-2), var(--dish-ground-floor), var(--dish-ground-rim);
  opacity: 0;
  transition: opacity 220ms ease;
}
.fns.is-scroll::before {
  opacity: 1;
}
/* The RAIL is the scroller. One row high, the overflow sideways, no
   bar drawn (a bar would add a height and the line would jump). Where
   the tape runs under a wall the type is masked to nothing over its
   last 3rem, gone a third of a wall short of the lip so nothing ever
   touches it — the sign that there is more — and the mask at either
   end comes and goes with the tape's position: none at the start until
   something has passed behind it, none at the end once the end is in
   view. The two lengths are registered so the coming and going is a
   slide, not a cut. */
@property --board-fade-s {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}
@property --board-fade-e {
  syntax: '<length>';
  inherits: false;
  initial-value: 0px;
}
.rail {
  --board-fade-s: 0px;
  --board-fade-e: 0px;
  display: block;
  block-size: var(--row);
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  touch-action: pan-x pan-y;
  --wall: calc(var(--slot-x) / 3);
  mask-image: linear-gradient(to right,
    transparent min(var(--wall), var(--board-fade-s)), #000 var(--board-fade-s),
    #000 calc(100% - var(--board-fade-e)), transparent calc(100% - min(var(--wall), var(--board-fade-e))));
  transition: --board-fade-s 200ms ease, --board-fade-e 200ms ease;
}
.rail::-webkit-scrollbar {
  display: none;
}
.fns.is-scroll .rail {
  cursor: ew-resize;
}
.fns.is-scroll .rail:not(.at-start) {
  --board-fade-s: 3rem;
}
.fns.is-scroll .rail:not(.at-end) {
  --board-fade-e: 3rem;
}
/* The TAPE carries the wall clearance as its own padding — inside the
   scroller, so the last token stops a wall's width short of the end
   wall, the same as the first stands off the start. */
.tape {
  padding-inline: var(--slot-x);
}
/* A TOKEN: one composable set as a call — mono, the text ink, and the
   `()` after it in the dim ink with the parameters inside while the
   token is open. Nothing drawn around it: the name is display type, the
   token is mono with call syntax, and that is the whole difference
   between a name and something you type. A token never breaks or
   shrinks: what does not fit the row rides past the edge and scrolls. */
.token {
  font-family: var(--font-mono);
  font-size: 0.78rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  line-height: var(--row);
}
/* The parameters, a size down from the name — a hint in the brackets,
   not a second name. */
.params {
  font-size: 0.8em;
}
/* A FLAP: one character of a token. It flicks about its own middle.
   Blank flaps are the spaces between parameters; they hold their width
   and never turn. */
.flap {
  display: inline-block;
  text-align: center;
  transform-origin: 50% 50%;
}
.flap.blank {
  min-inline-size: 0.6em;
}
.flap.flick {
  animation: flap-flick 70ms linear;
}
@keyframes flap-flick {
  0% { transform: scaleY(1); }
  50% { transform: scaleY(0.12); }
  100% { transform: scaleY(1); }
}
/* On a phone the composables drop under the name. */
@container (width < 32rem) {
  .lines {
    grid-template-columns: 1rem minmax(0, 1fr);
  }
  .line {
    row-gap: 0.25rem;
  }
  .fns {
    grid-column: 2;
  }
}
@media (prefers-reduced-motion: reduce) {
  .flap.flick {
    animation: none;
  }
}
</style>
