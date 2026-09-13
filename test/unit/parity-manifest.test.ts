import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// PARITY.md is the port's ledger: the file map, and every deliberate divergence
// with its reason and its pinning test. Prose rots silently — the two runtime
// files `nuxt/csp.ts` and `nuxt/security.ts` lived outside the manifest for
// months before anyone noticed. These assertions make the manifest describe the
// tree by construction: a new runtime file, a moved path, a divergence marker
// with no entry, or an entry citing a test that no longer exists all fail here.
//
// Version-string consistency across PARITY.md, the README and the docs site is
// the neighbouring `upstream-baselines.test.ts`.

const root = (path: string) => fileURLToPath(new URL(`../../${path}`, import.meta.url))
const read = (path: string) => readFileSync(root(path), 'utf8')

const PARITY = read('PARITY.md')

/** Every source file the manifest is expected to account for. */
function runtimeFiles(dir = 'src/runtime', acc: string[] = []): string[] {
  for (const entry of readdirSync(root(dir), { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) runtimeFiles(path, acc)
    else if (entry.name.endsWith('.ts')) acc.push(path)
  }
  return acc
}

// Covered by a glob entry in the manifest rather than a per-file row: the
// DevTools panel is one addition (A-15) whose internals move freely.
const GLOB_COVERED = [/^src\/runtime\/devtools\//]

/**
 * Every `src/runtime/…` path PARITY.md names, with sibling brace groups
 * expanded: `` `better-auth/vue/{auth-boundary,use-auth}.ts` `` contributes both
 * files. Upstream paths (`react/client.ts`) and test paths are excluded by the
 * leading-segment filter, so only the port's own tree is compared.
 */
const RUNTIME_DIRS = ['vue', 'nuxt', 'clerk', 'auth0', 'better-auth', 'polar']

function mentionedRuntimePaths(): Set<string> {
  const mentioned = new Set<string>()
  const add = (path: string) => {
    if (RUNTIME_DIRS.includes(path.split('/')[0]!)) mentioned.add(path)
  }
  for (const [, dir, group, ext] of PARITY.matchAll(/`([a-z0-9/.-]+)\{([a-z0-9,._-]+)\}(\.ts)`/g)) {
    for (const part of group!.split(',')) add(`${dir}${part}${ext}`)
  }
  for (const [, path] of PARITY.matchAll(/`([a-z0-9/._-]+\.ts)`/g)) add(path!)
  return mentioned
}

describe('parity manifest — file map', () => {
  const files = runtimeFiles()
  const mentioned = mentionedRuntimePaths()

  it('finds the runtime tree and the manifest’s file map', () => {
    expect(files.length).toBeGreaterThan(20)
    expect(mentioned.size).toBeGreaterThan(20)
  })

  it.each(files.filter(file => !GLOB_COVERED.some(glob => glob.test(file))))(
    'accounts for %s',
    (file) => {
      const relative = file.replace('src/runtime/', '')
      expect(
        mentioned.has(relative),
        `${file} is not named in PARITY.md — add it to §1's file map (and §3.3 if it is a port-only addition)`,
      ).toBe(true)
    },
  )

  // The reverse direction: a path the manifest names must still exist, so a
  // rename or deletion cannot leave the map pointing at nothing.
  it.each([...mentioned])('resolves the mapped path %s', (path) => {
    expect(
      existsSync(root(`src/runtime/${path}`)),
      `PARITY.md maps to src/runtime/${path}, which does not exist — fix the row in §1 or restore the file`,
    ).toBe(true)
  })
})

describe('parity manifest — divergence ledger', () => {
  /** `##### D-08 — the JWT cache retries …` → `D-08`. */
  const entryIds = [...PARITY.matchAll(/^#{4,5} ([NDAX]-\d{2}) —/gm)].map(match => match[1]!)
  /** `| <a id="n-01"></a>**N-01** | …` → `N-01`. */
  const tableIds = [...PARITY.matchAll(/\*\*([NDAX]-\d{2})\*\*/g)].map(match => match[1]!)
  const declaredIds = new Set([...entryIds, ...tableIds])

  it('declares entries in every category', () => {
    for (const prefix of ['N', 'D', 'A', 'X']) {
      expect(
        [...declaredIds].some(id => id.startsWith(prefix)),
        `PARITY.md declares no ${prefix}-* entries`,
      ).toBe(true)
    }
  })

  it('gives every entry a unique ID', () => {
    const all = [...entryIds, ...tableIds]
    const seen = new Set<string>()
    const duplicates = all.filter(id => seen.size === seen.add(id).size)
    expect(duplicates, 'duplicate PARITY IDs').toEqual([])
  })

  // Source markers are written `// PARITY: D-06`, or ` * PARITY: D-01` inside a
  // JSDoc block.
  const markers = (() => {
    const found: Array<[file: string, id: string]> = []
    for (const file of runtimeFiles('src')) {
      for (const match of read(file).matchAll(/PARITY: ([NDAX]-\d{2})/g)) {
        found.push([file, match[1]!])
      }
    }
    return found
  })()

  it('finds markers in the source tree', () => {
    expect(markers.length).toBeGreaterThan(10)
  })

  it.each(markers)('resolves the %s marker for %s', (file, id) => {
    expect(
      declaredIds.has(id),
      `${file} carries a "PARITY: ${id}" marker, but PARITY.md has no ${id} entry — add one to §3, or fix the marker`,
    ).toBe(true)
  })

  // Behavioural divergences are point changes: each must be findable from the
  // code, not only from the manifest.
  const markedIds = new Set(markers.map(([, id]) => id))
  it.each(entryIds.filter(id => id.startsWith('D-')))(
    'marks %s at its source site',
    (id) => {
      expect(
        markedIds.has(id),
        `PARITY.md declares ${id} but no source file carries a "PARITY: ${id}" marker — add one at the divergence`,
      ).toBe(true)
    },
  )
})

describe('parity manifest — cited tests', () => {
  // Every `test/…` path the manifest names: the **Pinned by** field of each
  // ledger entry, plus the guard table in §2.3 and the bump checklist in §4.
  const cited = [...new Set(
    [...PARITY.matchAll(/`(test\/[a-z0-9/_.-]+\.test\.ts)`/g)].map(match => match[1]!),
  )]

  it('cites the tests that pin the ledger', () => {
    expect(cited.length).toBeGreaterThan(15)
  })

  it.each(cited)('resolves the cited test %s', (path) => {
    expect(
      existsSync(root(path)),
      `PARITY.md cites ${path}, but that file does not exist — update the entry that names it`,
    ).toBe(true)
  })

  // Existing is not asserting. A ledger entry's cited test has to be *about*
  // the entry: it mentions the entry's ID, one of the quoted test names on the
  // "Pinned by" line, or an identifier the title or "Port" line names. Without
  // this, an entry can cite a test that never touches the divergence and the
  // gate is satisfied by a file name.
  const entries = [...PARITY.matchAll(/^#{4,5} ([NDAX]-\d{2}) — (.*)\n([\s\S]*?)(?=^#{3,5} |(?![\s\S]))/gm)]
    .map(([, id, title, body]) => {
      const pinned = body!.match(/\*\*Pinned by\*\* · (.*?)(?=\n- \*\*|\n\n|$)/s)?.[1] ?? ''
      const port = body!.match(/\*\*Port\*\* · (.*?)(?=\n- \*\*|\n\n|$)/s)?.[1] ?? ''
      const tests = [...pinned.matchAll(/`(test\/[a-z0-9/_.-]+\.test\.ts)`/g)].map(m => m[1]!)
      const hints = [...pinned.matchAll(/"([^"]+)"/g)].map(m => m[1]!)
      const identifiers = [...`${title} ${port}`.matchAll(/`([^`]+)`/g)]
        .map(m => m[1]!)
        .filter(token => !token.includes('/') && !token.endsWith('.ts'))
        .map(token => token.replace(/\(.*$/, '').split('.').pop()!.replace(/\*/g, ''))
        .filter(token => /^[a-z_$][\w$]*$/i.test(token))
      return { id: id!, tests, hints, identifiers }
    })
    .filter(entry => entry.tests.length > 0)

  it.each(entries.map(e => [e.id, e] as const))('%s is asserted by the tests it cites', (id, entry) => {
    for (const path of entry.tests) {
      if (!existsSync(root(path))) continue // reported by the case above
      const text = read(path)
      const needles = [id, ...entry.hints, ...entry.identifiers]
      expect(
        needles.some(needle => text.includes(needle)),
        `PARITY.md ${id} cites ${path}, but that file mentions none of: ${needles.map(n => JSON.stringify(n)).join(', ')} — `
        + 'cite the test that asserts the divergence (quote its name on the "Pinned by" line), or add a `PARITY: ' + id + '` comment to it',
      ).toBe(true)
    }
  })
})
