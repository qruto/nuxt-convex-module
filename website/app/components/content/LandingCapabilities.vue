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
// A token OPENS under the pointer, the way an editor shows a signature
// for the call under the caret: its parameters clatter into the
// brackets — `useQuery(query, args?)` — and clear again when the
// pointer leaves. The clock opens the tokens of the line it refreshes
// one after another. One token open per line at a time: a whole line
// of signatures does not fit its column on a laptop (2026-09-13, the
// three file-storage calls need ~520px of a 443px column), and one
// signature plus the bare names always fits in two rows. Every line
// keeps that second row whether or not anything is open, so opening
// spills into room the line already owns and nothing under it moves
// ("don't make the interface jump").
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

// Which token of each line is open (parameters showing), or -1.
// Reactive: the parameter flaps are rendered only while open.
const open = ref<number[]>(LINES.map(() => -1))

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
// The switch's marking, one reading per position.
const soundMark = computed(() => (sound.value
  ? { tone: 'text-toned', icon: 'i-lucide-volume-2', label: 'sound on' }
  : { tone: 'text-dimmed hover:text-toned', icon: 'i-lucide-volume-x', label: 'sound off' }))
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

// Open one token of a line (closing whichever was open): its parameter
// flaps mount, then clatter in. Under reduced motion they simply appear.
async function openToken(line: number, t: number) {
  if (!canHover.value || open.value[line] === t) return
  open.value[line] = t
  if (reduced.value) return
  await nextTick()
  if (open.value[line] !== t) return
  spinField(line, t, 'params', flaps(LINES[line]!.tokens[t]!.params), generation)
}
function closeToken(line: number, t: number) {
  if (open.value[line] === t) open.value[line] = -1
}

function clatter() {
  generation++
  LINES.forEach((_, line) => later(() => spinLine(line), line * 170))
}

// The board's own clock: clatter in on first sight, then every nine
// seconds or so refresh one line and walk its tokens, each open for a
// couple of seconds — unless the pointer is on the line, in which case
// the hover owns what is open. useDemoScript gates it to the viewport
// and pauses it with the tab; a pointerdown or focus inside the board
// stops the clock for good (hover is not a takeover: it works a token
// by itself, below).
const hovered = new Set<number>()
const root = ref<HTMLElement | null>(null)
useDemoScript(root, async ({ wait }) => {
  clatter()
  for (;;) {
    await wait(9000)
    const line = Math.floor(Math.random() * LINES.length)
    spinLine(line)
    for (let t = 0; t < LINES[line]!.tokens.length; t++) {
      if (hovered.has(line)) break
      void openToken(line, t)
      await wait(2200)
      if (!hovered.has(line)) closeToken(line, t)
    }
  }
}, { initialDelay: 400 })

// Hover on a token opens it; it closes a beat after the pointer leaves,
// so crossing the gap between two tokens does not blink. Hover on the
// line re-flips its names (throttled so a pointer crossing back and
// forth does not keep the drum turning).
const lastHover = new Map<number, number>()
const leaveTimers = new Map<number, ReturnType<typeof setTimeout>>()
function onEnterToken(line: number, t: number) {
  clearTimeout(leaveTimers.get(line))
  leaveTimers.delete(line)
  void openToken(line, t)
}
function onLeaveToken(line: number, t: number) {
  clearTimeout(leaveTimers.get(line))
  leaveTimers.set(line, setTimeout(() => {
    leaveTimers.delete(line)
    closeToken(line, t)
  }, 350))
}
function onEnter(line: number) {
  hovered.add(line)
  const now = performance.now()
  if (now - (lastHover.get(line) ?? 0) < 1500) return
  lastHover.set(line, now)
  spinLine(line)
}
function onLeave(line: number) {
  hovered.delete(line)
}

onMounted(() => {
  reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  canHover.value = window.matchMedia('(hover: hover)').matches
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
      class="lines m-0 grid list-none gap-x-3 gap-y-3 p-0"
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
             the token is open. No box, no accent (2026-09-13: boxes were
             too many, the accent did not read as code — the parens do). -->
        <span class="fns">
          <span class="sr-only">{{ reading(entry) }}</span>
          <span
            aria-hidden="true"
            class="flex flex-wrap gap-x-3"
          >
            <code
              v-for="(token, t) in entry.tokens"
              :key="token.name"
              class="token flex text-toned"
              @pointerenter="onEnterToken(line, t)"
              @pointerleave="onLeaveToken(line, t)"
            >
              <span
                v-for="(ch, i) in flaps(token.name)"
                :key="i"
                :ref="el => setCell(line, t, 'name', i, el)"
                class="flap"
              >{{ ch }}</span><span class="text-dimmed">(</span><span
                v-if="open[line] === t"
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
      </li>
    </ul>
    <!-- The sound switch: a small marking at the board's foot, off until
         asked. -->
    <button
      type="button"
      class="switch stamp mt-2 inline-flex cursor-pointer items-center gap-1.5 rounded-strip px-1 py-0.5 text-[0.58rem] outline-none focus-visible:ring-2 focus-visible:ring-primary"
      :class="soundMark.tone"
      :aria-pressed="sound"
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
   they sit on one baseline. With a hover pointer every line keeps TWO
   rows for its tokens — the second is where the tokens land when one
   of them opens and the row no longer fits, room the line owns at rest
   so opening moves nothing under it — and is clipped there, so on a
   column too narrow even for that the board still does not grow under
   the pointer.

   The gap BETWEEN lines is wider than a row, so a second row that fills
   sits nearer its own line than the next one's name — otherwise a
   wrapped signature read as the line below's. */
.lines {
  --row: 1rem;
  grid-template-columns: 1rem max-content minmax(0, 1fr);
}
.line {
  grid-column: 1 / -1;
  grid-template-columns: subgrid;
}
.name {
  line-height: var(--row);
}
@media (hover: hover) {
  .fns {
    block-size: calc(var(--row) * 2);
    overflow: hidden;
  }
}
/* A TOKEN: one composable set as a call — mono, the text ink, and the
   `()` after it in the dim ink with the parameters inside while the
   token is open. Nothing drawn around it: the name is display type, the
   token is mono with call syntax, and that is the whole difference
   between a name and something you type. A token never breaks: when
   its parameters do not fit the first row it drops whole to the second. */
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
