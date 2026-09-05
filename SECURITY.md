# Security Policy

> Looking for how to **secure an app built with this module** — the CSP, the auth proxy, SSR
> tokens, safe redirects, and a production checklist? That's the
> [security guide](./website/content/1.getting-started/4.security.md). This file covers reporting
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
[Better Auth](https://github.com/better-auth/better-auth), Polar, or Resend — belong in *their*
security process, not here. Report them to that project directly. If you are unsure which side a
finding lands on, report it here and we will route it.

## How this repository is checked

Reporting is the last line, not the first. These are the gates a change passes before it can
reach a release.

### Static analysis in CI

[`fallow security`](https://docs.fallow.tools) runs as its own step in the `quality` job and in
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

`fallow security` is the fast deterministic pass. [deepsec](https://github.com/vercel/deepsec) is
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

- Every third-party action is pinned to a full commit SHA, never a tag.
- `persist-credentials: false` on every checkout except the release one, which must push the
  release commit back; that exception is declared in [`.github/zizmor.yml`](./.github/zizmor.yml)
  rather than left implicit.
- [zizmor](https://docs.zizmor.sh) statically analyses the workflows themselves — template
  injection, unpinned actions, credential persistence. Accepted findings carry their reasoning.
- `step-security/harden-runner` guards the release job (`egress-policy: audit` for now; it
  tightens to `block` with an allowlist once the first releases have produced a baseline).
- Publishing uses npm **Trusted Publishing** over OIDC, so no long-lived registry token exists
  in the repository or its secrets.
- The release job refuses to publish a commit whose `ci` run is not a completed success.

### GitHub-native

Private vulnerability reporting (above), Dependabot security updates, and secret scanning are
enabled. Three related toggles in **Settings → Code security** are currently **off** and are free
on a public repository — worth turning on, since fallow deliberately leaves credentials to them:

- **Push protection** — blocks a commit containing a recognised credential instead of reporting
  it after the fact.
- **Validity checks** — asks the provider whether a detected key is live, which is the difference
  between "rotate now" and "already revoked".
- **Non-provider patterns** — generic keys and connection strings that carry no vendor prefix.

### What the module ships to apps

Everything above protects *this repository*. What the module does for an application built on it
— the Convex-aware CSP, the hardened auth proxy, auth tokens in SSR payloads, safe post-sign-in
redirects, cross-domain one-time tokens — is documented in the
[security guide](./website/content/1.getting-started/4.security.md).
