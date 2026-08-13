<script setup lang="ts">
import type { DemoTools } from '~/composables/useDemoScript'
import type { CodeReveal } from '~/utils/code-reveal'
import OperationPane, { type OperationRow } from '../landing/operation/OperationPane.vue'

// The sync walkthrough: a code plate on the left types each step of the loop
// (subscribe, write from A, write from B) while two simulated client panes on
// the right react — both rendering the SAME rows array, which is the claim
// itself: one table, every client, same commit. Everything here is staged
// in-page with zero network (the hero's composer and the playground hit the
// real deployment); the honesty stamp on the stage says so.
//
// Steps ride in from content/index.md as three fenced code blocks in the
// default slot — order is the contract (named slots can't reach a component
// nested inside a section's slot, see codeSlotParts). SSR renders the
// finished state: all code visible, all rows landed. The recording arms
// client-side, loops until touched, and any pointer/key inside hands the
// controls over for good — the panes' SEND chips keep working because they
// drive the same reactive rows.
const STEPS = [
  { id: 'SUBSCRIBE', label: 'SUBSCRIBE' },
  { id: 'WRITE_A', label: 'WRITE FROM A' },
  { id: 'WRITE_B', label: 'WRITE FROM B' },
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
const step = ref(STEPS.length - 1)
const bus = ref<'A' | 'B' | null>(null)
const chip = ref<string | null>('SYNCED')

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
  chip.value = 'SUBSCRIBED'
  await t.wait(1300)

  await beginStep(1, t)
  await scriptedSend('A', t)
  await t.wait(1400)

  await beginStep(2, t)
  await scriptedSend('B', t)
  await t.wait(500)
  chip.value = 'SYNCED'
}, { loop: true, loopDelay: 3400, initialDelay: 300 })

// Takeover mid-pass: land on the finished state so the panes read complete.
watch(state, (value) => {
  if (value !== 'stopped') return
  for (let i = 0; i < STEPS.length; i++) revealFor(i)?.finish()
  step.value = STEPS.length - 1
  if (rows.value.length < SEED.length + SCRIPTED.length) rows.value = finalRows()
  if (chip.value !== 'SYNCED') chip.value = 'SYNCED'
})

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
    class="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]"
  >
    <!-- The code plate — the walkthrough's driver seat. -->
    <div class="plate flex min-w-0 flex-col gap-3 px-5 pt-4 pb-5">
      <header class="flex items-center justify-between gap-3 font-mono text-[0.6rem] font-semibold tracking-[0.14em]">
        <span class="etched text-toned">operation.ts</span>
        <span
          v-if="state === 'playing'"
          class="inline-flex items-center gap-1.5 font-bold text-primary-700 dark:text-primary-300"
        ><i
          aria-hidden="true"
          class="size-1.5 rounded-full bg-primary shadow-(--glow-primary-soft) motion-safe:animate-pulse-ring"
        />REC</span>
      </header>
      <!-- Step rail — the recording's chapter list. -->
      <ol class="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 font-mono text-[0.58rem] font-semibold tracking-[0.14em]">
        <li
          v-for="(s, index) in STEPS"
          :key="s.id"
          class="etched transition-colors duration-300"
          :class="index <= step ? 'text-primary-700 dark:text-primary-300' : 'text-dimmed'"
        >
          0{{ index + 1 }} {{ s.label }}
        </li>
      </ol>
      <!-- Step fences stacked in one grid cell: the tallest sets the height,
           so step changes never pump the plate. Type floors at 0.75rem and
           scrolls past the floor (longest line ≈ 32ch of 0.6em mono). -->
      <div class="@container grid flex-1 content-start [&>div]:[grid-area:1/1] [&>div>div]:my-0 [&_button]:hidden [&_pre]:my-0 [&_pre]:overflow-x-auto [&_pre]:text-[clamp(0.75rem,calc((100cqi-2rem)/20),0.875rem)] [&_pre]:leading-[1.75] [&_pre]:whitespace-pre">
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

    <!-- The stage: two clients joined by nothing but the (staged) deployment. -->
    <div class="flex min-w-0 flex-col gap-2.5">
      <div class="grid grid-cols-1 items-stretch gap-4 min-[480px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <OperationPane
          label="CLIENT A"
          self="client-a"
          :rows="rows"
          :busy="!!manualBusy"
          @send="manualSend('A')"
        />

        <!-- The sync bus — an etched channel with a hub LED between the clients. -->
        <div class="flex min-w-[118px] flex-col items-center gap-2 self-center max-[479px]:w-full">
          <span class="etched font-mono text-[0.58rem] font-semibold tracking-[0.14em] whitespace-nowrap text-toned">CONVEX SYNC</span>
          <div
            class="flex w-full items-center"
            aria-hidden="true"
          >
            <span
              class="h-0.5 flex-1 rounded-full transition-[background,box-shadow] duration-150 ease-out"
              :class="bus === 'A' ? 'bg-primary shadow-(--glow-primary-soft)' : 'bg-(--ui-border-accented)'"
            />
            <span class="mx-1 grid size-[26px] flex-none place-items-center rounded-full bg-(image:--grad-surface) shadow-(--elev-1)">
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
          <span class="etched min-h-[1em] font-mono text-[0.58rem] font-semibold tracking-[0.14em] whitespace-nowrap text-primary-700 dark:text-primary-300">{{ chip ?? ' ' }}</span>
          <!-- One more pass — simulated, so no cost to ask. -->
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            class="font-mono text-[0.56rem] font-bold tracking-[0.14em] text-dimmed"
            :disabled="state === 'playing' || !!manualBusy"
            @click="replay()"
          >
            REPLAY
          </UButton>
        </div>

        <OperationPane
          label="CLIENT B"
          self="client-b"
          :rows="rows"
          :busy="!!manualBusy"
          @send="manualSend('B')"
        />
      </div>
      <span class="etched self-end font-mono text-[0.56rem] font-semibold tracking-[0.14em] text-dimmed">SIMULATED · ZERO NETWORK</span>
    </div>
  </div>
</template>
