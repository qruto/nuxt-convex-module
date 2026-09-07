# Sync checklist

One pass, per upstream release. Tick in order — later steps assume earlier ones.

## Prepare

- [ ] Read the current baseline and file map in [`PARITY.md`](../../../../PARITY.md) §1.
- [ ] Read [`PARITY.md`](../../../../PARITY.md) §3.2 (`D-*`) and §3.4 — they say what **not** to port.
- [ ] Have an upstream checkout with tags: `git -C "$UPSTREAM" fetch --tags`.

## Diff

- [ ] `git -C "$UPSTREAM" log --oneline <oldTag>..<newTag> -- <paths>` — read the *why*.
- [ ] `git -C "$UPSTREAM" diff <oldTag> <newTag> -- <paths>` — read the *what*.
- [ ] `<paths>` = the mapped entry points **and** the internals the port re-implements. For
      `convex` that means `src/browser/sync` as well — skipping it misses fixes like
      `7ceee3e`.
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

- [ ] `PARITY.md` §1 — pinned-baselines table (keep the row shape).
- [ ] `README.md` — the `` `package@version` `` prose.
- [ ] `website/app/utils/upstream-baselines.ts`.
- [ ] `website/content/3.components/1.index.md` — last cell of each component row.
- [ ] `PARITY.md` §4 *History* — a row, including "nothing needed porting" if so.
- [ ] New divergence? Job 3 in [`SKILL.md`](../SKILL.md) — entry + marker + test.
- [ ] New file? `PARITY.md` §1 *File by file*, or `test/unit/parity-manifest.test.ts` fails.
- [ ] Peer range moved? `package.json` **and** `.github/dependabot.yml`.

## Verify

- [ ] `pnpm dev:prepare`
- [ ] `pnpm lint`
- [ ] `pnpm test:types`
- [ ] `pnpm test`
- [ ] `pnpm test:quality`

## Ship

- [ ] Commit as `chore(parity): track <package> <version>`.
- [ ] Body names each upstream commit ported, and each deliberately skipped with the reason.
- [ ] PR description links the upstream compare view.
