// Type-check a consumer app against the BUILT package.
//
// This package's product is its types, and nothing else checks that the emitted
// `.d.ts` files actually compile in an app. `vue-tsc` in the `static` job checks
// the sources. `attw` checks that the declarations resolve. Neither answers the
// question a user has: with this tarball installed, does
// `useAsyncQuery(api.messages.list, {})` type-check?
//
// It runs against the directory the pack job already installed the tarball into,
// so what gets checked is the real published package, not the workspace.
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

// The checkers are the exact versions this repository resolved, read out of its
// own node_modules rather than from the manifest's ranges. Handing npm
// `vue-tsc: ^3.3.11` would install whatever is newest, so this job could check
// the published declarations with a different compiler than the `static` job
// used on the sources — and the two could then disagree about the same types.
const installed = (name) => {
  const path = new URL(`../node_modules/${name}/package.json`, import.meta.url)
  return JSON.parse(readFileSync(path, 'utf8')).version
}
const checkers = ['vue-tsc', 'typescript', '@types/node'].map(
  name => `${name}@${installed(name)}`,
)
console.log(`check:consumer-types: ${checkers.join(' ')}`)

// Nuxt's documented per-context setup, written out rather than extended: an
// app's tsconfig references the four generated contexts and holds no files of
// its own. https://nuxt.com/docs/4.x/guide/directory-structure/tsconfig
//
// `convex/` needs no exclude. None of the four contexts include it, and Convex
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
// nothing at all: it reports success having compiled zero files, so this would
// pass whatever the declarations do. Checked by planting a real type error in
// the consumer app: `--noEmit` exits 0, `--build` exits 2.
run('Type check the consumer', 'npx', ['--no-install', 'vue-tsc', '--build'])

console.log('check:consumer-types: the published declarations compile in a real app')
