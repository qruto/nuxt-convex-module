# Changelog

## v0.0.1

[compare changes](https://github.com/qruto/nuxt-convex-module/compare/v0.0.0...v0.0.1)

### 🚀 Enhancements

- **security:** Auto-detect nuxt-security and apply the CSP at runtime ([d08dba2](https://github.com/qruto/nuxt-convex-module/commit/d08dba2))
- **better-auth:** Guard post-sign-in redirects against open redirect ([97dbbab](https://github.com/qruto/nuxt-convex-module/commit/97dbbab))
- **better-auth:** Reject a non-HTTP Convex site URL at startup ([55b0312](https://github.com/qruto/nuxt-convex-module/commit/55b0312))
- **examples:** Give every pull request a runnable playground ([2cfde59](https://github.com/qruto/nuxt-convex-module/commit/2cfde59))

### 🩹 Fixes

- Force patched undici, tar and esbuild past vulnerable transitive pins ([115e51d](https://github.com/qruto/nuxt-convex-module/commit/115e51d))
- Bump transitive fast-uri to 3.1.5 ([18ef82a](https://github.com/qruto/nuxt-convex-module/commit/18ef82a))
- **better-auth:** Stop nuxt-security rejecting valid credentials ([5f69fb5](https://github.com/qruto/nuxt-convex-module/commit/5f69fb5))
- **polar:** Open the checkout tab with noopener ([1999df1](https://github.com/qruto/nuxt-convex-module/commit/1999df1))
- **fallow:** Re-enable the unresolved-import suppression ([c6929eb](https://github.com/qruto/nuxt-convex-module/commit/c6929eb))
- **website:** Make the website typecheck pass ([c03ff92](https://github.com/qruto/nuxt-convex-module/commit/c03ff92))
- **examples:** Make the minimal example pick up its own deployment ([e697964](https://github.com/qruto/nuxt-convex-module/commit/e697964))
- Strip trailing slashes without quadratic backtracking ([ea8be67](https://github.com/qruto/nuxt-convex-module/commit/ea8be67))

### 💅 Refactors

- **scripts:** Drop the redundant empty-paragraph guard ([6275eb2](https://github.com/qruto/nuxt-convex-module/commit/6275eb2))
- **website:** Share the playground message list and the graphite ramp ([20d8abe](https://github.com/qruto/nuxt-convex-module/commit/20d8abe))
- **website:** Flatten the moderation filter and the typewriter pacing ([2203283](https://github.com/qruto/nuxt-convex-module/commit/2203283))
- **devtools:** Extract the query subscription card ([611a3a7](https://github.com/qruto/nuxt-convex-module/commit/611a3a7))
- Improve website components decomposition ([617ef50](https://github.com/qruto/nuxt-convex-module/commit/617ef50))
- Anchor every divergence to its ledger entry ([b70c858](https://github.com/qruto/nuxt-convex-module/commit/b70c858))
- **ci:** Make package.json the single definition of every gate ([4d9f70d](https://github.com/qruto/nuxt-convex-module/commit/4d9f70d))

### 📖 Documentation

- Wip on homepage ([6d99b87](https://github.com/qruto/nuxt-convex-module/commit/6d99b87))
- Favicon ([ccc06f8](https://github.com/qruto/nuxt-convex-module/commit/ccc06f8))
- **website:** Styling, move back to TailwindCSS ([c6e10c9](https://github.com/qruto/nuxt-convex-module/commit/c6e10c9))
- **website:** Working on a design system and homepage ([93ecad3](https://github.com/qruto/nuxt-convex-module/commit/93ecad3))
- **website:** Reposition the site as the Nuxt module for Convex ([1417c06](https://github.com/qruto/nuxt-convex-module/commit/1417c06))
- **website:** Spectrum-band the spec sheet, retune the recordings ([89c196a](https://github.com/qruto/nuxt-convex-module/commit/89c196a))
- **website:** Re-export the logo mark and its favicons ([16c169e](https://github.com/qruto/nuxt-convex-module/commit/16c169e))
- **website:** Logo update, Baloo 2 return ([44a92c9](https://github.com/qruto/nuxt-convex-module/commit/44a92c9))
- **website:** Font change, favicon update ([5fadc1d](https://github.com/qruto/nuxt-convex-module/commit/5fadc1d))
- **website:** Restructure the docs into four sections in one sidebar tree ([5e7ecff](https://github.com/qruto/nuxt-convex-module/commit/5e7ecff))
- **website:** Answer "how does this differ from the React API" up front ([6224567](https://github.com/qruto/nuxt-convex-module/commit/6224567))
- Describe the site as docs with live demos, not a playground ([ad21335](https://github.com/qruto/nuxt-convex-module/commit/ad21335))
- **security:** Gather every security aspect into one guide ([ee63517](https://github.com/qruto/nuxt-convex-module/commit/ee63517))
- Refresh stale line numbers in the generated API reference ([00b2871](https://github.com/qruto/nuxt-convex-module/commit/00b2871))
- Regenerate the API reference after the dependency bumps ([713efa8](https://github.com/qruto/nuxt-convex-module/commit/713efa8))
- Update ([25c4b86](https://github.com/qruto/nuxt-convex-module/commit/25c4b86))
- Update ([7d8b055](https://github.com/qruto/nuxt-convex-module/commit/7d8b055))
- Readme badges update ([d799bbc](https://github.com/qruto/nuxt-convex-module/commit/d799bbc))
- Regenerate the API reference line numbers ([9134d99](https://github.com/qruto/nuxt-convex-module/commit/9134d99))
- Drop Resend from the ported-surface story ([2c9cc06](https://github.com/qruto/nuxt-convex-module/commit/2c9cc06))
- Rebuild PARITY.md as the port's ledger ([c4238d6](https://github.com/qruto/nuxt-convex-module/commit/c4238d6))
- Regenerate the API reference line numbers ([e315532](https://github.com/qruto/nuxt-convex-module/commit/e315532))
- Regenerate the API reference after the cross-domain doc edit ([16270b1](https://github.com/qruto/nuxt-convex-module/commit/16270b1))
- **github:** Cut the issue and pull request templates down to what is read ([f796802](https://github.com/qruto/nuxt-convex-module/commit/f796802))
- Regenerate the API reference after the ReDoS fix ([168cbed](https://github.com/qruto/nuxt-convex-module/commit/168cbed))

### 📦 Build

- **website:** Pin font providers, add house arrows, open the content watcher ([fc4d428](https://github.com/qruto/nuxt-convex-module/commit/fc4d428))
- Keep the module-builder entry extensions ([b245abb](https://github.com/qruto/nuxt-convex-module/commit/b245abb))

### 🏡 Chore

- **deps-dev:** Bump npm-run-all2 from 8.0.4 to 9.0.3 ([#2](https://github.com/qruto/nuxt-convex-module/pull/2))
- **deps-dev:** Bump fallow from 2.104.0 to 3.11.0 ([#3](https://github.com/qruto/nuxt-convex-module/pull/3))
- **parity:** Track convex 1.45.0 ([9b3d58d](https://github.com/qruto/nuxt-convex-module/commit/9b3d58d))
- Drop the Polar sandbox MCP server ([a3386b6](https://github.com/qruto/nuxt-convex-module/commit/a3386b6))
- **website:** Regenerate the convex server bindings ([11264d3](https://github.com/qruto/nuxt-convex-module/commit/11264d3))
- **website:** Drop the unused get-port-please devDependency ([a8da232](https://github.com/qruto/nuxt-convex-module/commit/a8da232))
- Rebuild the fallow policy from scratch ([c3f292a](https://github.com/qruto/nuxt-convex-module/commit/c3f292a))
- **deps-dev:** Bump the all-non-major group across 1 directory with 5 updates ([#19](https://github.com/qruto/nuxt-convex-module/pull/19))
- **deps-dev:** Bump the all-non-major group with 3 updates ([#22](https://github.com/qruto/nuxt-convex-module/pull/22))
- **deps-dev:** Move to vitest 5 ([#25](https://github.com/qruto/nuxt-convex-module/pull/25))

### ✅ Tests

- Remove fallow config to rethink and build from scratch ([6856028](https://github.com/qruto/nuxt-convex-module/commit/6856028))
- Keep the websocket frame encoder private to its helper ([ae5cc5c](https://github.com/qruto/nuxt-convex-module/commit/ae5cc5c))
- Realign two suites with the changes that moved past them ([cd81a7d](https://github.com/qruto/nuxt-convex-module/commit/cd81a7d))
- Make the parity manifest describe the tree by construction ([a164dd4](https://github.com/qruto/nuxt-convex-module/commit/a164dd4))

### 🎨 Styles

- **website:** Split app.css into a css/ module ([e7bcf48](https://github.com/qruto/nuxt-convex-module/commit/e7bcf48))
- **website:** Put the code palette on the live signal ramp ([d70eda5](https://github.com/qruto/nuxt-convex-module/commit/d70eda5))
- **website:** Rebuild the hero headline's depth as an edge bevel ([4fbace6](https://github.com/qruto/nuxt-convex-module/commit/4fbace6))
- **website:** Make convex/concave the site-wide depth vocabulary ([654b6fd](https://github.com/qruto/nuxt-convex-module/commit/654b6fd))

### 🤖 CI

- Prepare the module before packing in the preview workflow ([dbafd03](https://github.com/qruto/nuxt-convex-module/commit/dbafd03))
- **deps:** Bump zizmorcore/zizmor-action from 0.6.1 to 0.6.2 in the actions group ([#4](https://github.com/qruto/nuxt-convex-module/pull/4))
- **deps:** Bump the actions group across 1 directory with 3 updates ([#13](https://github.com/qruto/nuxt-convex-module/pull/13))
- Improve ([5f789bf](https://github.com/qruto/nuxt-convex-module/commit/5f789bf))
- Pin the consumer npm for the package smoke test ([570ba75](https://github.com/qruto/nuxt-convex-module/commit/570ba75))
- Fallow ([1c169d2](https://github.com/qruto/nuxt-convex-module/commit/1c169d2))
- Gate pull requests with fallow audit ([24c722f](https://github.com/qruto/nuxt-convex-module/commit/24c722f))
- Gate commits with fallow audit ([45afe20](https://github.com/qruto/nuxt-convex-module/commit/45afe20))
- Move the git hooks into .githooks/ ([6c3b17a](https://github.com/qruto/nuxt-convex-module/commit/6c3b17a))
- Drop the hook-config migration from prepare ([1c74a3b](https://github.com/qruto/nuxt-convex-module/commit/1c74a3b))
- Mirror the CI checks in the git hooks ([1471d52](https://github.com/qruto/nuxt-convex-module/commit/1471d52))
- Improve checks and docs ([8271f19](https://github.com/qruto/nuxt-convex-module/commit/8271f19))
- Release cycle update ([d7e03bd](https://github.com/qruto/nuxt-convex-module/commit/d7e03bd))
- Fix the two failing checks ([62c31b1](https://github.com/qruto/nuxt-convex-module/commit/62c31b1))
- Configure CodeRabbit for what the other gates cannot read ([22cbe08](https://github.com/qruto/nuxt-convex-module/commit/22cbe08))
- One required check behind a shared setup action ([9c280a4](https://github.com/qruto/nuxt-convex-module/commit/9c280a4))
- Fix the two faults the first run of the new chain surfaced ([3637dcf](https://github.com/qruto/nuxt-convex-module/commit/3637dcf))
- Keep fallow aware of the tools check:tarball shells out to ([072ed2b](https://github.com/qruto/nuxt-convex-module/commit/072ed2b))
- Improve ci pipeline ([#20](https://github.com/qruto/nuxt-convex-module/pull/20))
- **deps:** Bump the actions group across 1 directory with 2 updates ([#21](https://github.com/qruto/nuxt-convex-module/pull/21))
- Write the fallow action pin the way Dependabot maintains it ([#24](https://github.com/qruto/nuxt-convex-module/pull/24))
- Title-case the workflow names ([#26](https://github.com/qruto/nuxt-convex-module/pull/26))

### ❤️ Contributors

- Slava Razum ([@slavarazum](https://github.com/slavarazum))

