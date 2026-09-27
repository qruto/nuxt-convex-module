# Security Policy

> Looking for how to **secure an app built with this module** — the CSP, the auth proxy, SSR
> tokens, safe redirects, and a production checklist? That's the
> [security guide](./website/content/1.getting-started/5.security.md). This file covers reporting
> vulnerabilities *in* the module.

## Supported Versions

Only the latest release of `nuxt-convex-module` receives security fixes.

| Version | Supported |
| ------- | --------- |
| latest  | ✓         |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Use GitHub's private vulnerability reporting instead:

**[→ Report a vulnerability](https://github.com/qruto/nuxt-convex-module/security/advisories/new)**

(Also reachable from the repository's **Security** tab → **Report a vulnerability**.)

This opens a private draft advisory visible only to you and the maintainers. It keeps the whole
process — report, discussion, fix, credit, and publication — in one place, and no report can be
lost in a mailbox.

If you cannot use GitHub for any reason, email **razum@qruto.to** with the subject line
`[nuxt-convex-module] Security Vulnerability`.

### What to include

- A description of the vulnerability and its potential impact
- The affected version, and which part of the module is involved (module setup, a runtime
  composable, a server route, the auth proxy, the generated CSP, …)
- Steps to reproduce — proof-of-concept code or a minimal reproduction repository if possible
- Any suggested mitigations

### What happens next

1. **Acknowledgement within 48 hours** in the advisory thread (or by email if you reported that way).
2. We confirm the report, assess severity, and agree a fix timeline with you — targeting **7 days**
   for critical issues.
3. The fix is developed in the advisory's private fork, released, and the advisory is published
   through the [GitHub Advisory Database](https://github.com/advisories), which propagates it to
   `npm audit`, Dependabot, and other consumers of the module.
4. A CVE is requested through GitHub where the issue warrants one, and you are credited in the
   published advisory unless you ask to stay anonymous.

We follow [coordinated disclosure](https://en.wikipedia.org/wiki/Coordinated_vulnerability_disclosure):
we ask that you give us reasonable time to patch and publish before disclosing publicly.

## Scope

In scope is code shipped by this package — module setup, runtime composables and components,
Nitro server handlers, the Better Auth proxy routes, and the Convex-aware CSP this module
generates.

Vulnerabilities in the upstream projects the module integrates with — [Convex](https://github.com/get-convex),
[Better Auth](https://github.com/better-auth/better-auth), or Polar — belong in *their*
security process, not here. Report them to that project directly. If you are unsure which side a
finding lands on, report it here and we will route it.

## How this repository is checked

Reporting is the last line, not the first. These are the gates a change passes before it can
reach a release.

### Static analysis in CI

[`fallow security`](https://docs.fallow.tools) runs as its own step in the `static` job and in
the `pre-push` hook. It *has* to be its own step: fallow keeps security findings out of both its
default run and its `audit` gate — "this command is the only surface for security findings" —
so neither of the checks already in that job would ever report one. Wiring the rules into
`.fallowrc.jsonc` without a dedicated step would look configured and scan nothing.

It covers 44 candidate categories: injection sinks (SQL, NoSQL, command, code, template), SSRF,
path traversal, prototype pollution, unsafe deserialization, XXE, SSTI, open redirect,
permissive CORS, weak crypto, disabled TLS validation, `postMessage` wildcard origins, and the
rest. The scan is whole-repo rather than changed-files-only — it costs about 0.14s, the repo
sits at zero candidates, and a candidate in a file your branch never touched should still block.

Candidates are **unverified by design**. Fallow matches syntactic sink shapes against a CWE
catalogue; it does not prove anything reaches them. A red build means *go and look*, not *a
vulnerability shipped*. A candidate confirmed harmless gets `// fallow-ignore-file security-sink`
with the reason it is harmless.

Two categories stay off on purpose. `hardcoded-secret` and `secret-to-network` fire only when
named in `security.categories.include` — but that setting is a **whitelist**, so naming them
restricts the run to them and drops the other 44. Measured against a fixture holding an `exec()`
sink, an `innerHTML` sink and a Stripe-shaped key: with no config fallow found both sinks and
missed the key; with `include: ["hardcoded-secret"]` it found the key and neither sink. Keeping
both halves would mean hand-listing all 46 ids, after which every category fallow adds in a
future release is silently absent — no error, no warning, coverage quietly stops growing.
Credentials are GitHub secret scanning's job instead (see below).

### Deeper review with deepsec

`fallow security` is the fast deterministic pass. [deepsec](https://github.com/vercel-labs/deepsec) is
the thorough one: a free regex scan, then an AI stage that reads each candidate in its actual
context, then a revalidation stage that cuts the false-positive rate. Run it before a release,
after touching the Better Auth proxy or any server handler, and whenever a fallow candidate needs
a judgement call rather than a glance:

```bash
cd .deepsec
pnpm deepsec scan                          # free, regex only
pnpm deepsec process    --concurrency 5    # the AI stage
pnpm deepsec revalidate --concurrency 5    # cuts the false-positive rate
pnpm deepsec export --format md-dir --out ./findings
```

The workspace is **deliberately not in git**, and must stay that way: `data/*/INFO.md` maps this
repo's security-sensitive surface, and exported findings describe vulnerabilities that are not
fixed yet. Neither belongs in a public repository. `npx deepsec init` recreates it; `.deepsec/README.md`
covers setup and model credentials once it exists.

### Supply chain

| Gate | What it stops |
| --- | --- |
| `minimumReleaseAge: 1440` (pnpm) | A package published in the last 24h cannot be installed at all — the window a malicious publish relies on |
| Dependabot `cooldown: 2` days | Kept one day wider than the pnpm gate so it never proposes a version pnpm will refuse. Security updates are exempt, so CVE fixes ship immediately |
| `dependency-review` (PRs) | Known CVEs and malware in the dependency delta |
| `verifyDepsBeforeRun: error` | A lockfile that no longer matches the manifests |
| `pack` job | Builds the real tarball, lints its shape with `publint` + `attw`, and installs it into a fixture with plain npm |

Dependabot owns every dependency PR — npm versions and GitHub Actions digests alike. No
third-party app holds write access to this repository.

### CI and release hardening

- Every third-party action is pinned to a full commit SHA, never a tag — and GitHub enforces it
  (`sha_pinning_required`), so a floating tag is refused before zizmor ever sees it.
- `persist-credentials: false` on every checkout. The one job that pushes carries the token in a
  single step's environment, so it never sits in `.git/config` while dependencies install.
- [zizmor](https://docs.zizmor.sh) statically analyses the workflows themselves — template
  injection, unpinned actions, impostor commits, credential persistence. Accepted findings carry
  their reasoning.
- The release is three jobs so the credentials never meet the code: the job that tags holds no npm
  credential and cannot start until a maintainer approves the run; the job that builds holds
  nothing; the job that publishes checks out nothing, installs nothing, runs behind
  `step-security/harden-runner` in `block` mode with an allowlist of GitHub, npm and Sigstore, and
  works in a fixed order — attest the tarball, create the GitHub Release, then stage on npm — so
  nothing reaches npm without its proof.
  `Release Prepare` is split the same way: the job that runs changelogen has a read-only token, and
  the job that commits and opens the pull request installs nothing.
- Every release carries its own proof: the tarball and its SBOM are attested with
  `actions/attest-build-provenance` (`gh attestation verify nuxt-convex-module-<version>.tgz --owner qruto`),
  the attestation bundle and the CycloneDX SBOM of the package's production dependencies are
  assets of the immutable GitHub Release, and npm's provenance covers the same tarball.
- **No stored credentials at all.** Publishing uses npm **Trusted Publishing** over OIDC bound to
  a `main`-only environment, and coverage uploads use Codecov's OIDC — so no long-lived token
  exists anywhere in this repository, and a workflow edited on a branch cannot reach either
  service. `id-token: write` is granted only to jobs that run no pull-request-authored code and
  install nothing.
  Releases are **staged**: nothing becomes installable until a maintainer approves it with 2FA,
  after npm's malware scan — provenance says where a package came from, not what is in it.
- The release refuses a commit whose `ci` run is not a completed success, and waits for one that
  is still running rather than re-running its jobs.

### GitHub-native

fallow deliberately leaves credentials to GitHub, so these settings are what catch them:

| Setting | State | Why |
| --- | --- | --- |
| Private vulnerability reporting | on | The reporting path at the top of this file |
| Dependabot security updates | on | Advisories against the resolved lockfile |
| Dependabot malware alerts | on | The one thing the dependency graph does not cover: a malicious publish of an already-pinned transitive |
| Secret scanning | on | Detects a committed credential |
| Push protection | on | Blocks the commit outright instead of reporting it after the fact |
| Code scanning (CodeQL) | on, `extended` | The default suite plus 16 JS/TS and 5 `actions/*` queries |
| Non-provider patterns | **off**, deliberately | Generic keys and connection strings with no vendor prefix — a documented false-positive class |
| Validity checks | **off** | Would tell us whether a detected key is still live, but needs Team or Enterprise; this org is on the free plan |

### What the module ships to apps

Everything above protects *this repository*. What the module does for an application built on it
— the Convex-aware CSP, the hardened auth proxy, auth tokens in SSR payloads, safe post-sign-in
redirects, cross-domain one-time tokens — is documented in the
[security guide](https://nuxt-convex-module.dev/getting-started/security).

### Review notes

The attacker-reachable surface — the auth proxy, the one-time-token exchange, the SSR token
prefetch, the `auth` middleware, the redirect guard, the CSP, and the DevTools panel — was
reviewed by hand before 1.0.0 (2026-09-13), one question per file. What was found, and what
was decided:

- **Proxy path.** Nitro routes the raw request path and the handler forwarded the URL-normalised
  one, so `/api/auth/../../x` matched `/api/auth/**` and was sent to the site origin as `/x` —
  any HTTP action on the deployment, through the app's origin, with its cookies. Next.js
  normalises paths before routing, which is why upstream's handler never sees one. **Fixed:** the
  proxy refuses a request whose normalised path differs from the routed one (400).
- **Proxy forwarded host.** `x-forwarded-host` / `x-better-auth-forwarded-host` carry the
  incoming `Host`, exactly as upstream's `convexBetterAuthNextJs` does. A spoofed `Host` reaches
  Better Auth on the Convex side as the request origin. **Accepted, with the upstream mitigation:**
  set `baseURL` and `trustedOrigins` in the Convex-side Better Auth config, as its docs require.
  The response relay is verbatim (`Set-Cookie`, `Location`); the origin it relays from is pinned
  by config, so nothing foreign is relayed.
- **Cross-domain tokens.** `crossDomainCallbackRoute` is off by default, matching upstream: a
  fresh token completes sign-in on whatever page receives it. **Accepted as upstream's design;**
  in `nuxt dev` the exchange now warns once when no callback route is set, naming the option.
- **SSR token prefetch.** `Cache-Control: private, no-store` is set only when a token exists.
  Without one the payload carries no per-user data — Convex enforces auth inside the function —
  so a signed-out render is cacheable. **Accepted.** A custom `token` passed to `useAsyncQuery`
  is the caller's to protect.
- **`auth` middleware.** Under `nuxt generate` the guard runs with a request event and no cookie,
  so a protected page prerenders as a redirect to `loginPath` — nothing guarded is baked in.
  Without a request event it used to let the page render. **Fixed:** it fails closed.
- **Redirect guard.** `resolveAuthRedirect` re-resolves every candidate against the app origin
  and refuses anything that lands elsewhere; the backslash, scheme-relative, dot-segment,
  percent-encoded and control-character spellings are all covered by its tests. **No change.**
- **CSP.** Origins are derived through `new URL()`'s `origin` / `host`, so a malformed
  `convex.url` yields no source rather than a mangled directive. **No change.**
- **DevTools.** The panel and its RPC run only under `nuxt dev`, on Vite's middleware — reachable
  exactly as far as Nuxt DevTools itself. `getInfo` exposes the deployment URLs and the project's
  root path, information Nuxt DevTools already shows. **Accepted.**
