# Sync checklist

One pass, per upstream release. Tick in order — later steps assume earlier ones.

## Prepare

- [ ] Read the current baseline and file map in [`PARITY.md`](../../../../PARITY.md) §1.
- [ ] Read [`PARITY.md`](../../../../PARITY.md) §3.2 (`D-*`) and §3.4 — they say what **not** to port.

## Diff

- [ ] `pnpm parity:diff <convex|better-auth|polar> [to]` — the commit list (the *why*), then the
      diff (the *what*), over the mapped paths **and** the internals the port re-implements.
- [ ] `npm view <package>@<old> exports` against `<new>` — a new entry point is a scope decision.
- [ ] Classify every hunk: port / skip (formatting) / skip (`@internal`) / skip (already ruled
      out) / re-read a `D-*` entry first.
- [ ] For anything `@internal`: confirm against the **published** `.d.ts`, not the source.

## Port

- [ ] Apply each real change to the mapped Vue file, using the
      [PARITY.md §2.2 translation rules](../../../../PARITY.md#22-translation-rules).
- [ ] Keep upstream's declaration order, branch order, early returns and internal names.
- [ ] Keep user-facing error and warning texts verbatim, modulo sanctioned name substitutions.
- [ ] Add or adjust tests mirroring the upstream change.
- [ ] For an upstream fix that needs no port: add a row to §3.4 **and a test pinning the
      property**, so it cannot be reintroduced.

## Record

- [ ] The devDependency (root, and `website/package.json` where it lists the package) and the lockfile.
- [ ] `PARITY.md` §1 — pinned-baselines table (keep the row shape).
- [ ] `website/app/utils/upstream-baselines.ts`.
- [ ] `website/content/3.components/1.index.md` — last cell of each component row.
- [ ] `PARITY.md` §3 — the `<package>@<version>` upstream citations.
- [ ] `PARITY.md` §4 *History* — a row with the PR number, including "nothing ported" if so.
- [ ] New divergence? Job 3 in [`SKILL.md`](../SKILL.md) — entry + marker + test.
- [ ] New file? `PARITY.md` §1 *File by file*, or `test/unit/parity-manifest.test.ts` fails.
- [ ] Peer range moved? Every site in PARITY.md §4's *Move a peer range* paragraph.

## Verify

- [ ] The full gate in [`AGENTS.md`](../../../../AGENTS.md#verification).

## Ship

- [ ] PR title by PARITY.md §4's release mapping: `chore(parity)`, `feat(parity)` or `feat(parity)!`.
- [ ] Body names each upstream commit ported, and each deliberately skipped with the reason.
- [ ] Body links the upstream compare view.
