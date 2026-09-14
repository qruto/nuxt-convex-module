---
name: upstream-parity
description: >-
  Keep nuxt-convex-module diffable against its upstream React/Next sources.
  Use when a new convex, @convex-dev/better-auth or @convex-dev/polar release
  lands, when bumping a pinned baseline, when porting an upstream change into
  the Vue/Nuxt runtime, when adding a Vue-only extension or a deliberate
  divergence, or when auditing whether PARITY.md still describes the source
  tree. Covers locating the upstream repository, diffing mapped paths between
  two tags, classifying each hunk, applying the React to Vue translation, and
  updating every place a baseline version is stated.
license: MIT
---

# Upstream parity: syncing the port

`nuxt-convex-module` ports Convex's own client code from two distinct upstream sources, and a
sync is scoped to whichever one released:

- **Convex's own client** — the official React/Next entry points shipped inside the `convex`
  package (`convex/react`, `convex/nextjs`, `convex/react-clerk`, `convex/react-auth0`). One
  baseline covers all four.
- **Convex components that ship a React/Next client** — separate npm packages on their own
  release schedules, each with **its own** baseline: `@convex-dev/better-auth`,
  `@convex-dev/polar`.

The goal is **file-for-file diffability**: when upstream releases, the corresponding Vue file
should change in the same shape.

Three documents divide the work, and nothing is duplicated between them. Read them in this
order:

| Document | Carries | Read it for |
|---|---|---|
| [`PARITY.md`](../../../PARITY.md) | The **contract and the ledger** — what is ported, the rules, every divergence with its reason and pinning test | What maps to what, and what was already decided |
| [`AGENTS.md`](../../../AGENTS.md) | **Working in this repo** — how to treat `src/runtime/`, and the verification gate | Anything not about parity |
| This skill | The **process** | What to actually run, in what order |

**Never start from the code.** Start from PARITY.md — half of what looks like a gap is an
entry in §1 (*Not ported*) or §3 saying it was decided deliberately.

---

## Job 1 — sync an upstream release / bump a baseline

### 1. Read the current baseline

[`PARITY.md` §1](../../../PARITY.md#1-what-is-ported) gives the pinned version, the upstream
repository and its tag format:

| Tier | Baseline | Repository | Tag format |
|---|---|---|---|
| Convex's own client | `convex` | `get-convex/convex-js` | `npm/<version>` |
| Component | `@convex-dev/better-auth` | `get-convex/better-auth` | `v<version>` |
| Component | `@convex-dev/polar` | `get-convex/polar` | `v<version>` |

**Sync one tier at a time.** A `convex` release moves one baseline covering all four of its
entry points; a component release moves only that component's. Bumping one never implies
re-verifying the others — the version sites in step 5 are per-baseline too.

### 2. Get the upstream checkout

If you already have one, use it. Otherwise clone somewhere outside this repo:

```bash
git clone --filter=blob:none https://github.com/get-convex/convex-js.git
git -C convex-js fetch --tags
```

Use explicit HTTPS URLs — an SSH remote will fail in a non-interactive session. Set a variable
for the rest of this job:

```bash
UPSTREAM=/path/to/convex-js
```

### 3. Diff the mapped paths — plus the ones the port re-implements

The mapped paths come from [`PARITY.md` §1, *File by file*](../../../PARITY.md#file-by-file). Diffing the whole
repo buries the signal in build config and internal churn, but diffing *only* the mapped paths
misses a real category: upstream code the port **re-implements** rather than mirrors. Those
files are not in the map — there is no Vue file that corresponds to them — yet a fix in one can
still imply a fix here.

For `convex` that means `src/browser/sync`, home of `PaginatedQueryClient`
([X-05](../../../PARITY.md#x-05--paginatedqueryclient)), whose page-management logic
`use-paginated-query.ts` re-implements. Diffing without it would have missed convex 1.43.0's
`7ceee3e` entirely.

```bash
# convex — mapped entry points, then the re-implemented internals
git -C "$UPSTREAM" diff npm/1.45.0 npm/1.46.0 -- \
  src/react src/nextjs src/react-clerk src/react-auth0
git -C "$UPSTREAM" diff npm/1.45.0 npm/1.46.0 -- src/browser/sync

# @convex-dev/better-auth
git -C "$UPSTREAM" diff v0.12.5 v0.13.0 -- src/react src/nextjs src/client

# @convex-dev/polar
git -C "$UPSTREAM" diff v0.9.2 v0.10.0 -- src/react
```

Read the commit list too — it explains *why* a hunk exists, which decides how to classify it:

```bash
git -C "$UPSTREAM" log --oneline npm/1.45.0..npm/1.46.0 -- \
  src/react src/nextjs src/react-clerk src/react-auth0 src/browser/sync
```

A `src/browser/sync` hunk is rarely a port. Usually it either does not touch behaviour the
composable layer reproduces, or it fixes a bug the Vue translation already rules out — in which
case it becomes a [§3.4](../../../PARITY.md#34-upstream-fixes-the-translation-already-rules-out) row plus a
pinning test, not a code change. Deciding that is the point of looking.

### 4. Classify every hunk

| Hunk is… | Do |
|---|---|
| A real behaviour or public-API change | **Port it.** Translate with the [§2.2 rules](../../../PARITY.md#22-translation-rules), add or adjust a test |
| Formatting, comments, imports reordered | Skip |
| Inside a symbol marked `@internal` upstream | Check [`PARITY.md` §1, *Not ported*](../../../PARITY.md#not-ported-x-) — most are already `X-*` entries. Verify against the *published* `.d.ts`, not the source: `@internal` symbols are usually stripped from the shipped types, so they are not importable even if `export *` exposes them at runtime |
| A fix for a bug the Vue translation already rules out | Do **not** port. Add a row to [`PARITY.md` §3.4](../../../PARITY.md#34-upstream-fixes-the-translation-already-rules-out) **and a test that pins the property**, so a later refactor cannot reintroduce the bug |
| Touching something PARITY.md lists as a divergence (`D-*`) | Re-read that entry's **On sync** line first. Several say "do not sync back" |
| In a file the port does not map | Check whether it *should* be mapped now — a new upstream entry point is a scope decision, not a silent port |

The fourth row is the one people get wrong. Two of the last three convex releases landed
entirely in that category.

### 5. Move the version everywhere it is stated

Four places, listed in [`PARITY.md` §4](../../../PARITY.md#on-every-baseline-bump):

1. `PARITY.md`'s pinned-baselines table — **keep the row shape**, a test parses it
2. `README.md` prose — `` `convex@1.46.0` ``
3. `website/app/utils/upstream-baselines.ts`
4. `website/content/3.components/1.index.md` — last cell of each component row

`test/unit/upstream-baselines.test.ts` fails if any drift apart.

### 6. Record what happened

- Add a row to [`PARITY.md` §4, *History*](../../../PARITY.md#history) — date, package,
  from → to, and what was ported (including "nothing").
- If a peer range moved, mirror it in `package.json` **and** `.github/dependabot.yml`.
- Commit as `chore(parity): track <package> <version>`, and describe each upstream commit
  ported or deliberately skipped in the body. Past syncs (`8a5db10`) are the model.

### 7. Run the gate

```bash
pnpm dev:prepare    # build the module stub + prepare Nuxt
pnpm lint
pnpm test:types     # vue-tsc (lib + website)
pnpm test           # vitest: unit + nuxt projects
pnpm test:quality   # fallow: unused exports, duplication, file-health
```

See [`references/sync-checklist.md`](references/sync-checklist.md) for the same sequence as a
tickable list.

---

## Job 2 — add a ported symbol or a Vue-only extension

**Ported symbol** (it exists upstream): keep the upstream name **verbatim**, place the
declaration in upstream's order within the file, and re-export it from `src/runtime/vue/index.ts`
**above** the `--- Vue-only additions ---` fence. Add the row to `PARITY.md` §1's file map if it lands in
a new file.

**Vue-only extension** (no upstream origin): it must be strictly *additive* — it may not
rename, replace or gate anything upstream ships. Then:

1. Export it from `src/runtime/vue/index.ts` **below** the Vue-only fence.
2. Add an `A-*` entry to [`PARITY.md` §3.3](../../../PARITY.md#33-port-only-additions-a-) using
   the template in [`references/divergence-template.md`](references/divergence-template.md).
3. Add its file to §1's port-only table.
4. Add a `PARITY: A-nn` comment marker at the source site.
5. Write a test — the entry's **Pinned by** field must name a real file.

`test/unit/parity-manifest.test.ts` fails if a new runtime file is not named in PARITY.md, so
step 3 is not optional.

---

## Job 3 — record a deliberate divergence

A divergence is not recorded until it has **all three**: a `D-*` entry in
[`PARITY.md` §3.2](../../../PARITY.md#32-behaviour-d-), a `PARITY: D-nn` comment marker at the
source site, and a named test. The manifest test enforces the first two; nothing but review
enforces the third.

Use the six-field template in [`references/divergence-template.md`](references/divergence-template.md).
The **On sync** field is the one that pays off later — it tells the next person whether to
adopt upstream's version or hold the line.

Before writing one, ask whether it is really a `D-*`:

- Different *name or shape* only, or a required option relaxed to optional with an auto-provided
  default — sanctioned by [§2.1](../../../PARITY.md#21-the-contract) or a
  [§2.2](../../../PARITY.md#22-translation-rules) rule → an `N-*` table row in §3.1, not a divergence.
- Purely *additional* surface → `A-*`, under whichever §3.3 group it fits: *ergonomics*,
  *wiring and plumbing*, *security guards*, *tooling*.
- Actually different *behaviour* → `D-*`, under its §3.2 group: *forced by the Vue/Nitro runtime*,
  *consequences of an unimportable upstream internal*, *upstream defects not carried over*, or
  *type and signature refinements*. If none fits, that is worth a new group, not a stretched one.

---

## Red flags

Changes that read as cleanups and quietly break parity. If a diff contains one of these,
stop and check PARITY.md:

- **Renaming an upstream symbol** to something more idiomatic — including internal, unexported
  ones like `splitQuery` and `createInitialState`. Their names are load-bearing for diffing.
- **"Fixing" `ConvexVueClient.watchPaginatedQuery`** to return a watch. It throws by design
  ([D-05](../../../PARITY.md#d-05--watchpaginatedquery-throws-instead-of-returning-a-watch)).
- **Restoring upstream's `callWithToken` predicate.** Upstream's is inverted
  ([D-08](../../../PARITY.md#d-08--the-jwt-cache-retries-on-auth-errors-upstream-retries-on-non-auth-errors)).
- **Tidying away `xssValidator: false`** in `AUTH_PROXY_SECURITY_RULES`. It is a correctness
  fix, not hardening — without it, credentials containing `<` or `>` get a 400 before reaching
  Better Auth ([A-14](../../../PARITY.md#a-14--the-auth-proxy-route-and-its-security-rules)).
- **Dropping `noopener`** from Polar's `window.open`
  ([D-09](../../../PARITY.md#d-09--windowopen-gains-noopener)).
- **Removing an `import.meta.server` short-circuit** as dead code. Each one preserves an
  upstream invariant React gets for free ([D-01](../../../PARITY.md#d-01--subscriptions-and-setauth-are-skipped-during-ssr)).
- **Hardcoding the Better Auth client back to `./client`.** The runtime resolves the app's own
  client through the `#convex/auth-client` alias.
- **Rewriting an upstream line to satisfy a lint or complexity rule.** Scope the rule off for
  `src/runtime/**` in `eslint.config.js` or `.fallowrc.jsonc` instead.
- **Reimplementing `convexClient` / `crossDomainClient`.** They are framework-agnostic and
  imported as-is from `@convex-dev/better-auth/client/plugins`.

---

## Auditing without a release

To check the manifest still describes the tree:

```bash
pnpm vitest --project unit --run test/unit/parity-manifest.test.ts test/unit/upstream-baselines.test.ts
```

To find divergences documented in code but missing from the ledger:

```bash
grep -rnE "Unlike upstream|Diverges from upstream|deliberate divergence|divergence from upstream|Upstream requires|no upstream counterpart|deviation from upstream|not sync back|[Pp]ort-only" src/runtime src/module.ts
```

Anything that turns up without a nearby `PARITY:` marker is a candidate for Job 3.
