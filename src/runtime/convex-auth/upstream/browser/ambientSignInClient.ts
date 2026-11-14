// PARITY: D-20. Not a copy. Upstream does not export its file of this name, so
// the types the copied files import from it are read off the public
// `AuthClientConfig`.
import type { AuthClientConfig } from '@convex-dev/auth/browser'

type AmbientSignIns = NonNullable<AuthClientConfig['ambientSignIns']>

export type AmbientSignInClient = AmbientSignIns['signIns'][number]
export type AuthSignInApi = AmbientSignIns['signInApi']
export type AmbientSignInContext = Parameters<AmbientSignInClient['setup']>[0]
