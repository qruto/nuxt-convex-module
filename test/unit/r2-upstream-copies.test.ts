import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// PARITY: D-21. `src/runtime/r2/upstream` copies a file that `@convex-dev/r2`
// ships but does not export. The package publishes its `src`, so the copy is
// held to the installed file: a release that changes it fails here.
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../../${path}`, import.meta.url)), 'utf8')

describe('r2 upstream copies', () => {
  it.each(['client/upload.ts'])('%s matches the installed package', (path) => {
    expect(read(`src/runtime/r2/upstream/${path}`)).toBe(read(`node_modules/@convex-dev/r2/src/${path}`))
  })
})
