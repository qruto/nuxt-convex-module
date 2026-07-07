// Shared between the module (server side of the DevTools RPC) and the panel
// app in `devtools-client-app/` (browser side) — keep this file dependency-free.

export const RPC_NAMESPACE = 'nuxt-convex-kit'

/** Route the panel iframe is served under (sirv when built, proxy in dev). */
export const DEVTOOLS_UI_ROUTE = '/__nuxt-convex-kit'

/** Port `pnpm dev:devtools-client` runs the panel dev server on (3300 is nuxt/fonts'). */
export const DEVTOOLS_UI_LOCAL_PORT = 3630

/**
 * Build-time facts only the dev server knows — everything live (connection,
 * queries, auth, logs) flows through the in-page bridge instead, since Convex
 * client state lives in the inspected app's browser context, not in Node.
 */
export interface DevtoolsServerInfo {
  /** Resolved Convex deployment URL ('' when unconfigured). */
  url: string
  /** Resolved Convex `.site` URL ('' when unconfigured). */
  siteUrl: string
  /** Functions dir relative to the app root (e.g. `convex`). */
  functionsDir: string
  rootDir: string
  integrations: {
    betterAuth: boolean
    clerk: boolean
    auth0: boolean
    polar: boolean
  }
}

/** Called from the panel iframe, executed in the Nuxt dev server. */
export interface ServerFunctions {
  getInfo(): DevtoolsServerInfo
  /** Map a udfPath (`"messages:list"`) to its source file for open-in-editor. */
  resolveFunctionSource(udfPath: string): { filepath?: string }
}

/** None yet — browser state reaches the panel via the bridge, not birpc. */
export type ClientFunctions = Record<string, never>
