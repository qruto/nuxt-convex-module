import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { upstreamBaselines } from '../../website/app/utils/upstream-baselines'

// What package.json PROMISES a consumer, checked against what is actually
// installed here. Nothing else in the suite compares the two: the peer ranges
// are hand-written prose that no build step reads, and PARITY.md's baselines
// are documentation. Both go stale silently — a `convex` minor that changes a
// signature leaves "verified against 1.45.0" false with every other gate green,
// and a peer floor drifts below the version the port was actually written
// against with nothing to notice.

const root = new URL('../../', import.meta.url)
const manifest = JSON.parse(readFileSync(fileURLToPath(new URL('package.json', root)), 'utf8')) as {
  peerDependencies: Record<string, string>
  peerDependenciesMeta: Record<string, { optional?: boolean }>
  devDependencies: Record<string, string>
}

/** The version actually resolved into node_modules, or undefined if absent. */
function installedVersion(pkg: string): string | undefined {
  try {
    const path = fileURLToPath(new URL(`node_modules/${pkg}/package.json`, root))
    return (JSON.parse(readFileSync(path, 'utf8')) as { version: string }).version
  }
  catch {
    return undefined
  }
}

type Parts = [major: number, minor: number, patch: number]

/** `1.6.11-beta.2` -> [1, 6, 11]. Prerelease tags are dropped deliberately. */
function parts(version: string): Parts {
  const [core] = version.split('-')
  const [major = 0, minor = 0, patch = 0] = core!.split('.').map(Number)
  return [major, minor, patch]
}

function compare(a: Parts, b: Parts): number {
  return (a[0] - b[0]) || (a[1] - b[1]) || (a[2] - b[2])
}

// A deliberately small range evaluator rather than a `semver` devDependency:
// these are the only three operators this package's peer ranges use, and an
// unsupported one throws instead of quietly passing. That is the failure mode a
// general library would hide — a range shape nobody checked, reported as
// satisfied.
const COMPARATOR = /^(>=|<=|[<>^~=])?\s*v?(\d+\.\d+\.\d\S*)$/

function satisfiesComparator(version: string, comparator: string): boolean {
  const match = COMPARATOR.exec(comparator.trim())
  if (!match) throw new Error(`unsupported range comparator: "${comparator}"`)
  const [, operator = '=', bound] = match
  const cmp = compare(parts(version), parts(bound!))

  switch (operator) {
    case '>=': return cmp >= 0
    case '<=': return cmp <= 0
    case '>': return cmp > 0
    case '<': return cmp < 0
    case '=': return cmp === 0
    // `^1.2.3` — anything up to the next left-most non-zero segment. For 0.x
    // that is the minor, which is why `^0.4.1` does not accept 0.5.0.
    case '^': {
      const [major, minor] = parts(bound!)
      if (cmp < 0) return false
      const v = parts(version)
      if (major > 0) return v[0] === major
      if (minor > 0) return v[0] === 0 && v[1] === minor
      return v[0] === 0 && v[1] === 0
    }
    // `~1.2.3` — patch-level changes only.
    case '~': {
      const [major, minor] = parts(bound!)
      const v = parts(version)
      return cmp >= 0 && v[0] === major && v[1] === minor
    }
    default: throw new Error(`unsupported range comparator: "${comparator}"`)
  }
}

/** Space-separated comparators all have to hold; `||` is not used here and throws. */
function satisfies(version: string, range: string): boolean {
  if (range.includes('||')) throw new Error(`unsupported range union: "${range}"`)
  return range.trim().split(/\s+/).every(part => satisfiesComparator(version, part))
}

describe('range evaluator', () => {
  // The evaluator is the thing every assertion below trusts, so it is checked
  // first — a broken one would report the whole contract as satisfied.
  it.each([
    ['1.45.0', '>=1.40.0', true],
    ['1.39.0', '>=1.40.0', false],
    ['1.6.30', '>=1.6.11 <1.7.0', true],
    ['1.7.0', '>=1.6.11 <1.7.0', false],
    ['1.6.10', '>=1.6.11 <1.7.0', false],
    ['3.5.42', '^3.5.0', true],
    ['4.0.0', '^3.5.0', false],
    ['3.4.9', '^3.5.0', false],
    ['0.4.1', '^0.4.1', true],
    ['0.5.0', '^0.4.1', false],
    ['1.6.30', '~1.6.30', true],
    ['1.7.0', '~1.6.30', false],
  ])('reads %s against %s as %s', (version, range, expected) => {
    expect(satisfies(version, range)).toBe(expected)
  })

  it('refuses a range shape it cannot evaluate', () => {
    expect(() => satisfies('1.0.0', '1.x')).toThrow(/unsupported/)
    expect(() => satisfies('1.0.0', '^1.0.0 || ^2.0.0')).toThrow(/unsupported/)
  })
})

describe('peer dependencies', () => {
  const peers = Object.entries(manifest.peerDependencies)

  it.each(peers)('%s: the installed version satisfies the declared range', (pkg, range) => {
    const version = installedVersion(pkg)
    expect(version, `${pkg} is declared a peer but is not installed`).toBeDefined()
    expect(
      satisfies(version!, range),
      `peerDependencies["${pkg}"] is "${range}" but ${version} is installed — `
      + `the range no longer describes the version this port is developed against`,
    ).toBe(true)
  })

  // `vue` is the one peer with no devDependency of its own: it arrives with
  // `nuxt` (a devDependency, on the catalog pin), and declaring it separately
  // would let this repository build against a Vue that Nuxt does not ship.
  const PROVIDED_BY_NUXT = new Set(['vue'])

  // A peer nobody installs is a peer nobody tests. Every other one is exercised
  // somewhere in this repository, so every other one has a devDependency.
  it.each(peers)('%s is also a devDependency, so the peer is actually exercised', (pkg) => {
    if (PROVIDED_BY_NUXT.has(pkg)) {
      expect(installedVersion(pkg), `${pkg} should arrive with nuxt`).toBeDefined()
      return
    }
    expect(manifest.devDependencies[pkg], `${pkg} is a peer with no devDependency`).toBeDefined()
  })

  // The drift this catches: bumping the devDependency to a new minor and
  // leaving the peer floor on the old one. The floor should not sit below the
  // major/minor the repository actually develops against.
  it.each(peers)('%s: the peer floor is not stale against the devDependency', (pkg, range) => {
    if (PROVIDED_BY_NUXT.has(pkg)) return
    const dev = manifest.devDependencies[pkg]!
    const devFloor = parts(dev.replace(/^[\^~><= ]*/, ''))
    const floorComparator = range.trim().split(/\s+/)[0]!
    const floor = parts(COMPARATOR.exec(floorComparator)![2]!)

    // Same left-most non-zero segment: a floor a whole minor (0.x) or major
    // behind what we build against is a promise the port cannot keep.
    const stale = devFloor[0] > 0
      ? floor[0] < devFloor[0]
      : floor[0] === 0 && floor[1] < devFloor[1]

    expect(
      stale,
      `peerDependencies["${pkg}"] is "${range}" but devDependencies pins "${dev}" — `
      + `raise the peer floor to match, or the port claims support for a line it never builds against`,
    ).toBe(false)
  })
})

describe('PARITY.md baselines', () => {
  // upstream-baselines.test.ts already pins these numbers to PARITY.md, the
  // README and the components overview. This is the other half: the number has
  // to describe the code actually in node_modules, or every one of those
  // statements is confidently wrong.
  it.each(Object.entries(upstreamBaselines))(
    '%s: the installed package is exactly the pinned baseline',
    (_key, baseline) => {
      const version = installedVersion(baseline.package)
      expect(version, `${baseline.package} is a documented baseline but is not installed`).toBeDefined()
      expect(
        version,
        `${baseline.package}@${version} is installed but PARITY.md pins ${baseline.version} — `
        + `port the upstream diff and move the baseline, or pin the devDependency back`,
      ).toBe(baseline.version)
    },
  )
})
