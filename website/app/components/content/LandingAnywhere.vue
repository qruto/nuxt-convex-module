<script setup lang="ts">
// NUXT, OR PLAIN VUE — one selector switch and two code wells. Throw it
// and only the SETUP changes: a `modules` line in nuxt.config, or a plugin
// call in main.ts. The component underneath never changes, which is the
// whole claim, so it is the one well that stays put — and it says so, with
// a seal that lights for a moment every time the switch is thrown and the
// well beside it does not move.
//
// No network and nothing to type: the point is a comparison, and a
// comparison wants both sides in front of you at once.
type Side = 'nuxt' | 'vue'

interface Seg { text: string, tone?: 'key' | 'str' | 'fn' | 'dim' }

// `short` is the phone's label: at 390 the row is 284px wide and "plain
// Vue" was truncating to "plain V…", which is worse than saying "Vue".
const SIDES: Array<{ id: Side, label: string, short: string, icon: string, mark: string }> = [
  { id: 'nuxt', label: 'Nuxt', short: 'Nuxt', icon: 'i-simple-icons-nuxt', mark: '#00DC82' },
  { id: 'vue', label: 'plain Vue', short: 'Vue', icon: 'i-simple-icons-vuedotjs', mark: '#42B883' },
]

const SETUP: Record<Side, { file: string, note: string, lines: Seg[][] }> = {
  nuxt: {
    file: 'nuxt.config.ts',
    note: 'One module. Every composable is auto-imported from here.',
    lines: [
      [{ text: 'export default ', tone: 'key' }, { text: 'defineNuxtConfig', tone: 'fn' }, { text: '({' }],
      [{ text: '  modules: [' }, { text: '\'nuxt-convex-module\'', tone: 'str' }, { text: '],' }],
      [{ text: '})' }],
    ],
  },
  vue: {
    file: 'main.ts',
    note: 'One provide call. The same composables, imported from the /vue subpath.',
    lines: [
      [{ text: 'const ', tone: 'key' }, { text: 'client = ' }, { text: 'new ', tone: 'key' }, { text: 'ConvexVueClient', tone: 'fn' }, { text: '(url)' }],
      [{ text: 'app.' }, { text: 'provide', tone: 'fn' }, { text: '(ConvexClientKey, client)' }],
      [{ text: '' }],
    ],
  },
}

const COMPONENT: Seg[][] = [
  [{ text: 'const ', tone: 'key' }, { text: 'messages = ' }, { text: 'useQuery', tone: 'fn' }, { text: '(api.messages.list)' }],
  [{ text: 'const ', tone: 'key' }, { text: 'send = ' }, { text: 'useMutation', tone: 'fn' }, { text: '(api.messages.send)' }],
]

const side = ref<Side>('nuxt')
// The seal on the component well: lit for a beat after every throw, which
// is the moment a reader is looking for the difference that isn't there.
const sealed = ref(false)
let sealTimer: ReturnType<typeof setTimeout> | undefined

function choose(next: Side) {
  if (side.value === next) return
  side.value = next
  sealed.value = true
  clearTimeout(sealTimer)
  sealTimer = setTimeout(() => {
    sealed.value = false
  }, 1400)
}
onUnmounted(() => clearTimeout(sealTimer))

function toggle() {
  choose(side.value === 'nuxt' ? 'vue' : 'nuxt')
}
function onKey(event: KeyboardEvent) {
  if (event.key === 'ArrowLeft') choose('nuxt')
  else if (event.key === 'ArrowRight') choose('vue')
  else return
  event.preventDefault()
}
</script>

<template>
  <figure class="part-plate sheen noise @container m-0 mx-auto w-full max-w-3xl px-5 pt-5 pb-6 sm:px-7">
    <!-- THE SELECTOR: a two-position switch with each side's own mark,
         and the marks are the control — tap either one, throw the switch,
         or use the arrow keys. -->
    <header class="flex items-center justify-center gap-2 sm:gap-5">
      <button
        v-for="(entry, index) in SIDES"
        :key="entry.id"
        type="button"
        class="face flex min-w-0 flex-1 items-center gap-2 rounded-strip px-1 py-2 outline-none focus-visible:ring-2 focus-visible:ring-primary sm:gap-3 sm:px-2"
        :class="[
          index === 0 ? 'flex-row-reverse justify-start text-right' : 'justify-start text-left',
          side === entry.id ? 'is-on' : '',
          // The switch is the middle of this row, so the two faces order
          // themselves around it: Nuxt reads inward from the left, plain
          // Vue outward to the right.
          index === 0 ? 'order-1' : 'order-3',
        ]"
        :style="{ '--mark': entry.mark }"
        :aria-pressed="side === entry.id"
        @click="choose(entry.id)"
      >
        <span
          class="min-w-0 truncate font-display text-sm font-semibold transition-colors duration-200 sm:text-lg"
          :class="side === entry.id ? 'text-highlighted' : 'text-dimmed'"
        ><span class="sm:hidden">{{ entry.short }}</span><span class="hidden sm:inline">{{ entry.label }}</span></span>
        <UIcon
          :name="entry.icon"
          class="mark size-6 flex-none sm:size-9"
          aria-hidden="true"
        />
      </button>

      <!-- THE SWITCH, between the two marks it chooses between. -->
      <button
        type="button"
        role="switch"
        :aria-checked="side === 'vue'"
        aria-label="Run the client in plain Vue instead of Nuxt"
        class="selector part-well relative order-2 h-9 w-16 flex-none outline-none focus-visible:ring-2 focus-visible:ring-primary sm:h-10 sm:w-20"
        @click="toggle"
        @keydown="onKey"
      >
        <span
          class="knob convex bevel absolute top-1 left-0 h-7 w-7 rounded-strip transition-[translate] duration-200 ease-out sm:h-8 sm:w-9"
          :class="side === 'vue' ? 'translate-x-8 sm:translate-x-10' : 'translate-x-1'"
          aria-hidden="true"
        ><i class="absolute inset-y-2 left-1/2 w-px -translate-x-1/2 bg-(--seam-shade) shadow-[1px_0_0_var(--seam-catch)]" /></span>
      </button>
    </header>

    <div class="mt-5 grid grid-cols-1 gap-4">
      <!-- THE SETUP WELL — the one thing that changes. It slides in from
           the side that was chosen, so the swap has a direction. -->
      <div>
        <div class="mb-2 flex items-center gap-3 stamp">
          <Transition
            name="swap"
            mode="out-in"
          >
            <span
              :key="side"
              class="concave-text flex-none text-toned"
            >{{ SETUP[side].file }}</span>
          </Transition>
          <span
            class="scribe flex-1"
            aria-hidden="true"
          />
          <span class="concave-text flex-none text-dimmed">setup · changes</span>
        </div>
        <Transition
          :name="side === 'vue' ? 'swap-left' : 'swap-right'"
          mode="out-in"
        >
          <pre
            :key="side"
            class="part-code m-0 overflow-x-auto px-3 py-3.5 font-mono text-[0.66rem] leading-[1.9] sm:px-4 sm:text-[0.78rem]"
          ><code><span
            v-for="(l, i) in SETUP[side].lines"
            :key="i"
            class="code-line block"
            :line="i + 1"
          ><span
            v-for="(seg, j) in l"
            :key="j"
            :class="seg.tone ? `tone-${seg.tone}` : 'text-highlighted'"
          >{{ seg.text }}</span></span></code></pre>
        </Transition>
        <p class="mt-2 mb-0 min-h-10 text-sm leading-relaxed text-muted">
          {{ SETUP[side].note }}
        </p>
      </div>

      <!-- THE COMPONENT WELL — the thing that does not change. -->
      <div>
        <div class="mb-2 flex items-center gap-3 stamp">
          <span class="concave-text flex-none text-toned">Messages.vue</span>
          <span
            class="scribe flex-1"
            aria-hidden="true"
          />
          <span
            class="seal concave-text flex flex-none items-center gap-1.5"
            :class="sealed ? 'is-lit' : 'text-dimmed'"
          >
            <UIcon
              name="i-lucide-check"
              class="size-3.5"
              aria-hidden="true"
            />
            component · identical
          </span>
        </div>
        <pre class="part-code m-0 overflow-x-auto px-3 py-3.5 font-mono text-[0.66rem] leading-[1.9] sm:px-4 sm:text-[0.78rem]"><code><span
          v-for="(l, i) in COMPONENT"
          :key="i"
          class="code-line block"
          :line="i + 1"
        ><span
          v-for="(seg, j) in l"
          :key="j"
          :class="seg.tone ? `tone-${seg.tone}` : 'text-highlighted'"
        >{{ seg.text }}</span></span></code></pre>
      </div>
    </div>
  </figure>
</template>

<style scoped>
/* The two marks: brushed ink at rest, the vendor's own colour when that
   side is the one running. Colour only — neither mark moves. */
.mark {
  color: var(--ui-text-dimmed);
  opacity: 0.75;
  transition: color 0.25s var(--ease-out), opacity 0.25s var(--ease-out), filter 0.25s var(--ease-out);
}
.face.is-on .mark {
  color: var(--mark);
  opacity: 1;
  filter: drop-shadow(0 0 10px color-mix(in srgb, var(--mark) 40%, transparent));
}
.face:hover .mark {
  opacity: 1;
}
.knob {
  cursor: pointer;
}
/* The three inks the site's shiki theme uses, hand-set: these wells are
   built markup rather than fences, so they colour their own tokens. */
.tone-key { color: var(--ui-primary); }
.tone-fn { color: light-dark(var(--ui-color-primary-700), var(--ui-color-primary-300)); }
.tone-str { color: light-dark(var(--ui-color-primary-600), var(--ui-color-primary-300)); }
.tone-dim { color: var(--ui-text-dimmed); font-style: italic; }
/* The seal: dim until the switch is thrown, then lit for a beat — the
   moment the reader is looking for a change in this well and not
   finding one. */
.seal {
  color: var(--ui-text-dimmed);
  transition: color 0.3s var(--ease-out);
}
.seal.is-lit {
  color: light-dark(var(--ui-color-success-600), var(--ui-color-success-400));
}
.swap-enter-active, .swap-leave-active,
.swap-left-enter-active, .swap-left-leave-active,
.swap-right-enter-active, .swap-right-leave-active {
  transition: opacity 0.2s var(--ease-out), translate 0.2s var(--ease-out);
}
.swap-enter-from { opacity: 0; translate: 0 4px; }
.swap-leave-to { opacity: 0; translate: 0 -4px; }
/* Chosen on the right, so the new well arrives from the right. */
.swap-left-enter-from { opacity: 0; translate: 1.5rem 0; }
.swap-left-leave-to { opacity: 0; translate: -1.5rem 0; }
.swap-right-enter-from { opacity: 0; translate: -1.5rem 0; }
.swap-right-leave-to { opacity: 0; translate: 1.5rem 0; }
@media (prefers-reduced-motion: reduce) {
  .swap-enter-active, .swap-leave-active,
  .swap-left-enter-active, .swap-left-leave-active,
  .swap-right-enter-active, .swap-right-leave-active { transition: none; }
}
</style>
