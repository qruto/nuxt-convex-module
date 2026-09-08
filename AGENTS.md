# Agent guide — working in this repository

`nuxt-convex-module` is a **faithful Vue/Nuxt port** of Convex's own client code. That single
fact governs almost every judgment call here, so before changing anything under `src/runtime/`,
read [PARITY.md](./PARITY.md) — it is the contract *and* the ledger:

| You need | Read |
|---|---|
| What is ported, at which upstream version | [PARITY.md §1](./PARITY.md#1-what-is-ported) |
| The rules a port is held to — the contract, the React→Vue translations | [PARITY.md §2](./PARITY.md#2-how-parity-is-held) |
| Whether something is already a deliberate divergence | [PARITY.md §3](./PARITY.md#3-where-the-port-bends) |
| How to run a sync, port a change, or record a divergence | the [`upstream-parity` skill](./.agents/skills/upstream-parity/SKILL.md) |

This file covers only the rest: how to treat the ported runtime, and how to verify a change.

## Before you edit `src/runtime/`

The runtime mirrors upstream code shape deliberately. Three habits that are correct elsewhere
are wrong here:

- **Do not rename upstream symbols** — including unexported ones like `splitQuery` and
  `createInitialState`. Their names are load-bearing for diffing.
- **Do not rewrite an upstream line to satisfy a lint or complexity rule.** Scope the rule off
  for `src/runtime/**` in [`eslint.config.js`](./eslint.config.js) or
  [`.fallowrc.jsonc`](./.fallowrc.jsonc) instead — both already carry such exemptions, with
  reasons.
- **Do not "clean up" something that looks redundant** until you have checked
  [PARITY.md §3](./PARITY.md#3-where-the-port-bends) for it. A `PARITY: <ID>` comment marker at
  the site means the ledger explains why it is there; the skill's *red flags* list names the
  ones most often removed by mistake.

A new deliberate divergence is not recorded until it has an entry in PARITY.md §3, a
`PARITY: <ID>` marker at the source site, and a named test. `test/unit/parity-manifest.test.ts`
fails without the first two.

## Verification

Run the full gate before opening a PR:

```bash
pnpm dev:prepare    # build the module stub + prepare Nuxt
pnpm lint
pnpm test:types     # vue-tsc (lib + website)
pnpm test           # vitest: unit + nuxt projects
pnpm test:quality   # fallow: unused exports, duplication, file-health
```

The suite is also the parity safety net — see
[PARITY.md §2.3](./PARITY.md#23-enforcement) for what it pins and why
tests must keep mirroring upstream scenarios.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`website/convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->
