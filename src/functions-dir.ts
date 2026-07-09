import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { useLogger } from '@nuxt/kit'

/** Scoped, silenceable build-time logger (consola) for this module. */
const logger = useLogger('nuxt-convex-module')

const DEFAULT_FUNCTIONS_DIR = 'convex'

/**
 * Resolve the Convex functions directory for a project, mirroring how the
 * Convex CLI resolves it: the `functions` field in `convex.json` wins,
 * otherwise the `convex/` default. Used to build the `#convex/*` import
 * aliases.
 */
export function resolveFunctionsDir(rootDir: string): string {
  return readFunctionsDirFromConvexJson(join(rootDir, 'convex.json')) ?? DEFAULT_FUNCTIONS_DIR
}

/**
 * Whether `convex dev` (codegen) has emitted the generated `api` module for a
 * project — the fs-guard shared by the provide-api plugin template, the
 * fallback type template, and the dev-time onboarding notice.
 */
export function hasGeneratedApi(rootDir: string, functionsDir: string = resolveFunctionsDir(rootDir)): boolean {
  const generatedApi = join(rootDir, functionsDir, '_generated', 'api')
  return existsSync(`${generatedApi}.d.ts`) || existsSync(`${generatedApi}.js`)
}

function readFunctionsDirFromConvexJson(convexJsonPath: string): string | undefined {
  if (!existsSync(convexJsonPath)) {
    return
  }

  try {
    const convexJson = JSON.parse(readFileSync(convexJsonPath, 'utf-8')) as { functions?: unknown }
    if (typeof convexJson.functions !== 'string') {
      return
    }
    return normalizeFunctionsDir(convexJson.functions)
  }
  catch (error) {
    logger.warn(`Failed to parse convex.json: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function normalizeFunctionsDir(functionsDir: string): string | undefined {
  const normalized = functionsDir
    .replace(/^\.?\//, '')
    .replace(/\/+$/, '')
  return normalized || undefined
}
