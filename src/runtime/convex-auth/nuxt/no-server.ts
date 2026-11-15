import type { ConvexAuthNuxt } from './server'

// What `#convex/auth-server` resolves to in an app with no
// `server/convex-auth.ts`. The module registers the handlers that import the
// alias only when that file exists, so nothing reads this value.
export default undefined as unknown as ConvexAuthNuxt
