# Divergence entry template

Paste under the right **group** of the right subsection of
[`PARITY.md`](../../../../PARITY.md) §3 — the group heading carries the kind, so the entry
does not repeat it — and fill every
field. All six are required — an entry missing **Why** or **On sync** is the one that gets
"cleaned up" two releases later.

## Behaviour (`D-*`) → §3.2

```md
#### D-nn — <one line, present tense, stating what the port does>

- **Kind** · behavioural divergence (<upstream bug | security hardening | forced by Vue/Nitro | additive default | type declaration only>)
- **Upstream** · `<package>@<baseline>` `<upstream file>` — `<symbol>`
- **Port** · [`<path under src/runtime>`](./src/runtime/<path>)
- **Pinned by** · `<test file>` — "<test name>"
- **On sync** · <keep | do not sync back | re-check if upstream fixes it>
- **Why** · <what upstream does, what the port does instead, and what breaks if you
  "fix" it back. Two to four sentences.>
```

## Port-only addition (`A-*`) → §3.3

```md
#### A-nn — <short noun phrase naming the addition>

- **Port** · [`<path>`](./src/runtime/<path>) — `<exported symbols>`
- **Pinned by** · `<test file>`
- **Why** · <what gap it fills, and why upstream has no counterpart. One to three sentences.>
```

Add **On sync** to an `A-*` entry too whenever the addition could be mistaken for
removable — a security guard, or anything whose absence would look tidier.

## Naming or shape (`N-*`) → §3.1 table row

```md
| <a id="n-nn"></a>**N-nn** | <upstream name or shape> | <port name or shape> | <the §2.2 rule that sanctions it> |
```

## After writing the entry

1. Add a comment marker at the source site — `// PARITY: D-nn`, or ` * PARITY: D-nn` inside a
   JSDoc block. Put it directly above the explanatory comment.
2. If the file is new, add it to §1's file map.
3. Run `pnpm vitest --project unit --run test/unit/parity-manifest.test.ts` — it fails if the
   ID, the marker and the cited test do not all line up.
