<script setup lang="ts">
import { api } from '#convex/api'
import { KINDS, checkName, drawName } from '#shared/reactions'

// THE REACTIONS — the hero's instrument, and the same instrument in the
// small second window (/reactions, opened by the key on the hero plate's
// header). Four keys every visitor can press; a press is one committed
// row, printed on every screen that has this page open, under the name the
// visitor sends as. The ledger is the last eight rows; the deck carries
// today's count beside each key; the rail says who is here.
//
// One real subscription, `api.reactions.board` — the rows and the tally in
// one consistent snapshot — and one mutation, `send`, with an optimistic
// update that prints the row and bumps the tally before the round trip.
//
// THE NAME (2026-09-15). Not a signature: it is the name a reaction is sent
// with, so every visitor has one from the first second — a short plain
// word drawn on arrival and kept in localStorage, typed over or shuffled
// in the deck. A bad entry rings the field and the rail says why; the last
// good name stays until a new one is accepted. The check is the server's
// own (shared/reactions.ts). The CITY switch puts the visitor's city — the
// edge's answer (/api/city), else the browser's time zone — on their lines.
//
// THE CANVAS this replaced is kept whole: LiveCanvas.vue, convex/canvas.ts
// and /canvas. To put it back, swap the component and the fence in
// LandingHeroPanel.vue and content/index.md.
//
// Offline (no client, or the socket is down) the plate keeps working on
// local rows so the stage never reads as broken — the rail says so.

// The second window has no key to open a third; its rail skips the hint.
const props = defineProps<{ second?: boolean }>()

interface Row { id: string, at: number, kind: number, name: string, city: string | null }

const RECENT = 8
const NAME_KEY = 'nc-reaction-name'
// The figure beside each key, in the emoji's own hue: the hand's gold,
// the eyes' steel, the heart's signal, the rocket's red.
const HUES = [
  'light-dark(oklch(66% 0.14 82), oklch(80% 0.15 84))',
  'light-dark(oklch(52% 0.06 245), oklch(78% 0.06 235))',
  'var(--ui-primary)',
  'light-dark(oklch(56% 0.2 25), oklch(72% 0.19 25))',
]

const { data: board, error } = await useDemoQuery(api.reactions.board, {})
const online = useDemoOnline(error)

// Who is here: the same heartbeat and count the canvas rode.
const { sid } = useVisitor()
const { count: here } = usePresence(sid)

// ---- the name you send as ----------------------------------------------------
// Client-only: the server renders the field empty and the name lands after
// mount, so the served HTML never carries a random word hydration would
// have to disagree about.
const name = ref('')
const draft = ref('')
const nameError = ref<string | null>(null)
function keep(value: string) {
  name.value = value
  draft.value = value
  nameError.value = null
  try {
    localStorage.setItem(NAME_KEY, value)
  }
  catch {
    // Private mode or storage off: the name still holds for this visit.
  }
}
function onName(event: Event) {
  const value = (event.target as HTMLInputElement).value.toLowerCase().trim()
  draft.value = value
  const reason = checkName(value)
  nameError.value = reason
  if (!reason) keep(value)
}
function shuffle() {
  keep(drawName(name.value))
  spun.value = false
  void nextTick(() => (spun.value = true))
}
const spun = ref(false)

// ---- the city ----------------------------------------------------------------
const withCity = ref(false)
const city = ref<string | null>(null)
async function resolveCity() {
  if (city.value) return
  try {
    const answer = await $fetch<{ city: string | null }>('/api/city')
    city.value = answer.city
  }
  catch {
    city.value = null
  }
  // No edge here (a local dev server): the time zone's own city will do.
  city.value ??= (Intl.DateTimeFormat().resolvedOptions().timeZone ?? '').split('/').pop()?.replace(/_/g, ' ') || null
}
watch(withCity, (on) => {
  if (on) void resolveCity()
})

onMounted(() => {
  let stored: string | null = null
  try {
    stored = localStorage.getItem(NAME_KEY)
  }
  catch {
    // No storage: draw a fresh name, as on a first visit.
  }
  keep(stored && !checkName(stored) ? stored : drawName())
})

// ---- local fallback ------------------------------------------------------------
// The same shape the server answers, over rows this browser wrote, for
// when there is no deployment to write to.
const localRows = ref<Row[]>([])
const localTally = ref(KINDS.map(() => 0))
const recent = computed<Row[]>(() => (online.value ? board.value?.recent ?? [] : localRows.value.slice(0, RECENT)))
const tally = computed<number[]>(() => (online.value ? board.value?.tally ?? KINDS.map(() => 0) : localTally.value))

// ---- sending -------------------------------------------------------------------
const rejection = ref<string | null>(null)
const sendRemote = useDemoMutation(api.reactions.send, (store, { kind, name, city }) => {
  const current = store.getQuery(api.reactions.board, {})
  if (!current) return
  const row: Row = { id: `local-${Date.now()}`, at: Date.now(), kind, name, city: city ?? null }
  store.setQuery(api.reactions.board, {}, {
    recent: [row, ...current.recent].slice(0, RECENT),
    tally: current.tally.map((n, i) => (i === kind ? n + 1 : n)),
  })
})

async function press(kind: number) {
  if (!name.value) return
  rejection.value = null
  const sent = withCity.value && city.value ? city.value : undefined
  if (!online.value) {
    localRows.value.unshift({ id: `local-${Date.now()}`, at: Date.now(), kind, name: name.value, city: sent ?? null })
    localTally.value[kind]!++
    return
  }
  try {
    await sendRemote!({ kind, name: name.value, ...(sent ? { city: sent } : {}) })
  }
  catch (e) {
    rejection.value = demoRejectionReason(e)
  }
}

// ---- the readouts ----------------------------------------------------------
const clock = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
// The time is printed once per minute: a burst reads as one moment.
const ledger = computed(() => recent.value.map((row, i) => ({
  ...row,
  mine: row.name === name.value,
  time: i > 0 && clock(recent.value[i - 1]!.at) === clock(row.at) ? '' : clock(row.at),
})))

// The rail's lamp and its word: live (green — the socket is up), offline
// (no light).
const state = computed(() => (online.value
  ? { lamp: 'lamp-live', tone: 'text-toned', label: 'live' }
  : { lamp: '', tone: 'text-dimmed', label: 'offline' }))

// THE RAIL'S LINE — one sentence, whichever of these is true first:
//   a bad name              the reason, until the field is good again
//   a rejected send         the reason, until the next press
//   offline                 where the rows are going instead
//   live                    who is on the page — "only you here" with the
//                           nudge to open the second window (on the page
//                           that has the key), or "you and N others"
const line = computed(() => {
  if (nameError.value) return { text: `${nameError.value} · still sending as ${name.value}`, tone: 'text-error' }
  if (rejection.value) return { text: rejection.value, tone: 'text-error' }
  if (!online.value) return { text: 'reactions stay in this browser until it is back', tone: 'text-dimmed' }
  if (here.value === undefined) return null
  const others = here.value - 1
  if (others <= 0) return { text: props.second ? 'only this window on the page' : 'only you here · open a second window', tone: 'text-dimmed' }
  return { text: `you and ${others} other${others === 1 ? '' : 's'} on this page`, tone: 'text-toned' }
})
</script>

<template>
  <!-- The reactions well: the ledger in a dish cut into it, the deck on
       its floor under that. No head — the well is the readout. -->
  <div class="part-well px-4.5 py-3.5 @max-[30rem]:px-3.5">
    <!-- THE LEDGER — a typeset log in a dish (the ground recess, a step
         darker than the well in dark). The time is a marking behind a
         standing seam, printed once per minute; then the emoji; then the
         name in the board's display type as the loud thing on the line,
         the city a mono marking right after it. Lines are parted by the
         scribe. Newest first; a landing row carries the theme's commit
         flash. -->
    <div
      class="ledger"
      role="log"
      aria-live="off"
      aria-label="the latest reactions"
    >
      <TransitionGroup name="row">
        <div
          v-for="row in ledger"
          :key="row.id"
          class="ln"
          :class="{ mine: row.mine }"
        >
          <span class="t">{{ row.time }}</span>
          <span
            class="e"
            aria-hidden="true"
          >{{ KINDS[row.kind] }}</span>
          <span class="w">{{ row.name }}<span class="c">{{ row.city ?? '' }}</span></span>
          <span class="sr-only">{{ KINDS[row.kind] }} {{ row.name }}{{ row.city ? `, ${row.city}` : '' }}, {{ clock(row.at) }}</span>
        </div>
      </TransitionGroup>
      <p
        v-if="ledger.length === 0"
        class="ln empty stamp text-dimmed"
      >
        nothing yet · press a key
      </p>
    </div>

    <!-- THE DECK — the four keys with today's figure beside each in the
         emoji's own hue, then the name you send as: the field with the
         shuffle as a marking inside it, and the city switch. -->
    <div class="deck mt-3">
      <div
        class="keys"
        role="group"
        aria-label="react"
      >
        <span
          v-for="(emoji, kind) in KINDS"
          :key="emoji"
          class="keycap"
          :style="{ '--hue': HUES[kind] }"
        >
          <button
            type="button"
            class="key"
            :aria-label="`react ${emoji}`"
            :disabled="!name"
            @click="press(kind)"
          >
            {{ emoji }}
          </button>
          <span
            class="n"
            :aria-label="`${tally[kind]} today`"
          >{{ tally[kind] }}</span>
        </span>
      </div>
      <span
        class="sep"
        aria-hidden="true"
      />
      <div class="as">
        <span class="stamp concave-text text-dimmed">as</span>
        <span class="name">
          <input
            type="text"
            class="field"
            :class="{ bad: nameError }"
            :value="draft"
            maxlength="7"
            spellcheck="false"
            autocomplete="off"
            aria-label="the name you send as"
            @input="onName"
          >
          <button
            type="button"
            class="shuffle"
            :class="{ spin: spun }"
            aria-label="another name"
            title="another name"
            @click="shuffle"
          >
            <UIcon
              name="i-lucide-shuffle"
              class="size-3.5"
              aria-hidden="true"
            />
          </button>
        </span>
        <label class="switch">
          <input
            v-model="withCity"
            type="checkbox"
          >
          <i aria-hidden="true" />
          <span class="stamp concave-text text-dimmed">city</span>
        </label>
      </div>
    </div>
  </div>

  <!-- THE STATUS RAIL — the panel's one readout of state (the cells and
       their scribes are chrome.css's .rail). Two cells: the lamp with its
       word, and one sentence (`line` above). -->
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
    <span
      v-if="line"
      class="rail-cell concave-text min-w-0 flex-1"
      :class="line.tone"
      aria-live="polite"
    ><span class="truncate">{{ line.text }}</span></span>
  </figcaption>
</template>

<style scoped>
/* THE LEDGER'S DISH — the ground recess (depth.css's part-dish physics at
   the well radius): the floor a step darker than the well in dark, a shade
   lip, the rim outside the cut catching the light. Eight rows tall
   whatever it holds, so the plate never moves. */
.ledger {
  --row-h: 1.6rem;
  position: relative;
  padding: 0.6rem 0.8rem;
  block-size: calc(8 * var(--row-h) + 1.2rem);
  overflow: hidden;
  border-radius: var(--radius-well);
  background: var(--gradient-recessed-ground);
  box-shadow: var(--recess-lip-ground), var(--inset-shadow-2), var(--dish-ground-floor), var(--dish-ground-rim);
}
@supports (corner-shape: squircle) { .ledger { corner-shape: squircle; } }
.ln {
  display: grid;
  grid-template-columns: 2.9rem 1.5rem minmax(0, 1fr);
  column-gap: 0.4rem;
  align-items: baseline;
  block-size: var(--row-h);
  margin: 0;
  box-shadow: var(--seam-x);
}
.ln:last-child { box-shadow: none; }
.ln.empty { display: block; line-height: var(--row-h); }
/* the time: a marking behind a standing seam */
.t {
  position: relative;
  align-self: center;
  font-family: var(--font-mono);
  font-size: 0.55rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  font-variant-numeric: tabular-nums;
  color: var(--ui-text-dimmed);
  text-shadow: 0 1px 0 light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.85));
}
.t::after {
  content: "";
  position: absolute;
  inset-block: -0.42rem;
  inset-inline-end: 0;
  inline-size: 2px;
  background-image: linear-gradient(90deg, var(--seam-shade) 0 1px, var(--seam-catch) 1px 2px);
}
.e {
  align-self: center;
  text-align: center;
  font-size: 0.85rem;
}
/* the name: the board's display type, raised */
.w {
  font-family: var(--font-display);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow:
    0 -0.5px 0 light-dark(rgb(255 255 255 / 0.9), rgb(255 255 255 / 0.11)),
    0 0.5px 0 light-dark(rgb(0 0 0 / 0.25), rgb(0 0 0 / 0.6));
}
.mine .w { color: light-dark(var(--ui-color-primary-700), var(--ui-color-primary-300)); }
.c {
  margin-inline-start: 0.5rem;
  font-family: var(--font-mono);
  font-size: 0.56rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  color: var(--ui-text-dimmed);
}
.c:not(:empty)::before { content: "· "; }
/* a landing row: the theme's commit flash, on the row's own box */
.row-enter-active { animation: var(--animate-row-land); }
.row-leave-active { display: none; }
@media (prefers-reduced-motion: reduce) {
  .row-enter-active { animation: none; }
}

/* THE DECK */
.deck {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.keys {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex: none;
}
.keycap {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
/* A KEY — a raised part, the same convex the plate's other keys are; it
   seats on press. */
.key {
  inline-size: 2rem;
  block-size: 1.9rem;
  padding: 0;
  border: 0;
  border-radius: var(--radius-strip);
  cursor: pointer;
  display: grid;
  place-items: center;
  background: var(--gradient-surface);
  box-shadow: var(--bevel), var(--elevation-1);
  font-size: 0.95rem;
  line-height: 1;
  transition: box-shadow 80ms, background 80ms;
}
@supports (corner-shape: squircle) { .key, .field { corner-shape: squircle; } }
.key:hover { background: linear-gradient(180deg, var(--ui-bg-accented), var(--ui-bg-elevated) 70%); }
.key:active {
  background: var(--gradient-recessed);
  box-shadow: var(--recess-lip), var(--inset-shadow-1);
}
.key:disabled { cursor: default; }
.key:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: 2px; }
.n {
  min-inline-size: 1.2rem;
  font-family: var(--font-mono);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  font-variant-numeric: tabular-nums;
  color: var(--hue);
  text-shadow: 0 1px 0 light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.85));
}
.sep {
  flex: none;
  inline-size: 2px;
  block-size: 1.5rem;
  margin-inline: 0.15rem auto;
  background-image: linear-gradient(90deg, var(--seam-shade) 0 1px, var(--seam-catch) 1px 2px);
}
.as {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex: none;
}
.as .stamp { font-size: 0.56rem; }
/* THE NAME — a shallow cut with the shuffle as a marking inside it */
.name {
  position: relative;
  display: inline-flex;
  align-items: center;
}
.field {
  inline-size: 6.2rem;
  block-size: 1.9rem;
  padding: 0 1.6rem 0 0.5rem;
  border: 0;
  border-radius: var(--radius-strip);
  font-family: var(--font-mono);
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: lowercase;
  color: var(--ui-text-highlighted);
  background: var(--gradient-recessed);
  box-shadow: var(--recess-lip), var(--inset-shadow-1);
  text-shadow: 0 1px 0 light-dark(rgb(255 255 255 / 0.7), rgb(0 0 0 / 0.85));
}
.field:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: -1px; }
.field.bad { box-shadow: var(--recess-lip), var(--inset-shadow-1), inset 0 0 0 1.5px var(--ui-error); }
.shuffle {
  position: absolute;
  inset-inline-end: 0.2rem;
  inline-size: 1.4rem;
  block-size: 1.4rem;
  padding: 0;
  border: 0;
  border-radius: var(--radius-chip);
  background: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  color: var(--ui-text-dimmed);
}
.shuffle:hover { color: var(--ui-text-toned); }
.shuffle:focus-visible { outline: 2px solid var(--ui-primary); outline-offset: -2px; }
.shuffle.spin > * { animation: turn 320ms ease-out; }
@keyframes turn { to { transform: rotate(180deg); } }
/* THE CITY SWITCH — a cut track, a raised knob; on, the knob is the accent part */
.switch {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  cursor: pointer;
}
.switch input {
  position: absolute;
  opacity: 0;
  inline-size: 1px;
  block-size: 1px;
}
.switch i {
  position: relative;
  display: block;
  inline-size: 1.8rem;
  block-size: 1rem;
  border-radius: 999px;
  background: var(--gradient-recessed);
  box-shadow: var(--recess-lip), var(--inset-shadow-1);
}
.switch i::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  inline-size: 12px;
  block-size: 12px;
  border-radius: 50%;
  background: var(--gradient-surface);
  box-shadow: var(--bevel), var(--elevation-1);
  transition: left 160ms var(--ease-out), background 160ms, box-shadow 160ms;
}
.switch input:checked + i::after {
  left: calc(100% - 14px);
  background-image: var(--gradient-accent);
  box-shadow: var(--accent-edge), var(--accent-body), var(--accent-cast-pressed);
}
.switch input:focus-visible + i { outline: 2px solid var(--ui-primary); outline-offset: 2px; }
/* Under 30rem the name row drops under the keys. */
@container (max-width: 30rem) {
  .deck { flex-wrap: wrap; row-gap: 0.6rem; }
  .sep { display: none; }
  .as { flex: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .shuffle.spin > * { animation: none; }
  .switch i::after, .key { transition: none; }
}
</style>
