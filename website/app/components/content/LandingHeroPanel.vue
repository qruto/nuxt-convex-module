<script setup lang="ts">
import type { DemoTools } from '~/composables/useDemoScript'
import type { CodeReveal } from '~/utils/code-reveal'
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

    <!-- Rendered readout — the active scene's result as UI while recording,
         the real query result once live. Bottom-anchored like a log; bounded
         rather than fixed so a near-empty list has no dead void. -->
    <div class="concave-2 rounded-[14px] overflow-hidden px-4.5 py-3.5">
      <ul
        class="m-0 flex max-h-[6.6rem] min-h-[3.3rem] list-none flex-col justify-end gap-1.5 p-0 font-mono text-xs"
        aria-live="polite"
      >
        <template v-if="mode === 'live'">
          <li
            v-for="m in liveShown"
            :key="m._id"
            class="-mx-1.5 flex min-w-0 items-baseline gap-2 rounded-[7px] px-1.5 text-default motion-safe:animate-row-land"
          >
            <span
              class="max-w-[14ch] flex-none truncate rounded-[5px] border px-1 py-px text-[0.6rem] font-bold tracking-[0.08em] uppercase"
              :class="m.author === handle
                ? 'border-primary/40 text-primary-700 dark:text-primary-300'
                : 'border-accented text-muted'"
            >{{ m.author }}</span>
            <span class="min-w-0 truncate">{{ m.body }}</span>
          </li>
          <li
            v-if="!liveShown.length"
            class="text-muted"
          >
            {{ error ? 'deployment unreachable' : 'the table is empty — write the first row ↓' }}
          </li>
        </template>
        <template v-else>
          <!-- Keyed on the pending flag too: the pending→committed flip
               remounts the row, so the commit re-lands with its own flash. -->
          <li
            v-for="row in simShown"
            :key="`${row.id}${row.pending ? ':pending' : ''}`"
            class="-mx-1.5 flex min-w-0 items-baseline gap-2 rounded-[7px] px-1.5 text-default motion-safe:animate-row-land"
            :class="row.pending ? 'opacity-60' : undefined"
          >
            <span
              class="max-w-[14ch] flex-none truncate rounded-[5px] border px-1 py-px text-[0.6rem] font-bold tracking-[0.08em] uppercase"
              :class="row.author === 'you'
                ? `text-primary-700 dark:text-primary-300 ${row.pending ? 'border-dashed border-primary/60' : 'border-primary/40'}`
                : 'border-accented text-muted'"
            >{{ row.author }}</span>
            <span class="min-w-0 truncate">{{ row.body }}</span>
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
            <span class="flex-none text-[0.6rem] font-bold tracking-[0.08em] text-primary-700 tabular-nums dark:text-primary-300">{{ sim.progress }}%</span>
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

    <!-- THE STATUS RAIL — the panel's one readout, and the only place it
         reports state. A recessed strip machined into the plate: the cells
         are scribed apart rather than spaced apart, so it reads as one
         instrument with divisions instead of a row of loose chips.

         The zones are the same in both acts, which is what lets one strip
         serve a recording and a live socket without either borrowing the
         other's idiom:

           state    the lamp. REC while the script runs (signal orange —
                    authored, ours), LIVE once the socket is up (green —
                    a machine fact, and the conventional colour for one).
                    OFFLINE kills the light rather than recolouring it.
           subject  what is being reported on: the scene, or the table.
           event    the last thing that happened: the sim chip, or the
                    hydration / commit latency / a rejected write.
           action   REPLAY, in its own bay past the last scribe. -->
    <figcaption class="panel-rail concave rounded-[10px] mt-3.5 flex min-h-[2.15rem] items-stretch font-mono text-[0.62rem] font-semibold tracking-[0.13em]">
      <template v-if="mode === 'recording'">
        <span class="rail-cell">
          <i
            aria-hidden="true"
            class="lamp lamp-rec"
          />
          <span class="concave-text text-primary-700 dark:text-primary-300">REC</span>
        </span>
        <span class="rail-cell concave-text text-toned">SCENE 0{{ scene + 1 }} · {{ SCENES[scene]!.label }}</span>
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
          class="rail-cell rail-optional concave-text ml-auto text-primary-700 dark:text-primary-300"
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
          >{{ online ? 'LIVE' : 'OFFLINE' }}</span>
        </span>
        <span class="rail-cell concave-text text-dimmed">{{ (data ?? []).length }} DOCUMENTS</span>
        <span
          v-if="rejection"
          class="rail-cell concave-text min-w-0 flex-1 tracking-[0.02em] text-error"
        ><span class="truncate">{{ rejection }}</span></span>
        <span
          v-else-if="rtt !== null"
          class="rail-cell rail-optional concave-text text-primary-700 dark:text-primary-300"
        >COMMIT {{ rtt }} MS</span>
        <span
          v-else
          class="rail-cell rail-optional concave-text text-dimmed"
        >SSR HYDRATED</span>
        <!-- One more pass of the recording — simulated, so no cost to ask. -->
        <UButton
          size="xs"
          color="neutral"
          variant="ghost"
          class="rail-cell ml-auto font-mono text-[0.56rem] font-bold tracking-[0.14em] text-dimmed hover:text-toned"
          :disabled="state === 'playing'"
          @click="replay()"
        >
          REPLAY
        </UButton>
      </template>
    </figcaption>
  </figure>
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
   already says how far along the tour is. A REJECTION is
   never optional — an error the panel is hiding is worse than a rail that
   scrolls — so that branch has no `rail-optional`.

   Written as a container query HERE rather than as a `@max-[26rem]:hidden`
   utility on the markup, because `.rail-cell` above is unlayered scoped CSS
   and beats the layered `hidden` outright: the class sat on the element
   looking correct and never took effect. (The query resolves against
   `figure.convex-3`'s @container — and note the panel's own
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
