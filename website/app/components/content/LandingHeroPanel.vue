<script setup lang="ts">
import type { DemoTools } from '~/composables/useDemoScript'
import type { CodeReveal } from '~/utils/code-reveal'
import HeroRail from '../landing/hero/HeroRail.vue'
import HeroReadout from '../landing/hero/HeroReadout.vue'
import { api } from '#convex/api'

// The hero's signature, now in two acts. Act one is a recording: the general
// composables type themselves out scene by scene — live query, mutation,
// pagination, upload — each rendering a simulated readout in the well below
// (zero network; the bench and playground carry the deeper versions). Act two
// is the handoff: the final scene types the code that actually runs this
// panel, and the readout swaps to the real Convex deployment over a real
// WebSocket — rows off the shared table, and the composer writes to it.
//
// SSR, no-JS, and reduced-motion all get act two directly: the server renders
// the live panel (rows in the HTML on first paint via `useAsyncQuery`), and
// the recording only arms client-side through useDemoScript. Touch anything
// inside the plate mid-recording and it jumps straight to live.
const { data, error } = await useAsyncQuery(api.messages.list, {})

const send = useMutation(api.messages.send)
const connection = useConvexConnectionState()

// Only the tail fits the well; the panel is a readout, not the archive.
const VISIBLE = 4
const liveShown = computed(() => (data.value ?? []).slice(-VISIBLE))

const online = computed(() => !error.value && connection.value?.isWebSocketConnected !== false)

// A per-visitor handle so your own rows are distinguishable from everyone
// else's. Generated after mount — a random value at SSR time would mismatch
// on hydration.
const handle = ref('you')
onMounted(() => {
  handle.value = `you-${Math.random().toString(36).slice(2, 5)}`
})

const draft = ref('')
const sending = ref(false)
const rtt = ref<number | null>(null)
const rejection = ref<string | null>(null)

async function submit() {
  const body = draft.value.trim()
  if (!body || sending.value) return
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
const SCENES = [
  { id: 'QUERY', label: 'LIVE QUERY' },
  { id: 'MUTATION', label: 'MUTATION' },
  { id: 'PAGINATION', label: 'PAGINATION' },
  { id: 'FILES', label: 'FILE UPLOAD' },
  { id: 'LIVE', label: 'GOING LIVE' },
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

// Both acts hand the readout the same row shape, so the list markup exists
// once (HeroReadout). The live query keys on the document id; the recording
// keys on its own counter PLUS the pending flag, so the pending→committed
// flip remounts the row and the commit re-lands with its own flash.
const readoutRows = computed(() => (mode.value === 'live'
  ? liveShown.value.map(m => ({
      key: m._id,
      author: m.author,
      body: m.body,
      mine: m.author === handle.value,
      pending: false,
    }))
  : simShown.value.map(row => ({
      key: `${row.id}${row.pending ? ':pending' : ''}`,
      author: row.author,
      body: row.body,
      mine: row.author === 'you',
      pending: !!row.pending,
    }))))

// An empty well says something different in each act — and, live, something
// different again when the deployment is unreachable.
const emptyLabel = computed(() => {
  if (mode.value === 'recording') return '…'
  return error.value ? 'deployment unreachable' : 'the table is empty — write the first row ↓'
})
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
  if (index === 0 || index === 3) sim.rows = []
  if (index === 2) {
    sim.rows = []
    const authors = ['ada', 'lin', 'kai']
    for (let n = 1; n <= 3; n++) simRow(authors[(n - 1) % 3]!, `message ${n}`)
    sim.chip = '3 OF 9'
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
    sim.chip = 'SUBSCRIBED'
    await wait(1500)
  }
  else if (index === 1) {
    await wait(400)
    simRow('you', 'hi, realtime', true)
    const row = sim.rows[sim.rows.length - 1]!
    await wait(300)
    row.pending = false
    sim.chip = 'COMMIT 42 MS'
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
      sim.chip = `${from + 3} OF 9${from + 3 === 9 ? ' · EXHAUSTED' : ''}`
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
    simRow('you', 'schematic.png · 84 KB')
    sim.chip = 'ID kg24d8mn7apf…9d1'
    await wait(1700)
  }
  else {
    // The handoff beat: the panel's own code is on the plate — go live.
    await wait(600)
  }
}

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
// land the panel on the live act with its real code fully on the plate. The
// upload scene's progress is dropped on the way out — it belongs to the
// recording, and the readout is shared.
watch(state, (value) => {
  if (value === 'stopped' && mode.value === 'recording') {
    revealFor(SCENES.length - 1)?.finish()
    scene.value = SCENES.length - 1
    sim.progress = null
    mode.value = 'live'
  }
})
</script>

<template>
  <!-- The instrument panel — the deepest convex step on the page, at a
       radius no other surface uses. Its own size container: the narrow
       tweaks query the panel, not the viewport. -->
  <figure
    ref="plate"
    class="convex-3 bevel sheen noise rounded-[26px] @container relative m-0 px-6 pt-5 pb-5 motion-safe:animate-fade-up [animation-delay:160ms] [animation-duration:700ms] @max-[30rem]:px-4.5"
    aria-label="A recorded tour of the client's composables that ends on a live Convex query rendering real rows"
  >
    <!-- The header is the file tab and nothing else. It used to carry a
         REC / LIVE-OFFLINE badge as well — and LIVE was the same boolean
         the foot of the panel was already reporting as WS OPEN, one fact
         wearing two lamps in two different colours. State now has exactly
         one home, the rail at the foot, and this line is left doing the one
         job a file tab does. -->
    <header class="mb-3.5 flex items-center gap-4 font-mono text-[0.65rem] font-semibold tracking-[0.13em] @max-[30rem]:gap-3">
      <span class="concave-text text-toned tracking-[0.08em]">app.vue</span>
    </header>

    <!-- Source well. Five scene fences stacked in one grid cell — the tallest
         sets the height, so scene changes never pump the plate. Type is sized
         off the panel (longest scene line is 55ch of 0.6em-advance mono) with
         a floor that keeps phones readable; past the floor the pre scrolls. -->
    <div class="@container grid [&>div]:[grid-area:1/1] [&>div>div]:my-0 [&_button]:hidden [&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:rounded-[14px] [&_pre]:px-4 [&_pre]:py-4 [&_pre]:text-[clamp(0.75rem,calc((100cqi-2rem)/32),0.875rem)] [&_pre]:leading-[1.75] [&_pre]:whitespace-pre">
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
      class="my-2.5 flex items-center gap-2.5 font-mono text-[0.56rem] font-semibold tracking-[0.16em]"
      aria-hidden="true"
    >
      <span class="h-px flex-1 bg-linear-to-r from-transparent to-primary/30" />
      <span class="concave-text flex-none text-toned">RENDERS</span>
      <span class="h-px flex-1 bg-linear-to-r from-primary/30 to-transparent" />
    </div>

    <HeroReadout
      :rows="readoutRows"
      :progress="sim.progress"
      :empty-label="emptyLabel"
    />

    <!-- Composer — the write half of the panel, wired to the real table the
         whole time. Touching it mid-recording IS the takeover. -->
    <form
      class="mt-3 flex gap-2 @max-[30rem]:flex-wrap"
      @submit.prevent="submit"
    >
      <label
        class="concave rounded-md flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 transition-shadow duration-180 ease-out focus-within:ring-2 focus-within:ring-primary"
        :class="sending ? 'opacity-65' : undefined"
      >
        <span class="sr-only">Write a message to the live Convex table</span>
        <span
          class="max-w-[14ch] flex-none truncate font-mono text-[0.6rem] font-bold tracking-[0.08em] uppercase text-primary-700 dark:text-primary-300"
          aria-hidden="true"
        >{{ handle }}</span>
        <input
          v-model="draft"
          :disabled="!!error"
          maxlength="140"
          placeholder="write a row…"
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
        :disabled="sending || !draft.trim() || !!error"
      />
    </form>

    <HeroRail
      :mode="mode"
      :scene="scene"
      :scenes="SCENES"
      :chip="sim.chip"
      :online="online"
      :documents="(data ?? []).length"
      :rejection="rejection"
      :rtt="rtt"
      :replay-disabled="state === 'playing'"
      @replay="replay()"
    />
  </figure>
</template>
