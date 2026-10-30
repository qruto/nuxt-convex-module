// Watch the directory `convex dev` writes its codegen to. Off the module
// entry for the same reason as options.ts. Tests import this file directly.
import { join } from 'node:path'
import type { Nuxt } from '@nuxt/schema'
import { resolveFunctionsDir } from './functions-dir'

/**
 * In dev, have Nuxt watch the directory `convex dev` emits `_generated/api`
 * to, so the fallback type template (whose `dependsOn` matches that path)
 * re-renders the instant codegen lands and the placeholder types retire
 * without a dev-server restart.
 *
 * Nuxt's watcher covers each layer's `srcDir` (`app/` in a Nuxt 4 layout),
 * `server/`, and whatever `nuxt.options.watch` names. A root-level `convex/`
 * is outside the first two, so the generated directory is added to the third
 * — the same thing Nuxt's own components module does for a component
 * directory outside `srcDir`. Pushing `_generated` rather than `convex/`
 * means: when it already exists, `api.js` events fire directly; when it does
 * not, chokidar watches the parent for it and its creation is an `addDir` on
 * the exact path, which Nuxt answers with a soft restart — after which setup
 * runs again with codegen present. Changes inside it never restart (Nuxt
 * restarts only on an event path equal to a `watch` entry).
 */
export function watchConvexCodegen(nuxt: Nuxt): void {
  if (!nuxt.options.dev) return
  const generatedDir = join(nuxt.options.rootDir, resolveFunctionsDir(nuxt.options.rootDir), '_generated')
  if (!nuxt.options.watch.includes(generatedDir)) nuxt.options.watch.push(generatedDir)
}
