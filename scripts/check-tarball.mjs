// The publishable-package gate, defined once. `ci`'s pack job and `release`'s
// build job both run this against the tarball they just produced, so a release
// artifact can never skip a check a pull request was failed for.
//
// Resolves the tarball itself rather than letting the shell expand
// `nuxt-convex-module-*.tgz`: `*.tgz` is gitignored, so a stale local pack
// leaves a second file and the glob would silently hand two arguments to
// publint.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { step } from './lib/step.mjs'

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

const run = (label, file, args) => step(label, file, args, { cwd: root })

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

// ── Optional peers must not leak across subpaths ───────────────────────────
//
// Every optional peer is optional because most consumers do not install it. An
// import of one that ends up reachable from a subpath that does not need it is
// `ERR_MODULE_NOT_FOUND` at runtime for every one of those consumers — and
// nothing else here can see it: `publint` reads the manifest, `attw` resolves
// types, and the smoke install has the whole tree present so every import
// resolves. Only the shipped graph itself answers the question.
//
// Walked statically rather than probed with a real install: it needs no
// network, it is deterministic, and it sees a specifier behind a dynamic import
// that a probe would only hit on the code path that runs it.
console.log('── Optional peer isolation ────────────────────')

const manifest = JSON.parse(
  execFileSync('tar', ['-xzOf', tarball, 'package/package.json'], { encoding: 'utf8' }),
)

const optionalPeers = new Set(
  Object.entries(manifest.peerDependenciesMeta ?? {})
    .filter(([, meta]) => meta?.optional)
    .map(([name]) => name),
)

// Which optional peers each subpath is ALLOWED to reach. A subpath named after
// a provider may import that provider; nothing else may import anything.
// Deliberately exhaustive rather than pattern-matched, so a new subpath fails
// here until someone states its contract.
const allowed = {
  '.': [],
  './client': [],
  './vue': [],
  './server': [],
  './better-auth/client': ['better-auth', '@convex-dev/better-auth'],
  './better-auth/server': ['better-auth', '@convex-dev/better-auth'],
  './polar/client': ['@convex-dev/polar', '@polar-sh/checkout'],
  './polar/vue': ['@convex-dev/polar', '@polar-sh/checkout'],
  './clerk/client': ['@clerk/vue'],
  './clerk/vue': ['@clerk/vue'],
  './auth0/client': ['@auth0/auth0-vue'],
  './auth0/vue': ['@auth0/auth0-vue'],
}

const extracted = mkdtempSync(join(tmpdir(), 'nuxt-convex-subpaths-'))
try {
  execFileSync('tar', ['-xzf', tarball, '-C', extracted], { stdio: 'inherit' })
  const pkgRoot = join(extracted, 'package')

  // `from '…'`, `import '…'`, `import('…')`, `export … from '…'`.
  const SPECIFIER = /(?:\bexport\s*\*\s*from|\bfrom|\bimport\s*\(|\bimport)\s*['"]([^'"]+)['"]/g

  // Block comments are stripped first. mkdist keeps JSDoc in the emitted `.js`,
  // and several barrels carry usage examples — `import … from
  // 'nuxt-convex-module/clerk/client'` among them. Matched raw, a doc comment
  // naming an optional peer would be reported as a leak that no code performs.
  const CODE_ONLY = /\/\*[\s\S]*?\*\//g

  /**
   * The package a specifier names, or null when it names none — a relative
   * path, a Node builtin, or a `#` subpath alias resolved by the consumer.
   */
  const packageName = (specifier) => {
    if (specifier.startsWith('.') || specifier.startsWith('node:') || specifier.startsWith('#')) {
      return null
    }
    // Scoped names keep two segments, plain names keep one.
    const parts = specifier.split('/')
    return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
  }

  /**
   * Where a relative specifier might land. Emitted ESM carries explicit
   * extensions, but a hand-written import can take any of these shapes, and
   * probing all four is cheaper than resolving properly.
   */
  const candidates = (file, specifier) => {
    const target = resolve(dirname(file), specifier)
    return [
      target,
      `${target}.js`,
      `${target}.mjs`,
      join(target, 'index.js'),
      join(target, 'index.mjs'),
    ]
  }

  /**
   * The file a self-referencing specifier points at — `nuxt-convex-module/vue`
   * to `./dist/runtime/vue/index.js` — or null when the specifier names some
   * other package.
   */
  const ownSubpath = (specifier) => {
    if (specifier !== manifest.name && !specifier.startsWith(`${manifest.name}/`)) return null
    const key = specifier === manifest.name ? '.' : `.${specifier.slice(manifest.name.length)}`
    const entry = (manifest.exports ?? {})[key]
    if (!entry) return null
    return typeof entry === 'string' ? entry : entry.import ?? null
  }

  /** A subpath whose entry is missing is publint's finding, not this one. */
  const readOrNull = (file) => {
    try {
      return readFileSync(file, 'utf8')
    }
    catch {
      return null
    }
  }

  /** Every bare package name reachable from `entry` through relative imports. */
  const reachable = (entry) => {
    const seen = new Set()
    const bare = new Set()
    const queue = [entry]

    while (queue.length > 0) {
      const file = queue.pop()
      if (seen.has(file)) continue
      seen.add(file)

      const code = readOrNull(file)
      if (code === null) continue

      for (const [, specifier] of code.replace(CODE_ONLY, '').matchAll(SPECIFIER)) {
        // A subpath of this package itself is not a peer — it is more of this
        // package. Resolve it back through the manifest and keep walking, or a
        // barrel that re-exports through the published name would end the walk
        // and report a pass it never earned.
        const own = ownSubpath(specifier)
        if (own) {
          queue.push(join(pkgRoot, own))
          continue
        }
        const name = packageName(specifier)
        if (name) bare.add(name)
        else if (specifier.startsWith('.')) queue.push(...candidates(file, specifier))
      }
    }
    return bare
  }

  const leaks = []
  for (const [subpath, entry] of Object.entries(manifest.exports ?? {})) {
    if (subpath === './package.json') continue

    const permitted = allowed[subpath]
    if (!permitted) {
      leaks.push(`${subpath} has no declared optional-peer contract — add it to \`allowed\` in scripts/check-tarball.mjs`)
      continue
    }

    const target = typeof entry === 'string' ? entry : entry.import
    if (!target) continue

    for (const name of reachable(join(pkgRoot, target))) {
      if (optionalPeers.has(name) && !permitted.includes(name)) {
        leaks.push(`${subpath} reaches optional peer "${name}" — a consumer without it gets ERR_MODULE_NOT_FOUND`)
      }
    }
  }

  if (leaks.length > 0) {
    for (const leak of leaks) console.error(`  ✗ ${leak}`)
    process.exit(1)
  }

  const subpaths = Object.keys(allowed).length
  console.log(`  ✓ ${subpaths} subpaths · ${optionalPeers.size} optional peers, none reachable outside its own\n`)
}
finally {
  rmSync(extracted, { recursive: true, force: true })
}

console.log('check:tarball: all good')
