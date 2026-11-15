import { expectTypeOf } from 'vitest'
import type { WireAuthenticationResponse, WireCreationOptions, WireRegistrationResponse, WireRequestOptions } from '../../src/runtime/convex-auth/upstream/components/passkey/validation'
import type { FinishAddPasskeyResult, StartAddPasskeyResult, VerifyAddPasskeyResult } from '../../src/runtime/convex-auth/upstream/methods/username-passkey/management/add'
import type { FinishRemovePasskeyResult, StartRemovePasskeyResult } from '../../src/runtime/convex-auth/upstream/methods/username-passkey/management/remove'
import type { RenamePasskeyResult } from '../../src/runtime/convex-auth/upstream/methods/username-passkey/management/rename'

// The copied passkey files import these types from files `@convex-dev/auth`
// does not export. The shims read them off the method's server entry. A
// derivation that stops matching resolves to `never`, which type-checks
// everywhere, so each one is pinned to a field only the real shape has.
expectTypeOf<WireRequestOptions['challenge']>().toEqualTypeOf<string>()
expectTypeOf<WireRequestOptions>().toHaveProperty('allowCredentials')
expectTypeOf<WireCreationOptions['rp']['id']>().toEqualTypeOf<string>()
expectTypeOf<WireRegistrationResponse['response']['attestationObject']>().toEqualTypeOf<string>()
expectTypeOf<WireAuthenticationResponse['response']['signature']>().toEqualTypeOf<string>()
expectTypeOf<StartAddPasskeyResult['success']>().toEqualTypeOf<boolean>()
expectTypeOf<VerifyAddPasskeyResult['success']>().toEqualTypeOf<boolean>()
expectTypeOf<FinishAddPasskeyResult['success']>().toEqualTypeOf<boolean>()
expectTypeOf<StartRemovePasskeyResult['success']>().toEqualTypeOf<boolean>()
expectTypeOf<FinishRemovePasskeyResult['success']>().toEqualTypeOf<boolean>()
expectTypeOf<RenamePasskeyResult['success']>().toEqualTypeOf<boolean>()
