# Rulesets

The repository's branch and tag rules, kept here so they are reviewable and
reproducible rather than existing only as clicks in a settings page.

GitHub does not read this directory — these files are applied with `gh api`.
They are the source of truth for what the rules *should* be; `weekly.yml`'s
Scorecard job is what notices if the live rules drift from them.

## `main-pr-gate.json`

Everything that makes CI actually gate a merge. Today nothing does: `main-guard`
(applied, active) only refuses deletion and force-pushes, so a direct push to
`main` bypasses every check in this repository.

It is a **separate ruleset from `main-guard` on purpose**. Landing it in
`enforcement: "evaluate"` means it blocks nothing and only records what it
*would* have blocked — and folding these rules into `main-guard` instead would
have put that ruleset's live deletion and force-push protection into evaluate
mode along with them.

| Rule | Why |
| --- | --- |
| `pull_request`, 0 required reviewers | The gate is CI, not review — there is one human here. What matters is that the commit exists as a PR at all, so the checks run and the diff is readable. |
| `required_status_checks: ["All checks passed"]` | The one aggregate context. Adding, renaming or splitting a job never touches this file again. |
| `required_signatures` | Every commit on `main` is already signed; this keeps it that way. Safe under PR-only merging, because the commits GitHub creates when it squashes are signed by GitHub. |
| `bypass_actors: OrganizationAdmin`, `pull_request` mode | Break-glass. `current_user_can_bypass` is `"never"` without it, so a flaky Windows leg would lock the maintainer out of their own repository. `pull_request` mode, not `always`: it permits merging a PR past a stuck check, never a direct push to `main`. |

No bot needs a bypass. `Release prepare` pushes to `release/vX.Y.Z`, and
`Release` pushes only a tag — neither writes to `main`. That is why the release
split had to land before this.

### Apply it

```sh
# Land in evaluate mode (blocks nothing, records everything):
gh api -X POST repos/qruto/nuxt-convex-module/rulesets \
  --input .github/rulesets/main-pr-gate.json

# After a week, read what it would have blocked:
gh api repos/qruto/nuxt-convex-module/rulesets/rule-suites --jq '.[]'

# Then enforce, using the id the POST returned:
gh api -X PUT repos/qruto/nuxt-convex-module/rulesets/<id> -f enforcement=active
```

### Not here yet

A `code_scanning` rule goes in last, once `extended` has run and its alerts are
triaged. GitHub documents "analysis in progress" and "tool not configured" as
**blocking** states, so it can wedge a pull request that never touched code —
prove it on a docs-only PR before adding it.
