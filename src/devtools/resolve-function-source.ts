import { existsSync } from 'node:fs'
import { join } from 'node:path'

const EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'mts', 'mjs'] as const

/**
 * Map a canonical udfPath (`"path/to/module:functionName"`, function part
 * optional) to the Convex function source file under the functions dir, for
 * the DevTools open-in-editor action. Returns `{}` when no candidate exists.
 */
export function resolveFunctionSource(rootDir: string, functionsDir: string, udfPath: string): { filepath?: string } {
  // The module part may itself contain `/`; only the last `:` segment is the
  // function name (canonicalizeUdfPath guarantees exactly one `:`).
  const modulePath = udfPath.split(':')[0]
  if (!modulePath || modulePath.split('/').some(segment => segment === '' || segment === '.' || segment === '..')) {
    return {}
  }

  const base = join(rootDir, functionsDir)
  for (const candidate of [modulePath, `${modulePath}/index`]) {
    for (const ext of EXTENSIONS) {
      const filepath = join(base, `${candidate}.${ext}`)
      if (existsSync(filepath)) {
        return { filepath }
      }
    }
  }
  return {}
}
