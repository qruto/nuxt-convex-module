<script setup lang="ts">
import type { DemoTools } from '~/composables/useDemoScript'
import type { CodeReveal } from '~/utils/code-reveal'
import { api } from '#convex/api'
import FlapText from '../landing/FlapText.vue'

// The hero's signature, in two acts. Act one is a recording: the general
// composables type themselves out scene by scene — live query, mutation,
// pagination, upload — each rendering a simulated readout on the BOARD
// below. Act two is the handoff: the final scene types the code that
// actually runs this panel, and the board swaps to the real Convex
// deployment over a real WebSocket — rows off the shared table, and the
// composer writes to it.
//
// THE BOARD IS A SPLIT-FLAP DISPLAY (2026-09-08). The readout used to be a
// chat log, which is the most-shown Convex demo there is. The same table,
// the same code, but the rows land the way a departure board's do: every
// character flips through the drum to its letter, so a mutation landing
// from anywhere clatters in across the row. One visitor alone gets the
// full effect — post a line and watch the board turn to it.
//
// SSR, no-JS, and reduced-motion all get act two directly: the server renders
// the live panel (rows in the HTML on first paint via `useAsyncQuery`), and
// the recording only arms client-side through useDemoScript. Touch anything
// inside the plate mid-recording and it jumps straight to live.
const client = useConvex()
const { data, error } = client
  ? await useAsyncQuery(api.messages.list, {})
  : { data: shallowRef([]), error: shallowRef(null) }

const send = client ? useMutation(api.messages.send) : undefined

// Only the tail fits the board; the panel is a readout, not the archive.
// Rows are keyed by SLOT, not by document: a new line then flips the slot
// it lands in from the line that was there, which is the whole board.
const VISIBLE = 4
const liveShown = computed(() => (data.value ?? []).slice(-VISIBLE))
// Flaps per line — the board's width in characters, sized to the plate.
const cells = 22

const online = useDemoOnline(error)

// The per-visitor handle every demo on the page shares (useVisitor): your
// own rows read as yours here and on the switchboard alike.
const { handle } = useVisitor()

const draft = ref('')
const sending = ref(false)
const rtt = ref<number | null>(null)
const rejection = ref<string | null>(null)

async function submit() {
  const body = draft.value.trim()
  if (!body || sending.value || !send) return
  sending.value = true
  rejection.value = null
  const t0 = performance.now()
  try {
    await send({ author: handle.value, body })
    // Real round trip: mutation dispatched → server committed → resolved.
    rtt.value = Math.round(performance.now() - t0)
    draft.value = ''
  }
  catch (e) {
    // The table is public, so the mutation moderates AND rate-limits every
    // write. A rejection is a legitimate outcome to render, not a crash —
    // and it arrives as a ConvexError payload, so the actual reason is
    // showable (see demo-error.ts).
    rejection.value = demoRejectionReason(e)
  }
  finally {
    sending.value = false
  }
}

// ---- The recording ---------------------------------------------------------
// Scenes arrive as five fenced code blocks from content/index.md (order is
// the contract, see codeSlotParts) and render through ProsePre, stacked in
// one grid cell so the well never changes height between scenes. Typing is
// a reveal over the pre-highlighted DOM (code-reveal.ts) — every character
// lands already wearing its token color.
// SIX SCENES, ONE PER LEGEND ROW (2026-09-08). The recording used to run
// five and the capability legend beside it had six entries, so one row
// (Actions) never lit and the last scene lit two at once. The order here
// IS the order of the legend, and the order of the fenced blocks in
// content/index.md — the lamp walks the list top to bottom.
const SCENES = [
  { id: 'QUERY', label: 'live query' },
  { id: 'MUTATION', label: 'mutation' },
  { id: 'PAGINATION', label: 'pagination' },
  { id: 'FILES', label: 'file upload' },
  { id: 'ACTION', label: 'action' },
  { id: 'LIVE', label: 'going live' },
] as const

const parts = codeSlotParts(useSlots(), SCENES.length)

// 'live' is the default on both sides of hydration; the script flips to
// 'recording' only after mount, so SSR markup can't mismatch.
const mode = ref<'recording' | 'live'>('live')
const scene = ref(SCENES.length - 1)

interface SimRow {
  id: number
  author: string
  body: string
  pending?: boolean
}
const sim = reactive({
  rows: [] as SimRow[],
  chip: null as string | null,
  progress: null as number | null,
})
const simShown = computed(() => sim.rows.slice(-VISIBLE))
let simId = 0
function simRow(author: string, body: string, pending = false) {
  sim.rows.push({ id: ++simId, author, body, pending })
}

const sceneEls = ref<(HTMLElement | null)[]>([])
function setSceneEl(index: number, el: unknown) {
  sceneEls.value[index] = (el as HTMLElement | null) ?? null
}

const reveals = new Map<number, CodeReveal | null>()
function revealFor(index: number): CodeReveal | null {
  if (!reveals.has(index)) {
    const el = sceneEls.value[index]
    reveals.set(index, el ? createCodeReveal(el) : null)
  }
  return reveals.get(index) ?? null
}

function prepareScene(index: number) {
  sim.chip = null
  sim.progress = null
  if (index === 0 || index === 3 || index === 4) sim.rows = []
  if (index === 2) {
    sim.rows = []
    const authors = ['ada', 'lin', 'kai']
    for (let n = 1; n <= 3; n++) simRow(authors[(n - 1) % 3]!, `message ${n}`)
    sim.chip = '3 of 9'
  }
  // index 1 keeps scene 0's rows — the mutation lands under them.
}

async function playScene(index: number, t: DemoTools) {
  const { wait } = t
  if (index === 0) {
    await wait(500)
    simRow('ada', 'the socket is open')
    await wait(430)
    simRow('lin', 'every client sees this row')
    await wait(430)
    simRow('kai', 'in real time')
    sim.chip = 'subscribed'
    await wait(1500)
  }
  else if (index === 1) {
    await wait(400)
    simRow('you', 'hi, realtime', true)
    const row = sim.rows[sim.rows.length - 1]!
    await wait(300)
    row.pending = false
    sim.chip = 'commit 42 ms'
    await wait(1700)
  }
  else if (index === 2) {
    const authors = ['ada', 'lin', 'kai']
    for (let page = 1; page <= 2; page++) {
      await wait(800)
      sim.chip = 'loadMore(3)'
      await wait(380)
      const from = page * 3
      for (let n = from + 1; n <= from + 3; n++) simRow(authors[(n - 1) % 3]!, `message ${n}`)
      sim.chip = `${from + 3} of 9${from + 3 === 9 ? ' · exhausted' : ''}`
    }
    await wait(1600)
  }
  else if (index === 3) {
    await wait(400)
    sim.progress = 0
    while (sim.progress < 100) {
      await wait(70)
      sim.progress = Math.min(100, sim.progress + 9)
    }
    await wait(260)
    sim.progress = null
    simRow('you', 'schematic.png · 84 kb')
    sim.chip = 'id kg24d8mn7apf…9d1'
    await wait(1700)
  }
  else if (index === 4) {
    // An action runs on the server and RETURNS: the row is posted
    // pending, then the same slot flips to the value that came back —
    // which is exactly what the board is good at showing.
    await wait(420)
    simRow('action', 'analyze(\'the socket is open\')', true)
    sim.chip = 'running on node'
    const row = sim.rows[sim.rows.length - 1]!
    await wait(900)
    row.pending = false
    row.body = 'sha256 3f9ac17 · 5 words'
    sim.chip = 'returned 612 ms'
    await wait(1600)
  }
  else {
    // The handoff beat: the panel's own code is on the plate — go live.
    await wait(600)
  }
}

// The capability legend in the copy is this panel's key: it lights whichever
// entry the plate is demonstrating. Scene id while recording, LIVE once the
// real query is on the plate (the legend maps LIVE to live queries) — and
// nothing while the socket is down: a lamp over "deployment unreachable"
// would be the panel claiming a subscription it does not have. See
// useHeroScene for why the served HTML never carries a lit entry.
const heroScene = useHeroScene()
watchEffect(() => {
  heroScene.value = mode.value === 'recording'
    ? SCENES[scene.value]!.id
    : online.value ? 'LIVE' : null
})

const plate = ref<HTMLElement | null>(null)
const { state, replay } = useDemoScript(plate, async (t) => {
  mode.value = 'recording'
  for (let i = 0; i < SCENES.length; i++) {
    const reveal = revealFor(i)
    reveal?.reset()
    prepareScene(i)
    scene.value = i
    await t.wait(420)
    if (reveal) await typeCode(t.wait, reveal)
    await playScene(i, t)
  }
  mode.value = 'live'
}, { initialDelay: 500 })

// Takeover mid-recording (any pointer/key inside the plate) stops the engine;
// land the panel on the live act with its real code fully on the plate.
watch(state, (value) => {
  if (value === 'stopped' && mode.value === 'recording') {
    revealFor(SCENES.length - 1)?.finish()
    scene.value = SCENES.length - 1
    mode.value = 'live'
  }
})
</script>

<template>
  <!-- The instrument panel — a `part-plate`, the ONE step every plate on
       the page stands off the ground (2026-09-07: it used to be `convex-3`,
       the deepest cast on the site, and read as a slab floating over the
       hero rather than a part bolted to it). Its own size container: the
       narrow tweaks query the panel, not the viewport.

       Capped at 32rem rather than filling the hero's right column: an
       instrument that stretches to whatever room it is given reads as a
       panel of the page instead of a part on it. `w-full` is load-bearing
       under `@container` — see the git history of this file for why a
       fit-content width collapses to the padding. -->
  <figure
    ref="plate"
    class="part-plate sheen noise @container relative mx-auto my-0 w-full max-w-[32rem] px-6 pt-5 pb-5 lg:end-4 lg:me-0 motion-safe:animate-fade-up [animation-delay:160ms] [animation-duration:700ms] @max-[30rem]:px-4.5"
    aria-label="A recorded tour of the client's composables that ends on a live Convex query rendering real rows"
  >
    <!-- The header is the file tab and nothing else; state has exactly one
         home, the rail at the foot. -->
    <header class="mb-3.5 flex items-center gap-4 stamp @max-[30rem]:gap-3">
      <span class="concave-text text-toned">app.vue</span>
    </header>

    <!-- Source well. Five scene fences stacked in one grid cell — the tallest
         sets the height, so scene changes never pump the plate. Type is sized
         off the panel with a floor that keeps phones readable. The pre is a
         `part-tray`: the deep cut a whole stage sits in. -->
    <div class="@container grid [&>div]:[grid-area:1/1] [&>div>div]:my-0 [&_button]:hidden [&_pre]:part-code [&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:px-4 [&_pre]:py-4 [&_pre]:text-[clamp(0.72rem,calc((100cqi-2rem)/37),0.875rem)] [&_pre]:leading-[1.75] ">
      <div
        v-for="(part, index) in parts"
        :key="SCENES[index]!.id"
        :ref="el => setSceneEl(index, el)"
        class="transition-opacity duration-300"
        :class="scene === index ? 'visible opacity-100' : 'invisible opacity-0'"
      >
        <component :is="part" />
      </div>
    </div>

    <!-- The connector — source feeds the output. -->
    <div
      class="my-2.5 flex items-center gap-2.5 stamp text-[0.58rem]"
      aria-hidden="true"
    >
      <span class="h-px flex-1 bg-linear-to-r from-transparent to-primary/30" />
      <span class="concave-text flex-none text-toned">renders</span>
      <span class="h-px flex-1 bg-linear-to-r from-primary/30 to-transparent" />
    </div>

    <!-- Rendered readout — the active scene's result as UI while recording,
         the real query result once live. Bottom-anchored like a log, at a
         FIXED height so the panel never grows under the hero. The shallow
         `part-well`: the second of two cuts in a plate that is already a
         raised part, cut the same distance as the composer under it. -->
    <div class="part-well overflow-hidden px-4.5 py-3.5">
      <ul
        class="m-0 flex h-28 list-none flex-col justify-end gap-2 p-0 font-mono text-xs"
        aria-live="polite"
      >
        <template v-if="mode === 'live'">
          <li
            v-for="(m, i) in liveShown"
            :key="i"
            class="flex min-w-0 items-center gap-2"
          >
            <span
              class="chip"
              :class="m.author === handle ? 'chip-lit' : undefined"
            >{{ m.author }}</span>
            <FlapText
              :text="m.body"
              :cells="cells"
              class="min-w-0"
            />
          </li>
          <li
            v-if="!liveShown.length"
            class="text-muted"
          >
            {{ error ? 'deployment unreachable' : 'the board is blank — post the first line ↓' }}
          </li>
        </template>
        <template v-else>
          <!-- Keyed on the pending flag too: the pending→committed flip
               remounts the row, so the commit re-lands with its own flash. -->
          <li
            v-for="(row, i) in simShown"
            :key="i"
            class="flex min-w-0 items-center gap-2"
            :class="row.pending ? 'opacity-70' : undefined"
          >
            <span
              class="chip"
              :class="row.author === 'you' ? (row.pending ? 'chip-pending' : 'chip-lit') : undefined"
            >{{ row.author }}</span>
            <FlapText
              :text="row.body"
              :cells="cells"
              class="min-w-0"
            />
          </li>
          <li
            v-if="sim.progress !== null"
            class="flex min-w-0 items-center gap-2"
          >
            <span class="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-(--ui-border-accented)">
              <span
                class="block h-full rounded-full bg-primary transition-[width] duration-100 ease-out"
                :style="{ width: `${sim.progress}%` }"
              /></span>
            <span class="stamp flex-none text-lit tabular-nums">{{ sim.progress }}%</span>
          </li>
          <li
            v-if="!simShown.length && sim.progress === null"
            class="text-muted"
          >
            …
          </li>
        </template>
      </ul>
    </div>

    <!-- Composer — the write half of the panel, wired to the real table the
         whole time. Touching it mid-recording IS the takeover. -->
    <form
      class="mt-3 flex gap-2 @max-[30rem]:flex-wrap"
      @submit.prevent="submit"
    >
      <label
        class="part-well flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 transition-shadow duration-180 ease-out focus-within:ring-2 focus-within:ring-primary"
        :class="sending ? 'opacity-65' : undefined"
      >
        <span class="sr-only">Post a line to the live board</span>
        <span
          class="chip chip-lit border-0 px-0"
          aria-hidden="true"
        >{{ handle }}</span>
        <input
          v-model="draft"
          :disabled="!client || !!error"
          maxlength="140"
          placeholder="post a line…"
          class="min-w-0 flex-1 border-0 bg-transparent py-1 font-mono text-xs text-highlighted outline-none placeholder:text-dimmed"
        >
      </label>
      <!-- The transmit key — wordless, the messenger idiom: an accent key
           with an up arrow, press physics from the button theme. -->
      <UButton
        icon="i-lucide-arrow-up"
        color="primary"
        size="md"
        square
        type="submit"
        class="flex-none"
        :aria-label="sending ? 'Sending…' : 'Send'"
        :ui="sending ? { leadingIcon: 'motion-safe:animate-pulse' } : undefined"
        :disabled="sending || !draft.trim() || !client || !!error"
      />
    </form>

    <!-- THE STATUS RAIL — the panel's one readout, and the only place it
         reports state (the cells and their scribes are chrome.css's .rail).

           state    the lamp. rec while the script runs (signal orange —
                    authored, ours), live once the socket is up (green — a
                    machine fact). offline kills the light.
           subject  what is being reported on: the scene, or the table.
           event    the last thing that happened: the sim chip, or the
                    hydration / commit latency / a rejected write.
           action   replay, in its own bay past the last scribe. -->
    <figcaption class="part-well mt-3.5 flex min-h-[2.15rem] items-stretch stamp">
      <template v-if="mode === 'recording'">
        <span class="rail-cell">
          <i
            aria-hidden="true"
            class="lamp lamp-rec"
          />
          <span class="concave-text text-lit">rec</span>
        </span>
        <span class="rail-cell concave-text text-toned">scene 0{{ scene + 1 }} · {{ SCENES[scene]!.label }}</span>
        <span
          class="rail-cell rail-optional gap-1.5"
          aria-hidden="true"
        >
          <i
            v-for="(s, index) in SCENES"
            :key="s.id"
            class="size-1.5 rounded-full transition-colors duration-300"
            :class="index <= scene ? 'bg-primary' : 'bg-(--ui-border-accented)'"
          />
        </span>
        <span
          v-if="sim.chip"
          class="rail-cell rail-optional concave-text ml-auto text-lit"
        >{{ sim.chip }}</span>
      </template>
      <template v-else>
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
        <span class="rail-cell concave-text text-dimmed">{{ (data ?? []).length }} documents</span>
        <span
          v-if="rejection"
          class="rail-cell concave-text min-w-0 flex-1 text-error"
        ><span class="truncate">{{ rejection }}</span></span>
        <span
          v-else-if="rtt !== null"
          class="rail-cell rail-optional concave-text text-lit"
        >commit {{ rtt }} ms</span>
        <span
          v-else
          class="rail-cell rail-optional concave-text text-dimmed"
        >ssr hydrated</span>
        <!-- One more pass of the recording — simulated, so no cost to ask. -->
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="rail-cell ml-auto stamp text-dimmed hover:text-toned"
          :disabled="state === 'playing'"
          @click="replay()"
        >
          replay
        </UButton>
      </template>
    </figcaption>
  </figure>
</template>
