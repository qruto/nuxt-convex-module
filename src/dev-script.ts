// One `dev` script for both processes. `convex dev --start '<cmd>'` runs the
// Convex dev deployment, writes its URL to `.env.local`, and starts `<cmd>`
// beside it — so `nuxt dev` started this way finds the deployment with no
// `.env` at all (see `deploymentEnv` in options.ts). The module makes that the
// default the first time it sees an app whose `dev` script is still the plain
// Nuxt one; a script the app has already shaped is left alone. Off the module
// entry for the same reason as options.ts: this is onboarding, not API.
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { isDeclaredDependency } from './options'

/** What {@link setupDevScript} did, for the caller's log line. */
export interface DevScriptResult {
  /** `true` when `package.json` was rewritten. */
  changed: boolean
  /** The script as it was, when changed. */
  from?: string
  /** The script as it is now, when changed. */
  to?: string
}

/** The plain Nuxt dev script, with or without flags: `nuxt dev`, `nuxi dev --host`, … */
const PLAIN_NUXT_DEV = /^(?:npx )?(?:nuxt|nuxi) dev(?: [^&|;]*)?$/

/** The combined script for a given Nuxt command. */
export function combinedDevScript(nuxtCommand: string): string {
  return `convex dev --start '${nuxtCommand}'`
}

/**
 * Rewrite `scripts.dev` in the app's `package.json` to run Convex beside Nuxt,
 * when — and only when — it is still the plain `nuxt dev` (or `nuxi dev`),
 * `convex` is a declared dependency, and no script already runs `convex dev`.
 * Formatting (indent, trailing newline) is preserved. Nothing else is touched;
 * a missing or unreadable manifest is a no-op.
 */
export function setupDevScript(rootDir: string): DevScriptResult {
  const path = join(rootDir, 'package.json')
  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  }
  catch {
    return { changed: false }
  }
  let manifest: Record<string, unknown>
  try {
    manifest = JSON.parse(raw) as Record<string, unknown>
  }
  catch {
    return { changed: false }
  }
  const scripts = manifest.scripts
  if (typeof scripts !== 'object' || scripts === null) return { changed: false }
  const dev = (scripts as Record<string, unknown>).dev
  if (typeof dev !== 'string' || !PLAIN_NUXT_DEV.test(dev.trim())) return { changed: false }
  if (Object.values(scripts as Record<string, unknown>).some(s => typeof s === 'string' && s.includes('convex dev'))) return { changed: false }
  if (!isDeclaredDependency('convex', rootDir)) return { changed: false }

  const to = combinedDevScript(dev.trim())
  ;(scripts as Record<string, unknown>).dev = to
  const indent = raw.match(/^[ \t]+(?=")/m)?.[0] ?? '  '
  const newline = raw.endsWith('\n') ? '\n' : ''
  writeFileSync(path, JSON.stringify(manifest, null, indent) + newline)
  return { changed: true, from: dev, to }
}
