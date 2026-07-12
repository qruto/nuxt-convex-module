<script setup lang="ts">
// The loadout, demonstrated instead of described: a station rail covering
// the port's whole surface — each station shows the real API and a small
// working readout. Simulated in-page (the homepage has no deployment);
// the playground runs the real thing. Stamps are the upstream origin of
// each station, same as PARITY.md.
const stations = [
  { id: 'queries', label: 'Live queries', stamp: 'convex/react' },
  { id: 'pagination', label: 'Pagination', stamp: 'convex/react' },
  { id: 'ssr', label: 'SSR & preload', stamp: 'convex/nextjs' },
  { id: 'files', label: 'File storage', stamp: 'convex/react' },
  { id: 'auth', label: 'Auth', stamp: '@convex-dev/better-auth' },
  { id: 'billing', label: 'Billing', stamp: '@convex-dev/polar' },
  { id: 'devtools', label: 'DevTools', stamp: 'nuxt devtools' },
] as const

type StationId = typeof stations[number]['id']
const active = ref<StationId>('queries')

const tabEls: HTMLButtonElement[] = []
function setTabEl(el: unknown, i: number) {
  if (el) tabEls[i] = el as HTMLButtonElement
}

function activate(i: number) {
  const station = stations[i]
  if (station) active.value = station.id
}

function onTabKeydown(event: KeyboardEvent, i: number) {
  const last = stations.length - 1
  let next: number | null = null
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      next = i === last ? 0 : i + 1
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      next = i === 0 ? last : i - 1
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = last
      break
  }
  if (next === null) return
  event.preventDefault()
  activate(next)
  tabEls[next]?.focus()
}

/* ── Station readouts — small in-page simulations ─────────────── */

// Live queries: one mutation in, the subscribed ref updates.
const docs = ref(['ship it', 'seen by every subscriber'])
let docN = 1
function sendDemo() {
  docs.value = [...docs.value.slice(-3), `hi — mutation #${docN++}`]
}

// Pagination: cursor pages of 3, exhausted at 9.
const PAGE = 3
const TOTAL = 9
const loaded = ref(PAGE)
const pageStatus = computed(() => loaded.value >= TOTAL ? 'Exhausted' : 'CanLoadMore')
function loadMoreDemo() {
  loaded.value = Math.min(loaded.value + PAGE, TOTAL)
}

// SSR: replay the server-render → payload → live handoff.
const ssrStep = ref(3)
let ssrTimers: ReturnType<typeof setTimeout>[] = []
function replaySsr() {
  ssrTimers.forEach(clearTimeout)
  ssrStep.value = 0
  ssrTimers = [
    setTimeout(() => { ssrStep.value = 1 }, 120),
    setTimeout(() => { ssrStep.value = 2 }, 520),
    setTimeout(() => { ssrStep.value = 3 }, 920),
  ]
}

// Files: progress ticks up, then a storage ID lands.
const uploadPct = ref<number | null>(null)
const storageId = ref('')
let uploadTimer: ReturnType<typeof setInterval> | undefined
function uploadDemo() {
  if (uploadTimer) return
  storageId.value = ''
  uploadPct.value = 0
  uploadTimer = setInterval(() => {
    if (uploadPct.value === null) return
    uploadPct.value = Math.min(uploadPct.value + 9, 100)
    if (uploadPct.value === 100) {
      clearInterval(uploadTimer)
      uploadTimer = undefined
      storageId.value = 'kg24d8mn7apf…9d1'
    }
  }, 70)
}

// Auth: the boundary components swap with the auth state.
const signedIn = ref(false)

// Billing: CheckoutLink hands off to a Polar checkout session.
const checkedOut = ref(false)

onUnmounted(() => {
  ssrTimers.forEach(clearTimeout)
  if (uploadTimer) clearInterval(uploadTimer)
})
</script>

<template>
  <section class="lo ld-sect">
    <div class="ld-inner">
      <header class="lo-head">
        <p class="ld-eyebrow etched">
          <span
            class="ld-tick"
            aria-hidden="true"
          />
          <span class="ld-index">03</span>
          LOADOUT
        </p>
        <h2 class="ld-title">
          The whole kit, demonstrated
        </h2>
        <p class="ld-sub">
          Every surface of the port with a working readout. The readouts are
          simulated in-page — the
          <NuxtLink
            to="/playground"
            class="lo-link"
          >playground</NuxtLink>
          runs them against a real deployment.
        </p>
      </header>

      <div class="kit">
        <div
          class="kit-rail"
          role="tablist"
          aria-label="Capabilities"
          aria-orientation="vertical"
        >
          <button
            v-for="(s, i) in stations"
            :id="`kit-tab-${s.id}`"
            :key="s.id"
            :ref="el => setTabEl(el, i)"
            role="tab"
            :aria-selected="active === s.id"
            :aria-controls="`kit-panel-${s.id}`"
            :tabindex="active === s.id ? 0 : -1"
            class="kit-tab"
            :class="{ on: active === s.id }"
            @click="activate(i)"
            @keydown="onTabKeydown($event, i)"
          >
            <span class="kit-tab-label">{{ s.label }}</span>
            <span class="kit-tab-stamp mono">{{ s.stamp }}</span>
          </button>
        </div>

        <div
          :id="`kit-panel-${active}`"
          :key="active"
          class="kit-panel fade-up sheen"
          role="tabpanel"
          :aria-labelledby="`kit-tab-${active}`"
        >
          <!-- ── Live queries ─────────────────────────────────── -->
          <template v-if="active === 'queries'">
            <h3 class="kit-title">
              Reactive live queries
            </h3>
            <p class="kit-body">
              Results are refs that update when the data does — <code class="inline mono">useQuery</code>,
              <code class="inline mono">useQueries</code>, <code class="inline mono">useMutation</code>,
              <code class="inline mono">useAction</code>, all VueUse-shaped.
            </p>
            <div class="kit-demo">
              <pre class="kit-code mono"><code><span class="tk-k">const</span> messages = <span class="tk-f">useQuery</span>(api.messages.list, {})
<span class="tk-k">const</span> send = <span class="tk-f">useMutation</span>(api.messages.send)</code></pre>
              <div class="kit-readout">
                <span class="kit-readout-label mono etched">messages.value</span>
                <ul
                  class="kit-rows mono"
                  aria-live="polite"
                >
                  <li
                    v-for="d in docs"
                    :key="d"
                    class="kit-row"
                  >
                    {{ d }}
                  </li>
                </ul>
                <button
                  class="btn kit-act mono"
                  type="button"
                  @click="sendDemo"
                >
                  send({ body: 'hi' })
                </button>
              </div>
            </div>
          </template>

          <!-- ── Pagination ───────────────────────────────────── -->
          <template v-else-if="active === 'pagination'">
            <h3 class="kit-title">
              Cursor pagination
            </h3>
            <p class="kit-body">
              <code class="inline mono">usePaginatedQuery</code> pages by cursor and
              tells you when the table is exhausted.
            </p>
            <div class="kit-demo">
              <pre class="kit-code mono"><code><span class="tk-k">const</span> { results, status, loadMore } =
  <span class="tk-f">usePaginatedQuery</span>(api.messages.list, {},
    { initialNumItems: <span class="tk-n">3</span> })</code></pre>
              <div class="kit-readout">
                <span class="kit-readout-label mono etched">results · status</span>
                <ul
                  class="kit-chips mono"
                  aria-live="polite"
                >
                  <li
                    v-for="n in loaded"
                    :key="n"
                    class="kit-chip"
                  >
                    msg_{{ String(n).padStart(3, '0') }}
                  </li>
                </ul>
                <div class="kit-act-row">
                  <button
                    class="btn kit-act mono"
                    type="button"
                    :disabled="pageStatus === 'Exhausted'"
                    @click="loadMoreDemo"
                  >
                    loadMore(3)
                  </button>
                  <span
                    class="kit-status mono"
                    :class="{ done: pageStatus === 'Exhausted' }"
                  >{{ pageStatus }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- ── SSR & preload ────────────────────────────────── -->
          <template v-else-if="active === 'ssr'">
            <h3 class="kit-title">
              Server-rendered, no flash
            </h3>
            <p class="kit-body">
              <code class="inline mono">useAsyncQuery</code> and
              <code class="inline mono">preloadQuery</code> fetch on the server and hydrate
              into the live subscription — no flash of loading state.
            </p>
            <div class="kit-demo">
              <pre class="kit-code mono"><code><span class="tk-c">// runs on the server first</span>
<span class="tk-k">const</span> { data: messages } =
  <span class="tk-k">await</span> <span class="tk-f">useAsyncQuery</span>(api.messages.list, {})</code></pre>
              <div class="kit-readout">
                <span class="kit-readout-label mono etched">request timeline</span>
                <ol class="kit-line mono">
                  <li
                    class="kit-node"
                    :class="{ on: ssrStep >= 1 }"
                  >
                    <i aria-hidden="true" />SERVER FETCH
                  </li>
                  <li
                    class="kit-node"
                    :class="{ on: ssrStep >= 2 }"
                  >
                    <i aria-hidden="true" />HTML + PAYLOAD
                  </li>
                  <li
                    class="kit-node"
                    :class="{ on: ssrStep >= 3 }"
                  >
                    <i aria-hidden="true" />LIVE ON CLIENT
                  </li>
                </ol>
                <button
                  class="btn kit-act mono"
                  type="button"
                  @click="replaySsr"
                >
                  replay request
                </button>
              </div>
            </div>
          </template>

          <!-- ── File storage ─────────────────────────────────── -->
          <template v-else-if="active === 'files'">
            <h3 class="kit-title">
              File storage
            </h3>
            <p class="kit-body">
              <code class="inline mono">useUpload</code> tracks progress and hands back a
              storage ID; <code class="inline mono">useStorageUrl</code> resolves it to a URL.
              <code class="inline mono">useUploadQueue</code> does the same for many files.
            </p>
            <div class="kit-demo">
              <pre class="kit-code mono"><code><span class="tk-k">const</span> { upload, progress } =
  <span class="tk-f">useUpload</span>(api.files.generateUploadUrl)
<span class="tk-k">const</span> storageId = <span class="tk-k">await</span> <span class="tk-f">upload</span>(file)</code></pre>
              <div class="kit-readout">
                <span class="kit-readout-label mono etched">progress · storageId</span>
                <div
                  class="kit-bar"
                  role="progressbar"
                  :aria-valuenow="uploadPct ?? 0"
                  aria-valuemin="0"
                  aria-valuemax="100"
                >
                  <span
                    class="kit-bar-fill"
                    :style="{ width: `${uploadPct ?? 0}%` }"
                  />
                </div>
                <div class="kit-act-row">
                  <button
                    class="btn kit-act mono"
                    type="button"
                    @click="uploadDemo"
                  >
                    upload(file)
                  </button>
                  <span
                    v-if="storageId"
                    class="kit-status mono done"
                  >{{ storageId }}</span>
                </div>
              </div>
            </div>
          </template>

          <!-- ── Auth ─────────────────────────────────────────── -->
          <template v-else-if="active === 'auth'">
            <h3 class="kit-title">
              Auth, opt-in
            </h3>
            <p class="kit-body">
              Core ships the boundary components; install
              <code class="inline mono">@convex-dev/better-auth</code> and
              <code class="inline mono">useAuth</code>, the <code class="inline mono">/api/auth</code>
              proxy, and route middleware wire themselves up.
            </p>
            <div class="kit-demo">
              <pre class="kit-code mono"><code><span class="tk-t">&lt;Authenticated&gt;</span>Welcome back<span class="tk-t">&lt;/Authenticated&gt;</span>
<span class="tk-t">&lt;Unauthenticated&gt;</span>
  <span class="tk-t">&lt;a</span> href=<span class="tk-s">"/sign-in"</span><span class="tk-t">&gt;</span>Sign in<span class="tk-t">&lt;/a&gt;</span>
<span class="tk-t">&lt;/Unauthenticated&gt;</span></code></pre>
              <div class="kit-readout">
                <span class="kit-readout-label mono etched">rendered by auth state</span>
                <p
                  class="kit-auth-view"
                  aria-live="polite"
                >
                  <template v-if="signedIn">
                    Welcome back, <span class="mono">ada@convex.dev</span>
                  </template>
                  <template v-else>
                    <span class="kit-auth-link">Sign in</span>
                  </template>
                </p>
                <button
                  class="btn kit-act mono"
                  type="button"
                  @click="signedIn = !signedIn"
                >
                  {{ signedIn ? 'signOut()' : 'signIn()' }}
                </button>
              </div>
            </div>
          </template>

          <!-- ── Billing ──────────────────────────────────────── -->
          <template v-else-if="active === 'billing'">
            <h3 class="kit-title">
              Billing, opt-in
            </h3>
            <p class="kit-body">
              Install <code class="inline mono">@convex-dev/polar</code> and
              <code class="inline mono">CheckoutLink</code> /
              <code class="inline mono">CustomerPortalLink</code> register automatically —
              no extra modules, no config.
            </p>
            <div class="kit-demo">
              <pre class="kit-code mono"><code><span class="tk-t">&lt;CheckoutLink</span> :product-ids=<span class="tk-s">"[pro.id]"</span><span class="tk-t">&gt;</span>
  Upgrade to Pro
<span class="tk-t">&lt;/CheckoutLink&gt;</span></code></pre>
              <div class="kit-readout">
                <span class="kit-readout-label mono etched">rendered</span>
                <div class="kit-act-row">
                  <button
                    class="btn primary kit-act"
                    type="button"
                    @click="checkedOut = true"
                  >
                    Upgrade to Pro
                  </button>
                  <span
                    v-if="checkedOut"
                    class="kit-status mono done"
                    aria-live="polite"
                  >checkout session → polar.sh</span>
                </div>
              </div>
            </div>
          </template>

          <!-- ── DevTools ─────────────────────────────────────── -->
          <template v-else>
            <h3 class="kit-title">
              A Convex panel in Nuxt DevTools
            </h3>
            <p class="kit-body">
              Connection state, live subscriptions with their results, per-query
              server logs, auth state, and open-in-editor for Convex functions.
              On by default in dev.
            </p>
            <div class="kit-demo">
              <pre class="kit-code mono"><code><span class="tk-c">// nuxt.config.ts — opt out if you like</span>
convex: { devtools: <span class="tk-n">false</span> }</code></pre>
              <div class="kit-readout">
                <span class="kit-readout-label mono etched">devtools · convex</span>
                <ul class="kit-log mono">
                  <li class="kit-log-row">
                    <i
                      class="ok"
                      aria-hidden="true"
                    />CONNECTED · WS OPEN
                  </li>
                  <li class="kit-log-row">
                    <i aria-hidden="true" />messages.list · 3 docs · 12 ms
                  </li>
                  <li class="kit-log-row">
                    <i aria-hidden="true" />auth · signed in · open in editor ↗
                  </li>
                </ul>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lo-head { max-width: 44rem; margin-bottom: 2.4rem; }

.lo-link { color: var(--accent-soft); text-underline-offset: 3px; }
.lo-link:hover { color: var(--accent); }

/* ── Console layout — rail + panel ─────────────────────────────── */
.kit {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  gap: 1.2rem;
  align-items: start;
}

.kit-rail {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

/* A station tab: flat on the ground at rest, seated (raised) when active. */
.kit-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 0.6rem 0.85rem;
  border: 1px solid transparent;
  border-radius: var(--r);
  background: transparent;
  cursor: pointer;
  text-align: left;
  transition: box-shadow var(--transition), background var(--transition),
    color var(--transition);
}
.kit-tab:hover { background: var(--sink); }
.kit-tab.on {
  background:
    var(--grad-surface) padding-box,
    var(--grad-bevel) border-box;
  box-shadow: var(--elev-1);
}
.kit-tab:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

.kit-tab-label {
  font-family: var(--display);
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--ink-dim);
  transition: color var(--transition);
}
.kit-tab.on .kit-tab-label { color: var(--ink); }
.kit-tab:hover .kit-tab-label { color: var(--ink); }
.kit-tab-stamp {
  font-size: 0.6rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}
.kit-tab.on .kit-tab-stamp { color: var(--accent-soft); }

/* The station panel — one raised plate. */
.kit-panel {
  border: 1px solid transparent;
  border-radius: var(--r-lg);
  background:
    var(--grad-surface) padding-box,
    var(--grad-bevel) border-box;
  box-shadow: var(--elev-1);
  padding: 1.35rem 1.5rem 1.5rem;
  min-height: 21rem;
}

.kit-title {
  font-family: var(--display);
  font-weight: 600;
  font-size: 1.15rem;
  color: var(--ink);
  margin: 0 0 0.45rem;
}
.kit-body {
  font-family: var(--font);
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--ink-dim);
  margin: 0 0 1.1rem;
  max-width: 40rem;
}

.kit-demo {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 1rem;
  align-items: stretch;
}

/* Source well. */
.kit-code {
  margin: 0;
  padding: 0.9rem 1rem;
  background: var(--grad-sink);
  border-radius: 12px;
  box-shadow: var(--inset-2);
  font-size: 0.76rem;
  line-height: 1.8;
  color: var(--ink);
  overflow-x: auto;
  white-space: pre;
}
.tk-c { color: var(--ink-faint); }
.tk-k { color: var(--accent-soft); }
.tk-f { color: var(--accent); font-weight: 600; }
.tk-s { color: var(--ink-dim); }
.tk-t { color: var(--accent-soft); }
.tk-n { color: var(--accent); }

/* Readout well. */
.kit-readout {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.9rem 1rem;
  background: var(--grad-sink);
  border-radius: 12px;
  box-shadow: var(--inset-2);
}
.kit-readout-label {
  font-size: 0.58rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.kit-rows {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.76rem;
  width: 100%;
}
.kit-row {
  color: var(--ink);
  animation: fade-up 0.24s var(--ease-out) both;
  overflow-wrap: anywhere;
}
.kit-row::before {
  content: '▸';
  margin-right: 0.45rem;
  color: var(--accent-soft);
}

.kit-chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.68rem;
}
.kit-chip {
  color: var(--ink);
  background: var(--surface);
  border-radius: 7px;
  box-shadow: var(--elev-0);
  padding: 0.18rem 0.5rem;
  animation: fade-up 0.24s var(--ease-out) both;
}

.kit-act { font-size: 0.78rem; padding: 0.45rem 0.85rem; }
.kit-act-row { display: flex; align-items: center; flex-wrap: wrap; gap: 0.7rem; }
.kit-status {
  font-size: 0.66rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--ink-faint);
}
.kit-status.done { color: var(--accent-soft); }

/* SSR timeline. */
.kit-line {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.12em;
}
.kit-node {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--ink-faint);
  transition: color var(--transition);
}
.kit-node i {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--edge-hi);
  transition: background var(--transition), box-shadow var(--transition);
}
.kit-node.on { color: var(--ink-dim); }
.kit-node.on i { background: var(--accent); box-shadow: var(--glow-accent-soft); }

/* Upload progress — an inset track with an accent fill. */
.kit-bar {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: var(--bg);
  box-shadow: var(--inset-1);
  overflow: hidden;
}
.kit-bar-fill {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--accent);
  transition: width 90ms linear;
}

/* Auth readout. */
.kit-auth-view {
  margin: 0;
  font-family: var(--font);
  font-size: 0.88rem;
  color: var(--ink);
}
.kit-auth-view .mono { font-size: 0.8em; color: var(--accent-soft); }
.kit-auth-link { color: var(--accent-soft); text-decoration: underline; text-underline-offset: 3px; }

/* DevTools log. */
.kit-log {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  font-size: 0.7rem;
  color: var(--ink-dim);
}
.kit-log-row { display: flex; align-items: center; gap: 0.5rem; }
.kit-log-row i {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink-faint);
  flex: none;
}
.kit-log-row i.ok { background: var(--ok); box-shadow: var(--glow-ok); }

/* ── Responsive ────────────────────────────────────────────────── */
@media (max-width: 860px) {
  .kit { grid-template-columns: minmax(0, 1fr); }
  .kit-rail {
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 0.4rem;
    scrollbar-width: thin;
  }
  .kit-tab { flex: none; }
  .kit-demo { grid-template-columns: minmax(0, 1fr); }
  .kit-panel { min-height: 0; }
}
</style>
