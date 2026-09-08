// The publishable-package gate, defined once. `ci`'s pack job and `release`'s
// build job both run this against the tarball they just produced, so a release
// artifact can never skip a check a pull request was failed for.
//
// Resolves the tarball itself rather than letting the shell expand
// `nuxt-convex-module-*.tgz`: `*.tgz` is gitignored, so a stale local pack
// leaves a second file and the glob would silently hand two arguments to
// publint.
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const tarballs = readdirSync(root).filter(f => /^nuxt-convex-module-.*\.tgz$/.test(f))

if (tarballs.length === 0) {
  console.error('check:tarball: no nuxt-convex-module-*.tgz here — run `pnpm pack` first.')
  process.exit(1)
}
if (tarballs.length > 1) {
  console.error(`check:tarball: ${tarballs.length} tarballs present (${tarballs.join(', ')}).`)
  console.error('Delete the stale ones — the checks below must run against exactly one artifact.')
  process.exit(1)
}

const tarball = join(root, tarballs[0])
console.log(`check:tarball: ${tarballs[0]}\n`)

const run = (label, file, args) => {
  console.log(`── ${label} ${'─'.repeat(Math.max(0, 46 - label.length))}`)
  execFileSync(file, args, { stdio: 'inherit', cwd: root })
  console.log()
}

// Manifest and exports shape.
run('Package shape (publint)', 'pnpm', ['exec', 'publint', 'run', tarball])

// Type resolution across every export subpath. internal-resolution-error is
// ignored because `#convex/auth-client` in the Better Auth runtime types is a
// Nuxt alias for the app's own auth client, resolved at app build time —
// unresolvable outside a Nuxt app by design.
run('Type resolution (arethetypeswrong)', 'pnpm', [
  'exec',
  'attw',
  tarball,
  '--profile',
  'esm-only',
  '--ignore-rules',
  'internal-resolution-error',
])

// Contents. `pnpm pack` runs prepack, and `dev:prepare` before it symlinks
// dist/runtime at src/runtime — so a build that silently did not happen would
// ship TypeScript sources instead of declarations.
console.log('── Tarball contents ───────────────────────────')
const files = execFileSync('tar', ['-tzf', tarball], { encoding: 'utf8' })
  .split('\n')
  .filter(Boolean)

const problems = []

const sources = files.filter(f => f.endsWith('.ts') && !f.endsWith('.d.ts'))
if (sources.length > 0) {
  problems.push(`ships ${sources.length} TypeScript source file(s), e.g. ${sources[0]} — dist/runtime is probably still the dev:prepare symlink into src/`)
}

const maps = files.filter(f => f.endsWith('.map'))
if (maps.length > 0) {
  problems.push(`ships ${maps.length} sourcemap(s), e.g. ${maps[0]}`)
}

// Without the built DevTools client the module silently proxies every
// consumer's panel to localhost:3630. Matched without the hashed directory
// segment, which is not part of the contract.
const devtools = files.filter(f => f.includes('/dist/devtools-client/') && f.includes('/_nuxt/'))
if (devtools.length === 0) {
  problems.push('dist/devtools-client carries no built assets — the DevTools panel would proxy to localhost:3630 for every consumer')
}

if (problems.length > 0) {
  for (const p of problems) console.error(`  ✗ ${p}`)
  process.exit(1)
}

console.log(`  ✓ ${files.length} entries · no sources, no sourcemaps · devtools-client built (${devtools.length} assets)\n`)
console.log('check:tarball: all good')
