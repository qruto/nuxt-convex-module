// Re-render the codegen-guarded templates when `convex dev` emits its output.
// Off the module entry for the same reason as options.ts. Tests import this
// file directly.
import { updateTemplates } from '@nuxt/kit'
import { join } from 'node:path'
import type { Nuxt } from '@nuxt/schema'
import { resolveFunctionsDir } from './functions-dir'

/** Templates that must re-render when `convex dev` emits `_generated/api`. */
export const CODEGEN_GUARDED_TEMPLATES = ['nuxt-convex-module-provide-api.mjs', 'types/nuxt-convex-module-api-fallback.d.ts']

/**
 * In dev, re-render the codegen-guarded templates the instant `convex dev`
 * emits `_generated/api`, so the generated `api` is wired app-wide (and the
 * placeholder types retire) without a dev-server restart — the fs-guarded
 * templates otherwise only re-evaluate on a full rebuild.
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
  nuxt.hook('builder:watch', async (_event, path) => {
    if (!path.replace(/\\/g, '/').includes('_generated/api')) return
    await updateTemplates({ filter: template => CODEGEN_GUARDED_TEMPLATES.includes(template.filename) })
  })
}
