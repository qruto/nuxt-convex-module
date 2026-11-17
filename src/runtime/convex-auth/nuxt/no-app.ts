import type { ConvexAuthNuxtClientOptions } from '../vue/index'

// What `#convex/auth-app` resolves to in an app with no `app/convex-auth.ts`:
// the cookie-session plugin then uses upstream's defaults.
export default {} as ConvexAuthNuxtClientOptions
