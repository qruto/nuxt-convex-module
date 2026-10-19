// Print what an upstream release changed in the code this port mirrors:
// the commit list, then the diff, for one tier's mapped paths plus the
// internals it re-implements or reaches (PARITY.md §1 and §4).
//
//   pnpm parity:diff <tier> [to] [from]
//
// `from` defaults to the pinned baseline, `to` to the latest npm release. The
// upstream is cloned once, blobless, into node_modules/.cache/upstream/, or
// read from UPSTREAM_DIR. Always over HTTPS: an SSH remote cannot sign in from
// a non-interactive session.
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { upstreamBaselines } from '../website/app/utils/upstream-baselines.ts'

const TIERS = {
  'convex': {
    repo: 'convex/convex-js',
    tag: v => `npm/${v}`,
    // The entry points, then what the port re-implements (PaginatedQueryClient,
    // X-05) or reaches into (http_client, validateDeploymentUrl).
    paths: ['src/react', 'src/nextjs', 'src/react-clerk', 'src/react-auth0', 'src/browser/sync', 'src/browser/http_client.ts', 'src/common'],
  },
  'better-auth': {
    repo: 'convex/better-auth',
    tag: v => `v${v}`,
    // `src/client/plugins` only re-exports the two plugin clients.
    paths: ['src/react', 'src/nextjs', 'src/utils', 'src/client/plugins', 'src/plugins/convex/client.ts', 'src/plugins/cross-domain/client.ts'],
  },
  'polar': {
    repo: 'convex/polar',
    tag: v => `v${v}`,
    paths: ['src/react'],
  },
}

const [tier, toArg, fromArg] = process.argv.slice(2)
const config = TIERS[tier]
if (!config) {
  console.error(`Usage: pnpm parity:diff <${Object.keys(TIERS).join('|')}> [to] [from]`)
  process.exit(1)
}

const run = (cmd, args, opts) => execFileSync(cmd, args, { encoding: 'utf8', ...opts }).trim()
const baseline = upstreamBaselines[tier]
const from = fromArg ?? baseline.version
const to = toArg ?? run('npm', ['view', baseline.package, 'version'])

const dir = process.env.UPSTREAM_DIR ?? new URL(`../node_modules/.cache/upstream/${tier}`, import.meta.url).pathname
const url = `https://github.com/${config.repo}.git`
if (!existsSync(dir))
  execFileSync('git', ['clone', '--quiet', '--filter=blob:none', '--no-checkout', url, dir], { stdio: 'inherit' })
for (const v of [from, to])
  run('git', ['-C', dir, 'fetch', '--quiet', '--force', url, `refs/tags/${config.tag(v)}:refs/tags/${config.tag(v)}`])

const range = [config.tag(from), config.tag(to)]
console.log(`# ${baseline.package} ${from} → ${to} (${config.repo})\n`)
console.log(run('git', ['-C', dir, 'log', '--oneline', `${range[0]}..${range[1]}`, '--', ...config.paths]) || '(no commits)')
console.log()
execFileSync('git', ['-C', dir, '-c', 'core.fileMode=false', 'diff', ...range, '--', ...config.paths], { stdio: 'inherit' })
