// The `#convex/*` alias map. Off the module entry for the same reason as
// options.ts: it is wiring, not API. Tests import this file directly.
import { join } from 'node:path'
import { resolveFunctionsDir } from './functions-dir'

/**
 * Build the ordered import-alias map for the Convex functions folder and its
 * generated modules, so user code and server routes can `import from
 * '#convex/...'` without spelling out `_generated`.
 *
 * - `#convex/api`        -> _generated/api        (`api`, `internal`, `components`)
 * - `#convex/server`     -> _generated/server     (`query`, `mutation`, `action`, `*Ctx`, ...)
 * - `#convex/dataModel`  -> _generated/dataModel  (`DataModel`, `Doc`, `Id`, `TableNames`)
 * - `#convex/_generated` -> _generated            (long form, covers every generated file)
 * - `#convex`            -> <rootDir>/<functionsDir>
 *
 * Order is significant: both Vite and Nitro resolve aliases with
 * `@rollup/plugin-alias`, which is first-match-wins and treats `#convex` as a
 * prefix of `#convex/api`. The specific generated-module aliases must come
 * before the catch-all `#convex`, otherwise `#convex/api` would resolve to
 * `<functionsDir>/api` instead of `<functionsDir>/_generated/api` (and would
 * shadow any user function file literally named `api.ts` / `server.ts`).
 */
export function getConvexAliases(rootDir: string): Record<string, string> {
  const functionsDir = resolveFunctionsDir(rootDir)
  const convexDir = join(rootDir, functionsDir)
  const generatedDir = join(convexDir, '_generated')

  return {
    '#convex/api': join(generatedDir, 'api'),
    '#convex/server': join(generatedDir, 'server'),
    '#convex/dataModel': join(generatedDir, 'dataModel'),
    '#convex/_generated': generatedDir,
    '#convex': convexDir,
  }
}
