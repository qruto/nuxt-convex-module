<script setup lang="ts">
import type { DemoTools } from '~/composables/useDemoScript'
import type { CodeReveal } from '~/utils/code-reveal'
import OperationPane, { type OperationRow } from '../landing/operation/OperationPane.vue'

// The sync walkthrough, in two tiers. The STAGE on top: two simulated client
// panes joined by the sync bus, both rendering the SAME rows array — which
// is the claim itself: one table, every client, same commit. The SCRIPT
// under it: operation.ts, set on the section ground the way the description
// above the stage is, not on a plate of its own — three steps in the
// description's own voice, each naming the client it moves with the chip
// that client wears in the panes, and the step's code typing itself out
// beside them. Everything here is staged in-page with zero network (the
// hero's composer and the playground hit the real deployment); the honesty
// stamp on the foot says so.
//
// Steps ride in from content/index.md as three fenced code blocks in the
// default slot — order is the contract (named slots can't reach a component
// nested inside a section's slot, see codeSlotParts). SSR renders the
// finished state: all code visible, all rows landed, every step checked.
// The recording arms client-side, loops until touched, and any pointer/key
// inside hands the controls over for good — the panes' SEND chips keep
// working because they drive the same reactive rows, and the reset key on
// the script's rule runs the whole thing again from 01.
const STEPS = [
  {
    id: 'SUBSCRIBE',
    label: 'SUBSCRIBE',
    clients: ['client-a', 'client-b'],
    note: 'Both open the same query. The table lands on subscribe.',
  },
  {
    id: 'WRITE_A',
    label: 'WRITE FROM',
    clients: ['client-a'],
    note: 'A commits a row. B has it on the same commit.',
  },
  {
    id: 'WRITE_B',
    label: 'WRITE FROM',
    clients: ['client-b'],
    note: 'B writes back. Same table, same tick, no refetch.',
  },
] as const

const parts = codeSlotParts(useSlots(), STEPS.length)

const SEED: Array<[string, string]> = [
  ['ada', 'already in the table'],
  ['lin', 'synced on subscribe'],
]
const SCRIPTED: Array<[string, string]> = [
  ['client-a', 'hello from A'],
  ['client-b', 'hello back from B'],
]

let rowId = 0
function makeRow(author: string, body: string): OperationRow {
  return { id: ++rowId, author, body }
}
function finalRows(): OperationRow[] {
  return [...SEED, ...SCRIPTED].map(([author, body]) => makeRow(author, body))
}

// SSR / no-JS / reduced-motion default: the completed walkthrough.
const rows = ref<OperationRow[]>(finalRows())
// `step` is the fence on the plate; `completed` is how many steps have
// LANDED. The two disagree exactly while a step is in progress, and that
// gap is the current state — the one the step list draws differently from
// the steps already behind it.
const step = ref(STEPS.length - 1)
const completed = ref(STEPS.length)
const bus = ref<'A' | 'B' | null>(null)
const chip = ref<string | null>('SYNCED')

type StepStatus = 'done' | 'current' | 'pending'
function statusOf(index: number): StepStatus {
  if (index < completed.value) return 'done'
  if (index === step.value) return 'current'
  return 'pending'
}
// The client(s) the step in progress names — lit on the pane that wears
// the same label, so the script and the stage point at each other.
const actors = computed<readonly string[]>(() =>
  statusOf(step.value) === 'current' ? STEPS[step.value]!.clients : [])
const subscribed = computed(() => completed.value >= 1)

// Deterministic "round trips" — no RNG, so replays read the same.
const RTTS = [42, 57, 38, 64]
let rttIndex = 0
function nextRtt() {
  return RTTS[rttIndex++ % RTTS.length]!
}

const stepEls = ref<(HTMLElement | null)[]>([])
function setStepEl(index: number, el: unknown) {
  stepEls.value[index] = (el as HTMLElement | null) ?? null
}

const reveals = new Map<number, CodeReveal | null>()
function revealFor(index: number): CodeReveal | null {
  if (!reveals.has(index)) {
    const el = stepEls.value[index]
    reveals.set(index, el ? createCodeReveal(el) : null)
  }
  return reveals.get(index) ?? null
}

async function beginStep(index: number, t: DemoTools) {
  const reveal = revealFor(index)
  reveal?.reset()
  step.value = index
  completed.value = index
  await t.wait(350)
  if (reveal) await typeCode(t.wait, reveal)
}

async function scriptedSend(side: 'A' | 'B', t: DemoTools) {
  const [author, body] = SCRIPTED[side === 'A' ? 0 : 1]!
  bus.value = side
  await t.wait(380)
  rows.value.push(makeRow(author, body))
  chip.value = `${nextRtt()} MS`
  await t.wait(260)
  bus.value = null
}

const root = ref<HTMLElement | null>(null)
const { state, replay } = useDemoScript(root, async (t) => {
  rows.value = []
  chip.value = null
  await beginStep(0, t)
  await t.wait(400)
  for (const [author, body] of SEED) {
    rows.value.push(makeRow(author, body))
    await t.wait(420)
  }
  completed.value = 1
  chip.value = 'SUBSCRIBED'
  await t.wait(1300)

  await beginStep(1, t)
  await scriptedSend('A', t)
  completed.value = 2
  await t.wait(1400)

  await beginStep(2, t)
  await scriptedSend('B', t)
  completed.value = 3
  await t.wait(500)
  chip.value = 'SYNCED'
}, { loop: true, loopDelay: 3400, initialDelay: 300 })

// Takeover mid-pass: land on the finished state so the panes read complete.
watch(state, (value) => {
  if (value !== 'stopped') return
  for (let i = 0; i < STEPS.length; i++) revealFor(i)?.finish()
  step.value = STEPS.length - 1
  completed.value = STEPS.length
  if (rows.value.length < SEED.length + SCRIPTED.length) rows.value = finalRows()
  if (chip.value !== 'SYNCED') chip.value = 'SYNCED'
})

// From the top: the whole recording again, 01 first. The pointerdown that
// reaches this key is itself the takeover (stop → finished state), and the
// click that follows restarts the engine for one more pass; the script
// clears the rows on entry, so anything sent by hand goes with them.
function reset() {
  bus.value = null
  replay()
}

// Manual sends — plain timers, not engine tools: they must run after stop().
const PHRASES = ['ping', 'same tick', 'no refetch', 'still synced']
const phraseIndex: Record<'A' | 'B', number> = { A: 0, B: 2 }
const manualBusy = ref<'A' | 'B' | null>(null)

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function manualSend(side: 'A' | 'B') {
  if (manualBusy.value) return
  manualBusy.value = side
  const body = PHRASES[phraseIndex[side]++ % PHRASES.length]!
  bus.value = side
  await sleep(320)
  rows.value.push(makeRow(side === 'A' ? 'client-a' : 'client-b', body))
  chip.value = `${nextRtt()} MS`
  await sleep(260)
  bus.value = null
  manualBusy.value = null
}
</script>

<template>
  <div
    ref="root"
    class="flex min-w-0 flex-col gap-7"
  >
    <!-- THE STAGE: two clients joined by nothing but the (staged) deployment. -->
    <div class="grid grid-cols-1 items-stretch gap-4 min-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <OperationPane
        label="CLIENT A"
        self="client-a"
        :rows="rows"
        :busy="!!manualBusy"
        :subscribed="subscribed"
        :active="actors.includes('client-a')"
        @send="manualSend('A')"
      />

      <!-- The sync bus — a cut channel with a hub LED between the clients. -->
      <div class="flex min-w-[118px] flex-col items-center gap-2 self-center max-[479px]:w-full">
        <span class="concave-text font-mono text-[0.58rem] font-semibold tracking-[0.14em] whitespace-nowrap text-toned">CONVEX SYNC</span>
        <div
          class="flex w-full items-center"
          aria-hidden="true"
        >
          <span
            class="h-0.5 flex-1 rounded-full transition-[background,box-shadow] duration-150 ease-out"
            :class="bus === 'A' ? 'bg-primary shadow-(--glow-primary-soft)' : 'bg-(--ui-border-accented)'"
          />
          <span class="convex mx-1 grid size-[26px] flex-none place-items-center rounded-full">
            <i
              class="size-2 rounded-full transition-[background,box-shadow] duration-150 ease-out"
              :class="bus ? 'bg-primary shadow-(--glow-primary-soft)' : 'bg-(--ui-text-dimmed)'"
            />
          </span>
          <span
            class="h-0.5 flex-1 rounded-full transition-[background,box-shadow] duration-150 ease-out"
            :class="bus === 'B' ? 'bg-primary shadow-(--glow-primary-soft)' : 'bg-(--ui-border-accented)'"
          />
        </div>
        <span class="concave-text min-h-[1em] font-mono text-[0.58rem] font-semibold tracking-[0.14em] whitespace-nowrap text-primary-700 dark:text-primary-300">{{ chip ?? ' ' }}</span>
      </div>

      <OperationPane
        label="CLIENT B"
        self="client-b"
        :rows="rows"
        :busy="!!manualBusy"
        :subscribed="subscribed"
        :active="actors.includes('client-b')"
        @send="manualSend('B')"
      />
    </div>

    <!-- THE SCRIPT: operation.ts, set on the ground under the stage. No
         plate — the description above the stage is the register it is
         written in, and a third raised part here read as a fourth machine
         rather than as the caption to the three. What holds the two tiers
         together is the rule: the file tab scribed across the full width
         of the stage, the recording lamp at its head and the one control at
         its foot, the way the hero's RENDERS rule joins source to readout. -->
    <section
      class="flex min-w-0 flex-col gap-5"
      aria-label="The steps of the walkthrough, with the code of each"
    >
      <div class="flex items-center gap-3.5 font-mono text-[0.6rem] font-semibold tracking-[0.14em]">
        <!-- The lamp: REC while the engine runs (signal orange — authored),
             DONE once the pass has landed, dead lamp and dimmed. -->
        <span class="inline-flex w-[3.4rem] flex-none items-center gap-1.5">
          <i
            aria-hidden="true"
            class="lamp"
            :class="state === 'playing' ? 'lamp-rec' : 'lamp-dead'"
          />
          <span
            class="concave-text"
            :class="state === 'playing' ? 'text-primary-700 dark:text-primary-300' : 'text-dimmed'"
          >{{ state === 'playing' ? 'REC' : 'DONE' }}</span>
        </span>
        <span
          class="scribe flex-1"
          aria-hidden="true"
        />
        <span class="concave-text flex-none tracking-[0.08em] text-toned">operation.ts</span>
        <span
          class="scribe flex-1"
          aria-hidden="true"
        />
        <!-- From 01 again — simulated, so no cost to ask. -->
        <UButton
          icon="i-lucide-rotate-ccw"
          size="xs"
          color="neutral"
          variant="ghost"
          square
          class="flex-none text-dimmed hover:text-toned"
          aria-label="Run the walkthrough again from 01 SUBSCRIBE"
          :ui="{ leadingIcon: 'size-4' }"
          :disabled="!!manualBusy"
          @click="reset()"
        />
      </div>

      <div class="grid grid-cols-1 items-center gap-x-10 gap-y-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <!-- The step list — the recording's chapters, in three states that
             are drawn as three different things, not three tints of one:
             a step that has LANDED carries a check and its note goes quiet;
             the step IN PROGRESS carries the lit lamp and full-strength type;
             a step still to come is a hollow pip with everything dimmed.
             The client chips are the panes' own author chips, and on the
             current step they wear the same accent the pane's label does. -->
        <ol class="m-0 flex list-none flex-col gap-3.5 p-0">
          <li
            v-for="(s, index) in STEPS"
            :key="s.id"
            class="grid grid-cols-[1rem_minmax(0,1fr)] gap-x-2.5 gap-y-1 transition-opacity duration-300"
            :class="statusOf(index) === 'pending' ? 'opacity-55' : 'opacity-100'"
            :aria-current="statusOf(index) === 'current' ? 'step' : undefined"
          >
            <span class="row-span-2 grid h-[1.15rem] place-items-center">
              <UIcon
                v-if="statusOf(index) === 'done'"
                name="i-lucide-check"
                class="size-3.5 text-toned"
                aria-label="done"
              />
              <i
                v-else-if="statusOf(index) === 'current'"
                class="lamp lamp-rec"
                aria-label="in progress"
              />
              <i
                v-else
                class="lamp lamp-pending"
                aria-hidden="true"
              />
            </span>
            <span class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[0.62rem] font-semibold tracking-[0.14em]">
              <span
                class="concave-text transition-colors duration-300"
                :class="statusOf(index) === 'current' ? 'text-primary-700 dark:text-primary-300' : 'text-toned'"
              >0{{ index + 1 }} {{ s.label }}</span>
              <span
                v-for="client in s.clients"
                :key="client"
                class="rounded-chip border px-1 py-px text-[0.6rem] font-bold tracking-[0.08em] uppercase transition-colors duration-300"
                :class="statusOf(index) === 'current'
                  ? 'border-primary/40 text-primary-700 dark:text-primary-300'
                  : 'border-accented text-muted'"
              >{{ client }}</span>
            </span>
            <p
              class="m-0 text-sm/6 transition-colors duration-300"
              :class="statusOf(index) === 'current' ? 'text-default' : 'text-muted'"
            >
              {{ s.note }}
            </p>
          </li>
        </ol>

        <!-- Step fences stacked in one grid cell: the tallest sets the height,
             so step changes never pump the layout. Every fence is stretched
             to that height (h-full down the ProsePre wrapper to the pre
             itself), so the box is cut once for the longest step with the
             shorter steps sitting at the top of it. The well is cut into the
             GROUND, not into a plate — concave-ground, the hero spec board's
             recess — with the same --recess-edge lip the panes' wells carry,
             which is what keeps the script and the stage one machining pass.
             Type floors at 0.75rem and scrolls past the floor (longest line
             ≈ 27ch of 0.6em mono). -->
        <div class="@container grid content-start [&>div]:[grid-area:1/1] [&>div]:h-full [&>div>div]:my-0 [&>div>div]:h-full [&_button]:hidden [&_pre]:concave-ground [&_pre]:my-0 [&_pre]:h-full [&_pre]:overflow-x-auto [&_pre]:rounded-well [&_pre]:border [&_pre]:border-(--recess-edge) [&_pre]:text-[clamp(0.75rem,calc((100cqi-2rem)/19.4),0.875rem)] [&_pre]:leading-[1.75] [&_pre]:whitespace-pre">
          <div
            v-for="(part, index) in parts"
            :key="STEPS[index]!.id"
            :ref="el => setStepEl(index, el)"
            class="transition-opacity duration-300"
            :class="step === index ? 'visible opacity-100' : 'invisible opacity-0'"
          >
            <component :is="part" />
          </div>
        </div>
      </div>

      <span class="concave-text self-end font-mono text-[0.56rem] font-semibold tracking-[0.14em] text-dimmed">SIMULATED · ZERO NETWORK</span>
    </section>
  </div>
</template>

<style scoped>
/* The rule is SCRIBED, not drawn: a shade line with its light catch one
   pixel below — the same two-line rule the mill finishes cut into the
   section grounds (landing.css), so it reads as a mark in the ground the
   stage stands on rather than as a divider laid over it. */
.scribe {
  block-size: 2px;
  background-image: linear-gradient(180deg,
    light-dark(oklch(0% 0 0 / 0.11), oklch(0% 0 0 / 0.5)) 0 1px,
    light-dark(oklch(100% 0 0 / 0.8), oklch(100% 0 0 / 0.05)) 1px 2px);
}
/* The lamps — the hero rail's counterbored lamp, in three states. A lit
   one (REC, the step in progress) is signal orange with its own spill; a
   pending step is the bore with nothing in it; DONE is a dead lamp, the
   bore around a dimmed light. */
.lamp {
  --lamp-bore: 0 0 0 2px light-dark(oklch(0% 0 0 / 0.07), oklch(0% 0 0 / 0.55));
  flex: none;
  inline-size: 0.4rem;
  block-size: 0.4rem;
  border-radius: 999px;
  background: var(--ui-text-dimmed);
  box-shadow: var(--lamp-bore);
}
.lamp-rec {
  background: var(--ui-primary);
  box-shadow: var(--lamp-bore), var(--glow-primary-soft);
}
.lamp-pending {
  background: transparent;
  box-shadow: var(--lamp-bore);
}
.lamp-dead {
  background: var(--ui-text-dimmed);
}
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
