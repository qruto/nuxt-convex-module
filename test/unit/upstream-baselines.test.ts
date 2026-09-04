import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { upstreamBaselines } from '../../website/app/utils/upstream-baselines'

// The docs site now STATES the ported upstream version — in the hero chip, in
// the introduction, and on every component page — all of it read off
// `website/app/utils/upstream-baselines.ts`. PARITY.md stays the repository's
// authority (AGENTS.md's sync procedure updates it first), so this test pins
// the site's copy, the README's prose and the components overview to it: a
// baseline bump that misses one of them fails here instead of shipping a
// confidently wrong version number to readers.
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), 'utf8')

const PARITY = read('PARITY.md')
const README = read('README.md')
const COMPONENTS_OVERVIEW = read('website/content/3.components/1.index.md')

/** The last cell of the markdown table row containing `token`. */
function lastCell(markdown: string, token: string): string | undefined {
  const row = markdown
    .split('\n')
    .find(line => line.startsWith('|') && line.includes(token))
  return row
    ?.split('|')
    .map(cell => cell.trim())
    .filter(Boolean)
    .at(-1)
}

describe('upstream baselines', () => {
  it.each(Object.entries(upstreamBaselines))(
    'matches PARITY.md’s pinned baseline for %s',
    (_key, baseline) => {
      // e.g. "| `convex` (`/react`, …) | **1.45.0** | Verified … |"
      const row = PARITY.split('\n').find(
        line => line.startsWith(`| \`${baseline.package}\``),
      )
      expect(row, `no pinned-baseline row for ${baseline.package}`).toBeDefined()
      expect(row).toContain(`**${baseline.version}**`)
    },
  )

  // The README states each baseline in prose — "At parity with `convex@1.45.0`"
  // — rather than in a table cell, so match the package@version it prints.
  it.each(Object.values(upstreamBaselines))(
    'states `$package@$version` in README.md',
    ({ package: pkg, version }) => {
      expect(README).toContain(`\`${pkg}@${version}\``)
    },
  )

  // The components overview still carries a version per row, as the row's last
  // cell. Keyed by a subpath unique to that row.
  const overviewRows: Array<[token: string, version: string]> = [
    ['`/clerk/vue`', upstreamBaselines.convex.version],
    ['`/auth0/vue`', upstreamBaselines.convex.version],
    ['`/better-auth/vue`', upstreamBaselines['better-auth'].version],
    ['`/polar/vue`', upstreamBaselines.polar.version],
  ]

  it.each(overviewRows)('states the components overview’s %s row as the pinned version', (token, version) => {
    expect(lastCell(COMPONENTS_OVERVIEW, token)).toBe(`\`${version}\``)
  })
})
