// Type-check a consumer app against the BUILT package.
//
// This package's product is its types, and until now nothing checked that the
// emitted `.d.ts` actually compiles in an app. `vue-tsc` in the `static` job
// checks the *sources*; `attw` checks that the declarations *resolve*. Neither
// answers the question a consumer asks: with this tarball installed, does
// `useAsyncQuery(api.messages.list, {})` type-check?
//
// Run against the directory the pack job already npm-installs the tarball into,
// so the thing being checked is the real published artifact rather than the
// workspace.
//
//   node scripts/check-consumer-types.mjs <app-dir>
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { step } from './lib/step.mjs'

const appDir = process.argv[2]
if (!appDir) {
  console.error('usage: node scripts/check-consumer-types.mjs <app-dir>')
  process.exit(1)
}

// The checkers are pinned to the versions this repository develops against, read
// from its own manifest, so the gate cannot drift from the `static` job's
// `vue-tsc` and start disagreeing with it about the same declarations.
const { devDependencies } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
)
const checkers = ['vue-tsc', 'typescript', '@types/node'].map(
  name => `${name}@${devDependencies[name]}`,
)

// Nuxt's documented per-context project setup, copied rather than `extends`ed:
// an app's tsconfig references the four generated contexts and holds no files
// of its own. https://nuxt.com/docs/4.x/guide/directory-structure/tsconfig
//
// `convex/` needs no exclude — none of the four contexts include it, and Convex
// type-checks those files itself.
writeFileSync(
  join(appDir, 'tsconfig.json'),
  `${JSON.stringify({
    files: [],
    references: [
      { path: './.nuxt/tsconfig.app.json' },
      { path: './.nuxt/tsconfig.server.json' },
      { path: './.nuxt/tsconfig.shared.json' },
      { path: './.nuxt/tsconfig.node.json' },
    ],
  }, null, 2)}\n`,
)

const run = (label, file, args) => step(label, file, args, { cwd: appDir })

console.log(`check:consumer-types: ${appDir}\n`)

// npm, not pnpm: this directory was installed by the consumer's npm and has no
// pnpm workspace above it.
run('Install checkers', 'npm', ['install', '--no-audit', '--no-fund', '--no-save', ...checkers])

// Generates the four `.nuxt/tsconfig.*.json` the references above point at,
// plus the `#convex/*` aliases the module registers.
run('Prepare', 'npx', ['--no-install', 'nuxt', 'prepare'])

// `--build`, not `--noEmit`. The tsconfig above is solution-style — `files: []`
// plus four project references — and `vue-tsc --noEmit` on one of those checks
// exactly nothing: it reports success having compiled zero files, so the gate
// passes no matter what the declarations do. Verified by planting a deliberate
// type error in the consumer app: `--noEmit` exits 0, `--build` exits 2.
run('Type check the consumer', 'npx', ['--no-install', 'vue-tsc', '--build'])

console.log('check:consumer-types: the published declarations compile in a real app')
