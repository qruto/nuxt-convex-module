# Releasing

Releases run **entirely in CI** — there is no local release tooling and no long-lived secrets.
Two dispatches: one prepares a release pull request, one tags what you merged.

## How it works

```
Actions tab → "Release prepare" → Run workflow   (.github/workflows/release-prepare.yml)
└─ prepare  changelogen → bump version, write CHANGELOG.md
            push release/vX.Y.Z → open the pull request
                                             ↓
                       review, let ci pass, merge   ← you

Actions tab → "Release" → Run workflow   (.github/workflows/release.yml)
│           ↓ approve the `release` environment                       ← you
├─ tag      wait for this commit's ci run to be green
│           verify HEAD is the merged release commit → tag → push
│           changelogen gh release (immutable GitHub Release)
├─ build    check out the tag → pnpm pack → publint + attw
│           ↓ approve the `release` environment again                 ← you
└─ publish  pnpm stage publish → Trusted Publishing (OIDC) + provenance
                                             ↓
                        pnpm stage approve   ← you, with 2FA
```

- **The release commit is a pull request like any other.** Pick the bump (`auto` / `patch` /
  `minor` / `major`) in **Release prepare** and run it; `auto` derives the version from your
  Conventional Commits since the last tag. It opens a PR whose body is the changelog section it
  just wrote, so you read what the GitHub Release will say before it exists. It gets the same
  `All checks passed` gate as every other change — which the one commit deciding what the world
  installs previously skipped, because the release run pushed it straight to `main`.
- **Then tag what you merged.** **Release** never bumps. It reads the version out of the merged
  `package.json` and refuses to run if `HEAD` did not change it — otherwise an ordinary PR
  merging in between would take the tag, and every later check would still pass.
- **Three approvals.** The `release` environment before `tag` writes anything, again before
  `publish` reaches npm, and the staged package itself on npm — the only one of the three where
  you can see what was actually built.
- **Rehearsable.** Check **dry-run** on **Release** to run everything except the writes: `build`
  packs and validates `main` as it is, and `publish` performs the real OIDC exchange with npm and
  stops. The release-commit assertion downgrades to a warning there, so a rehearsal works on an
  ordinary `main`. Do it after every change to `release.yml`.
- **No secrets.** npm uses OIDC (no `NPM_TOKEN`); the branch, the tag and the GitHub Release use
  the ephemeral Actions `GITHUB_TOKEN`, scoped to the one job that needs it.
- **Native steps only.** changelogen bumps, writes the changelog and creates the GitHub Release.
  pnpm packs and stages. GitHub environments and rulesets do the gating. Nothing is reimplemented
  in shell.

### Why three jobs

The credentials never meet the code:

| Job | Holds | Runs |
| --- | --- | --- |
| `tag` | `contents: write` — no OIDC | one `git tag`, then changelogen's GitHub Release step |
| `build` | nothing | the build, from a pristine checkout of the tag |
| `publish` | `id-token: write` — no checkout, no install | one pinned pnpm on one tarball, behind an egress allowlist |

`tag` is the only job that can write to the repository — one tag, on a commit already merged and
already green — and it cannot start until you have approved the run. It holds no npm credential. `build` executes dependency code with nothing worth
stealing in reach. `publish` holds the only credential that can reach npm and executes nothing but
pnpm on a tarball, with every network destination other than npm, GitHub and Sigstore blocked.

### One environment, two gates

`release` — required reviewer, `main` only — guards both jobs that can do damage. GitHub evaluates
environment protection per job, so it prompts twice in a run: once before `tag` writes anything to
the repository, and again after the build, before `publish` reaches npm. The second prompt is the
last cheap place to stop a release whose build looks wrong.

It is also what the npm Trusted Publisher is bound to. An OIDC token is accepted only from a job
that ran in `release`, and a job can run in `release` only from `main` — so a `release.yml` edited
on a scratch branch can neither write to the repository nor reach npm's queue.

### Stage before live

npm takes the release into a **stage queue**; it becomes installable only after you approve it
with 2FA, and npm's own malware scan has to finish before the approve button is enabled. This is
the one control that can stop a *poisoned build*: provenance proves where a package came from,
not what is in it. Rejecting a stage burns that version number — the tag is already immutable —
so fix forward with the next patch.

## Repository controls (already configured)

Nothing to do here — recorded so the guarantees are auditable:

- **`release` environment** — required reviewer; accepts runs from `main` only; the Trusted
  Publisher's binding.
- **`main-guard` ruleset** — blocks deletion and force-push on `main`. History can be added to but
  never rewritten or erased.
- **`tag-guard` ruleset** — `v*` tags can never be deleted, re-pointed, or force-updated, so
  published release history is permanently pinned to its commit.
- **Why those rulesets stop there.** `GITHUB_TOKEN` cannot bypass a ruleset — GitHub's bypass list
  accepts repository roles, teams, GitHub Apps, org admins and Dependabot, and Actions is on none
  of them. So any rule strict enough to stop an attacker also stops the release job: restricting
  tag `creation` blocks CI from tagging, requiring pull requests or status checks on `main` blocks
  the release commit, and requiring signatures blocks the unsigned `github-actions[bot]` commit.
  The alternative — a GitHub App private key or a PAT held as a secret — would reintroduce the
  long-lived credential this design exists to remove. The two approvals above are what stand in
  for those rules.
- **Immutable releases** — on. The Release changelogen creates locks its tag and carries a
  release attestation: `gh release verify vX.Y.Z`.
- **SHA-pinned actions, enforced** — `sha_pinning_required`: a workflow referencing a floating tag
  is refused by GitHub itself, not only by zizmor.
- **Dependabot alerts + automated security fixes; secret scanning with push protection.**

## One-time setup (before the first OIDC release)

npm Trusted Publishing can only be configured **after** a package exists on the registry, so the
first version was published manually (`v0.0.0`).

1. **Configure the trusted publisher** at
   <https://www.npmjs.com/package/nuxt-convex-module/access> → **Trusted Publisher** →
   *GitHub Actions*:

   | Field               | Value                 |
   | ------------------- | --------------------- |
   | Organization / user | `qruto`               |
   | Repository          | `nuxt-convex-module`  |
   | Workflow filename   | `release.yml`         |
   | Environment         | `release`             |

   Leave it **stage-only** (the default). Enable **Require two-factor authentication and disallow
   tokens** — trusted publishers keep working (they authenticate with OIDC), and any leaked or
   stolen npm token becomes useless against this package. Use a passkey or hardware key as the
   second factor. Revoke any classic token you still hold locally once it is on.

2. **Install the [pkg.pr.new GitHub App](https://github.com/apps/pkg-pr-new)** on the
   repository so the `preview` workflow can publish continuous preview builds
   (`npm i https://pkg.pr.new/qruto/nuxt-convex-module@<sha>`). The same step
   ships `examples/playground` as a StackBlitz template via `--template`, which
   is what the **Open in StackBlitz** link in each PR comment opens. Drop that
   flag and pkg.pr.new silently substitutes a synthesised template that cannot
   run — see the comment in `preview.yml`.

## After the first publish

- **Submit to the [nuxt/modules](https://github.com/nuxt/modules) registry** (requires the
  package on npm): in a clone of that repo run
  `pnpm sync nuxt-convex-module qruto/nuxt-convex-module`, add an SVG icon under `icons/`, set
  `category` (Database) and `type: 3rd-party` in the generated
  `modules/nuxt-convex-module.yml`, point `website` at the docs site, and open a PR. npm
  stats, description, and maintainers auto-sync afterwards.
- **Add GitHub repo topics** for discoverability: `nuxt`, `nuxt-module`, `convex`, `vue`,
  `realtime`.
- The README's StackBlitz links (`examples/minimal`, `examples/playground`) start working as
  soon as the package is installable from npm — they import from GitHub, so they resolve
  `nuxt-convex-module` from the registry. The per-PR StackBlitz link is different and already
  works: pkg.pr.new rewrites that dependency to the commit's preview tarball, so it needs no
  npm release at all.

## Cutting a release

1. Merge your work to `main` (Conventional Commit messages drive the version + changelog) and
   wait for `ci` to be green there — the release refuses a commit whose ci run is not a completed
   success.
2. **Actions** tab → **Release** → **Run workflow** → choose the bump → **Run**.
3. Approve the `release` environment when it asks — twice: once before `tag` writes the release
   commit, and again before `publish` stages it.
4. When the run is green, the version is staged on npm and the commit, tag, `CHANGELOG.md` and
   GitHub Release are on `main`. Approve the package:

   ```sh
   pnpm stage list nuxt-convex-module   # find the stage id
   pnpm stage view <stage-id>           # inspect what CI actually built
   pnpm stage approve <stage-id>        # 2FA — this is the moment it goes live
   ```

   `pnpm stage download <stage-id>` gets you the tarball itself if you want to diff it against the
   previous release. `pnpm stage reject <stage-id>` discards it — see *Stage before live* for what
   that costs.

5. Confirm the release carries provenance:

   ```sh
   npm view nuxt-convex-module@<version> dist   # lists an `attestations` key, not just `signatures`
   gh release verify v<version>                 # the GitHub Release attestation
   ```

## Recovery

- **Publish failed after the tag was pushed** (the GitHub Release exists, npm has nothing):
  re-run the failed jobs on that run (`gh run rerun <run-id> --failed`; the tarball artifact lives
  one day), or **Run workflow** again with `re-stage: vX.Y.Z` — it skips the bump and stages that
  tag. Check `pnpm stage list nuxt-convex-module` first in case the first attempt did stage.
- **ci red** — the run refuses before writing anything. Nothing to undo.
- **Staged, then rejected** — the version is burned; fix forward.
- **"tag already exists" on push** — that version was already released; you dispatched twice.

## Conventional Commits

With `release-type: auto`, the bump is derived from
[Conventional Commits](https://www.conventionalcommits.org/) since the previous tag:

| Commit type                          | Release |
| ------------------------------------ | ------- |
| `fix:`                               | patch   |
| `feat:`                              | minor   |
| `feat!:` / `BREAKING CHANGE:` footer | major   |

Other types (`chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`) appear grouped in
the changelog/release notes but do not force a bump. Below `1.0.0`, changelogen demotes one step:
a `feat` yields a patch and a breaking change yields a minor. To override the computed bump, pick
an explicit `patch` / `minor` / `major` when running the workflow.

## Dependencies

Dependency updates are automated by [Dependabot](./.github/dependabot.yml) — npm version
updates, GitHub Actions digest bumps (preserving the `@<sha> # vX.Y.Z` pinning convention), and
CVE security updates. No third-party app holds write access to the repo.

- **Monday schedule, grouped.** Non-major npm updates arrive as one grouped PR; Actions bumps
  as another. For major bumps Dependabot groups out, `pnpm bump` runs `taze major -w`.
- **Cooldown mirrors pnpm.** Dependabot's `cooldown` (2 days) is kept one day wider than pnpm's
  `minimumReleaseAge` (24 h, `pnpm-workspace.yaml`), so Dependabot never proposes a version pnpm
  refuses to resolve. Security updates skip the cooldown by design.
- **Keep the exclude lists in sync.** `cooldown.exclude` in `.github/dependabot.yml` must match
  `minimumReleaseAgeExclude` in `pnpm-workspace.yaml` (first-party Nuxt/Convex packages are
  waived), or Dependabot proposes versions pnpm won't install.
- **Inspected at PR time.** ci's `dependency-review` job fails any PR whose dependency delta
  introduces a known CVE (moderate or higher) or a package GitHub has flagged as malicious.
  pnpm's cooldown only *delays* a new version — it never looks at what's inside it.
- **Rescanned on a schedule.** `dependency-review` only sees what a PR changes, so
  [osv.yml](./.github/workflows/osv.yml) scans the whole committed lockfile weekly — that is what
  catches a CVE disclosed against a dependency that stopped changing.

## Security workflows

Beyond ci's own gates:

| Workflow | What it watches |
| --- | --- |
| [osv.yml](./.github/workflows/osv.yml) | the committed lockfile, against the OSV database, weekly |
| [codeql.yml](./.github/workflows/codeql.yml) | taint-tracking classes eslint and fallow don't model |
| [scorecard.yml](./.github/workflows/scorecard.yml) | drift in the repo's own posture — pinned actions, permissions, rulesets |

`ci`'s `quality` job runs [zizmor](https://docs.zizmor.sh) over the workflows themselves; accepted
findings and their reasons live in [.github/zizmor.yml](./.github/zizmor.yml).
