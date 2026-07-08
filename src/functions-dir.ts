import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DEFAULT_FUNCTIONS_DIR = 'convex'
const ALT_FUNCTIONS_DIR = 'backend'

/**
 * Resolve the Convex functions directory for a project, mirroring how the
 * Convex CLI resolves it: the `functions` field in `convex.json` wins, then a
 * `convex/` or `backend/` directory if present, otherwise the `convex/`
 * default. Used to build the `#backend/*` import aliases.
 */
export function resolveFunctionsDir(rootDir: string): string {
  const configured = readFunctionsDirFromConvexJson(join(rootDir, 'convex.json'))
  if (configured) {
    return configured
  }

  if (existsSync(join(rootDir, DEFAULT_FUNCTIONS_DIR))) {
    return DEFAULT_FUNCTIONS_DIR
  }

  if (existsSync(join(rootDir, ALT_FUNCTIONS_DIR))) {
    return ALT_FUNCTIONS_DIR
  }

  return DEFAULT_FUNCTIONS_DIR
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
    console.warn(`[nuxt-convex-module] Failed to parse convex.json: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function normalizeFunctionsDir(functionsDir: string): string | undefined {
  const normalized = functionsDir
    .replace(/^\.?\//, '')
    .replace(/\/+$/, '')
  return normalized || undefined
}
