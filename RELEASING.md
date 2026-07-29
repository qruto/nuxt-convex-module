# Releasing

Releases run **entirely in CI** — there is no local release tooling and no long-lived secrets.
You trigger a release from the GitHub **Actions** tab; the workflow does everything else.

## How it works

```
Actions tab → "Release" → Run workflow   (.github/workflows/release.yml)
└─ assert this commit's ci run is green
   ├─ gate: lint + test + typecheck
   ├─ changelogen   → bump version, write CHANGELOG.md (with contributors), commit + tag
   ├─ pnpm publish  → Trusted Publishing (OIDC) + automatic provenance
   ├─ push commit + tag back to main
   └─ changelogithub → GitHub Release (conventional grouping + contributor thanks)
```

- **One button.** Pick the bump (`auto` / `patch` / `minor` / `major`) and run.
  `auto` derives the version from your Conventional Commits since the last tag.
- **Rehearsable.** Check **dry-run** to run everything except the publish and the push —
  the run summary shows the version and changelog that a real release would produce.
- **No secrets.** npm uses OIDC (no `NPM_TOKEN`); the GitHub Release and the push back to
  `main` use the ephemeral Actions `GITHUB_TOKEN`.
- **Environment-gated.** The job runs in the `release` GitHub Environment; the npm Trusted
  Publisher is bound to it, and any required-reviewer rule on the environment becomes a
  one-click approval step before anything can publish.
- **Publish before push.** npm is published first; the release commit and tag are pushed only
  after npm accepts it, so a failed build (run via `prepack` during `pnpm publish`) leaves the
  remote untouched. pnpm (not npm) publishes so `catalog:` ranges are rewritten in the
  published manifest.

## One-time setup (before the first OIDC release)

npm Trusted Publishing can only be configured **after** a package exists on the registry, so the
first version is published manually:

1. **Publish the first release manually** (one time only), then tag the version you actually
   published (the current `version` in `package.json`, e.g. `v0.0.0`) so `changelogen` has a
   baseline:

   ```sh
   npm login
   pnpm publish        # runs prepack (the build); publishConfig.access=public
   git tag v0.0.0 && git push origin v0.0.0
   ```

2. **Configure the trusted publisher** at
   <https://www.npmjs.com/package/nuxt-convex-module/access> → **Trusted Publisher** →
   *GitHub Actions*:

   | Field               | Value                 |
   | ------------------- | --------------------- |
   | Organization / user | `qruto`               |
   | Repository          | `nuxt-convex-module`  |
   | Workflow filename   | `release.yml`         |
   | Environment         | `release`             |

   Optionally enable **"Require two-factor authentication and disallow tokens"** so the package
   can _only_ be published through this workflow.

3. **Create the `release` GitHub Environment** (Settings → Environments → *New environment* →
   `release`). Optionally add yourself as a required reviewer — every release run then pauses
   for a one-click approval before it can publish.

4. **Install the [pkg.pr.new GitHub App](https://github.com/apps/pkg-pr-new)** on the
   repository so the `preview` workflow can publish continuous preview builds
   (`npm i https://pkg.pr.new/qruto/nuxt-convex-module@<sha>`).

5. **Allow the workflow to push to `main`.** The release commit + tag are pushed by
   `github-actions[bot]`. If `main` has branch protection, add a bypass for GitHub Actions
   (Settings → Branches → branch protection → *Allow specified actors to bypass*), otherwise the
   push step fails. With no protection, nothing extra is needed.

## After the first publish

- **Submit to the [nuxt/modules](https://github.com/nuxt/modules) registry** (requires the
  package on npm): in a clone of that repo run
  `pnpm sync nuxt-convex-module qruto/nuxt-convex-module`, add an SVG icon under `icons/`, set
  `category` (Database) and `type: 3rd-party` in the generated
  `modules/nuxt-convex-module.yml`, point `website` at the docs site, and open a PR. npm
  stats, description, and maintainers auto-sync afterwards.
- **Add GitHub repo topics** for discoverability: `nuxt`, `nuxt-module`, `convex`, `vue`,
  `realtime`.
- The README's StackBlitz link (`examples/minimal`) starts working as soon as the package is
  installable from npm.

## Cutting a release

1. Merge your work to `main` (Conventional Commit messages drive the version + changelog).
2. **Actions** tab → **Release** → **Run workflow** → choose the bump → **Run**.
3. Watch the run. When it's green, the new version is on npm with provenance, `CHANGELOG.md` and
   the tag are on `main`, and the GitHub Release is published.

That's it — no `pnpm release`, no local credentials.

## Conventional Commits

With `release-type: auto`, the bump is derived from
[Conventional Commits](https://www.conventionalcommits.org/) since the previous tag:

| Commit type                          | Release |
| ------------------------------------ | ------- |
| `fix:`                               | patch   |
| `feat:`                              | minor   |
| `feat!:` / `BREAKING CHANGE:` footer | major   |

Other types (`chore:`, `docs:`, `refactor:`, `test:`, `ci:`, `build:`, `perf:`) appear grouped in
the changelog/release notes but do not force a bump. To override the computed bump, pick an
explicit `patch` / `minor` / `major` when running the workflow.

## Dependencies

Dependency updates are automated by [Renovate](./renovate.json) using the official
[`nuxt/renovate-config-nuxt`](https://github.com/nuxt/renovate-config-nuxt) preset (Monday
schedule, grouped non-major updates, release-age cooldown); non-major devDependency updates
automerge once CI passes.
