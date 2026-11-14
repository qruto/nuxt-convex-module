import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// PARITY: D-20. `src/runtime/convex-auth/upstream` copies files that
// `@convex-dev/auth` ships but does not export. The package publishes its
// `src`, so each copy is held to the installed file: a release that changes
// one fails here, on the Dependabot PR that brings it.
const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(`../../../${path}`, import.meta.url)), 'utf8')

// The edits a copy carries. This repository compiles with
// `verbatimModuleSyntax`, which rejects a type imported as a value. And the
// build emits a relative import as written, so a `.ts` extension would name a
// file the package does not ship.
const EDITS: Record<string, Array<[upstream: string, copy: string]>> = {
  'methods/oauth/client.ts': [['import {\n  FunctionReference,\n', 'import {\n  type FunctionReference,\n']],
}
const withoutExtensions = (source: string) => source.replace(/(from "\.\.?\/[^"]+)\.ts"/g, '$1"')

describe('convex-auth upstream copies', () => {
  it.each([
    'methods/oauth/client.ts',
    'browser/retry.ts',
    'lib/oauthParams.ts',
  ])('%s matches the installed package', (path) => {
    let upstream = read(`node_modules/@convex-dev/auth/src/${path}`)
    for (const [from, to] of EDITS[path] ?? []) {
      expect(upstream).toContain(from)
      upstream = upstream.replace(from, to)
    }
    expect(read(`src/runtime/convex-auth/upstream/${path}`)).toBe(withoutExtensions(upstream))
  })
})
