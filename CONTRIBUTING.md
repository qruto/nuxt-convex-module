# Contributing to nuxt-convex-module

Thank you for your interest in contributing! This guide covers everything you need to get started.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Reporting Security Issues](#reporting-security-issues)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Submitting Changes](#submitting-changes)
- [Code Quality](#code-quality)
- [Commit Convention](#commit-convention)
- [Git Hooks](#git-hooks)
- [Releasing](#releasing)

## Code of Conduct

This project follows our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before participating.

## Reporting Security Issues

Security vulnerabilities never go in a public issue, discussion, or pull request. Report them
privately through GitHub's
[private vulnerability reporting](https://github.com/qruto/nuxt-convex-module/security/advisories/new)
(**Security** tab → **Report a vulnerability**), which opens a draft advisory visible only to you
and the maintainers. [SECURITY.md](SECURITY.md) covers scope, response times, and what happens
after you report.

## Development Setup

**Prerequisites:** Node.js 24.11+ (latest LTS, matching `engines` in `package.json`), pnpm 11+
(`pnpm install` also points Git at the repo's [`.githooks/`](./.githooks) — see
[Git Hooks](#git-hooks); CI enforces the same gates either way)

```bash
# Clone the repository
git clone https://github.com/qruto/nuxt-convex-module.git
cd nuxt-convex-module

# Install dependencies
pnpm install

# Run the test suite
pnpm test

# Build the package
pnpm build
```

The `website/` directory is a full Nuxt app (product homepage · docs, with live demos embedded throughout the docs) wired to the local package **and a real Convex dev deployment**. Start it with:

```bash
pnpm dev
```

That runs `convex dev` in `website/` with the Nuxt dev server supervised via its [`--start`](https://docs.convex.dev/cli#run-the-convex-dev-server) option — one process pushes functions and codegen on change and runs the Nuxt dev server alongside — so function push, codegen, the WebSocket sync protocol, SSR fetching, and the docs' live demos all run against a live deployment. On first run `convex dev` walks you through picking a deployment; a free [anonymous local deployment](https://docs.convex.dev/cli/local-deployments) works fine (no account needed), and it stores the choice in `website/.env.local`.

The Convex functions backing the demos live in [`website/convex/`](./website/convex) — a small team-chat + tasks app exercising queries, mutations, actions, pagination, and file storage. Each demo shows its own source, and the status pill in every demo header reflects the live WebSocket connection state.

The docs site also wants to know its own public origin — Docus feeds it to `site.url`, `llms.domain`, canonical URLs and OG images. Deployments pick it up from the host (`VERCEL_*`/`URL`); locally, add it to the same `website/.env.local` to silence the `nuxt-llms require a domain to be set` warning:

```bash
NUXT_SITE_URL=https://nuxt-convex-module.local  # the host `pnpm dev` serves on
```

To work on the **Nuxt DevTools panel** (`devtools-client-app/`), also start its dev server — in-repo the panel iframe is proxied to it (the published package serves the prebuilt `dist/devtools-client` instead):

```bash
pnpm dev:devtools-client
```

Then open the website, launch Nuxt DevTools in the browser, and pick the Convex tab. The docs' live demos provide queries/mutations to inspect.

## Project Structure

```
src/                  # Module source (Nuxt module + Convex component)
devtools-client-app/  # Nuxt DevTools panel app (served in the DevTools iframe)
test/                 # Vitest unit & integration tests
website/              # Nuxt app: product homepage · docs (Docus) with live Convex demos
```

## Submitting Changes

1. **Open an issue first** for non-trivial changes so we can discuss the approach.
2. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b fix/my-bug-fix
   ```
3. Make your changes, add tests where appropriate.
4. Ensure all checks pass:
   ```bash
   pnpm lint && pnpm test && pnpm test:quality && pnpm build
   ```
5. Open a pull request against `main`.

Pull requests that include tests and follow the commit convention below are reviewed fastest.

## Code Quality

[Fallow](https://docs.fallow.tools) is the drift gate for dead code, duplication and
complexity. Run it over the whole repository at any time:

```bash
pnpm test:quality
```

The repository policy lives in [`.fallowrc.jsonc`](./.fallowrc.jsonc) and the repo is kept
clean under it, so a full run should report nothing. Every exception in that file carries the
reason it exists — prefer fixing a finding in code, and widen the policy only with a written
justification.

**This is enforced, not just documented.** [`.githooks/pre-commit`](./.githooks/pre-commit)
runs `fallow audit` before every commit. The audit is scoped to the files your branch changed
and its default `new-only` gate fails on findings your changes *introduce* — pre-existing
findings in a file you touched do not block you. It takes about a second. The same gate runs on
every pull request in CI, so bypassing it locally with `git commit --no-verify` only defers it.

## Commit Convention

This project uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add support for X
fix: correct Y behavior
docs: update contributing guide
chore: bump dependencies
```

Breaking changes must include `BREAKING CHANGE:` in the commit footer or use `!` after the type:

```
feat!: rename createClient to defineClient
```

Allowed types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`,
`style`, `revert`, and `ai` (AI-instruction / agent metadata updates).

**This is enforced, not just documented.**
[`.githooks/commit-msg`](./.githooks/commit-msg) runs
[commitlint](https://commitlint.js.org/) and rejects non-conforming messages locally. CI
re-checks every commit on a pull request, so the gate holds either way. The local hook can be
bypassed with `git commit --no-verify`; CI cannot — non-conventional commits will not merge.

## Git Hooks

The hooks live in [`.githooks/`](./.githooks) as ordinary shell scripts — committed, reviewable
in a pull request, and carrying their own reasoning in comments. `pnpm install` runs `prepare`,
which points Git at them:

```bash
git config core.hooksPath .githooks
```

That is the whole mechanism: no hook manager, nothing generated into `.git/hooks`, and no
per-clone setup step. Note that Git runs [config-based hooks](https://git-scm.com/docs/githooks)
(`hook.*` in `.git/config`) *in addition* to these rather than instead of them, so never
register the same hook both ways — it runs twice.

They mirror CI, split by how often each check can afford to run:

| Hook | Runs | Mirrors | Cost |
|---|---|---|---|
| [`pre-commit`](./.githooks/pre-commit) | `fallow audit`, `pnpm lint` | `quality`, `lint` | ~6s |
| [`commit-msg`](./.githooks/commit-msg) | `commitlint` | `commit-lint` | instant |
| [`pre-push`](./.githooks/pre-push) | whole-project `fallow`, `fallow security`, `test:types:lib`, `test`, API-reference drift | `quality`, `typecheck`, `test` | ~20s |

`pre-commit` stays cheap enough to run on every commit, so it takes the scoped `fallow audit`
— only findings your change *introduces*, in the files it touched. `pre-push` runs once per
push and can afford the whole picture: the full `fallow` run (which, unlike the scoped audit,
notices a config edit that strands a file elsewhere in the repo), the security-candidate scan,
the type check, the test suite, and the API-reference drift check. A delete-only push skips it.

`fallow security` is a separate command rather than a flag, because fallow keeps security
findings out of both its default run and its audit gate. What it covers, what it deliberately
leaves to GitHub, and the deeper review pass that complements it are in
[SECURITY.md](./SECURITY.md#how-this-repository-is-checked).

Every tool runs through `pnpm exec` / `pnpm run`, because each CLI is a devDependency and is on
`PATH` only inside a pnpm script. Bypass once with `git commit --no-verify` or
`git push --no-verify`; every one of these has a CI counterpart that cannot be bypassed.

Both gates are skipped when `CI` is set. The release job commits through `changelogen`, which
shells out to a plain `git commit`, and a release must not be gated on checks the pull request
already ran — and `CI=1` trips pnpm's `verifyDepsBeforeRun` guard, so they would fail there for
the wrong reason anyway.

**What the hooks cannot cover.** These stay CI's alone, so a green push is not a promise of a
green pipeline: the `e2e` job (builds fixture apps, minutes), `pack` (tarball, `publint`,
`attw`, and a real npm consumer install), `dependency-review` and the workflow lint, which need
GitHub, the Windows leg of the test matrix, and the coverage thresholds.

## Releasing

Releases are automated via CI. See [RELEASING.md](RELEASING.md) for details.
