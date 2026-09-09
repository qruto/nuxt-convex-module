# Rulesets

What protects `main` and the release tags, as files rather than as clicks in a
settings page.

GitHub does not read this directory. `weekly.yml`'s `rulesets` job does —
`scripts/check-rulesets.mjs` compares every file here against the live rules and
fails on any difference, including a ruleset that exists only in GitHub. Without
it, "source of truth" would be a claim rather than a fact: it drifted the day it
was created, when GitHub filled in a parameter the file never mentioned.

```sh
pnpm run check:rulesets     # needs `gh auth` or GH_TOKEN
```

| File | State | What it does |
| --- | --- | --- |
| `main-guard.json` | active | Refuses deletion and force-pushes on `main` |
| `main-pr-gate.json` | **evaluate** | Makes CI actually gate a merge — see below |
| `tag-guard.json` | active | Freezes `v*` tags: no update, delete or force-push |

## `main-pr-gate`

`main-guard` alone means a plain `git push` to `main` sails past every check in
the repository. This is what closes that.

| Rule | Why |
| --- | --- |
| `pull_request`, **0 reviewers** | The gate is CI, not review — there is one human here. What matters is that the commit exists as a PR at all, so the checks run and the diff is readable. Zero reviewers keeps that free. |
| `required_status_checks: ["All checks passed"]` | The one aggregate context. Adding, renaming or splitting a job never touches this file again. |
| `required_signatures` | Every commit on `main` is already signed. Safe under PR-only merging, because the commits GitHub creates when it squashes are signed by GitHub. |
| `require_extra_approval_for_unattributed_changes` | GitHub's default, kept and recorded rather than left implicit: a commit whose author is not a GitHub account is worth a second look. The bypass below covers the solo-maintainer lockout it would otherwise create. |
| `bypass_actors: OrganizationAdmin`, `pull_request` mode | Break-glass. `current_user_can_bypass` is `"never"` without it, so one flaky Windows leg locks the maintainer out of their own repository. `pull_request` mode, not `always`: it permits merging a PR past a stuck check, never a direct push. |

**Why it is separate from `main-guard`.** `evaluate` is a property of a whole
ruleset. Folding these rules in would have put `main-guard`'s live deletion and
force-push protection into evaluate mode with them — trading real protection for
a dry run.

**Why no bot needs a bypass.** `Release prepare` pushes to `release/vX.Y.Z` and
`Release` pushes only a tag; neither writes to `main`. That is why the release
split had to land first.

## Applying and promoting

```sh
# Create it (evaluate mode: blocks nothing, records what it would have blocked)
gh api -X POST repos/qruto/nuxt-convex-module/rulesets \
  --input .github/rulesets/main-pr-gate.json

# After a week, read what it would have blocked
gh api repos/qruto/nuxt-convex-module/rulesets/rule-suites --jq '.[]'

# Then enforce
gh api -X PUT repos/qruto/nuxt-convex-module/rulesets/<id> -f enforcement=active
```

`check:rulesets` reports an enforcement difference without failing on it, so the
file can stay at `evaluate` while the live rule is promoted, and the promotion is
one edit here afterwards.

## Still to come

- **Fold `main-guard` into `main-pr-gate`** once the latter is active. Two
  rulesets on one branch is only worth it while one of them is a dry run.
- **A `code_scanning` rule**, last of all. GitHub documents "analysis in
  progress" and "tool not configured" as *blocking*, so it can wedge a pull
  request that never touched code — prove it on a docs-only PR first.
