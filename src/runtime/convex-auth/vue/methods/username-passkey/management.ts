/**
 * The shared bodies of the passkey-management composables, `useAddPasskey`
 * and `useRemovePasskey`. Each entry point binds them to the ceremonies of
 * its platform. A port of `@convex-dev/auth`'s
 * `methods/username-passkey/management/react.tsx`.
 *
 * There is no list composable: `listPasskeys` is a plain reactive query, so
 * a page simply reads it with `useQuery(api.auth.listPasskeys, {})`.
 */
import type { Ref } from 'vue'
import { useConvexOrThrow } from '../../../../vue/client'
import type { ResolvedPasskeyCeremonies } from '../../../upstream/methods/username-passkey/ceremonies'
import {
  runAddPasskeyFlow,
  runRemovePasskeyFlow,
  type AddPasskeyApi,
  type AddPasskeyFlowResult,
  type ManagementFlowContext,
  type RemovePasskeyApi,
  type RemovePasskeyFlowResult,
} from '../../../upstream/methods/username-passkey/management/flows'
import {
  usePasskeyCeremonySlot,
  type AlreadyPendingFailure,
} from './impl'

export type { AlreadyPendingFailure } from './impl'
export type { AddPasskeyApi, RemovePasskeyApi } from '../../../upstream/methods/username-passkey/management/flows'

export type AddPasskeyResult = AddPasskeyFlowResult | AlreadyPendingFailure

export type RemovePasskeyResult
  = RemovePasskeyFlowResult | AlreadyPendingFailure

/**
 * The body of `useAddPasskey`, for the given platform.
 *
 * @param managementApi The passkey-management functions, usually `api.auth`.
 * @param ceremonies The passkey ceremonies of the platform.
 */
export function useAddPasskeyImpl(
  managementApi: AddPasskeyApi,
  ceremonies: ResolvedPasskeyCeremonies,
): {
  /**
   * Adds a passkey to the account of the signed-in user.
   *
   * Returns an object with a `success` boolean flag. If it is `false`,
   * the object has a `userError` field that tells why.
   */
  addPasskey: () => Promise<AddPasskeyResult>
  /** `true` while an `addPasskey` call is running. */
  pending: Ref<boolean>
} {
  const convex = useConvexOrThrow('useAddPasskey')

  const { run, pending } = usePasskeyCeremonySlot({
    // Not a log in page, so there is no autofill here
    autofill: null,
  })

  const ctx: ManagementFlowContext<AddPasskeyApi> = {
    // The flows only call `mutation`, which the Vue client has.
    convex: convex as unknown as ManagementFlowContext<AddPasskeyApi>['convex'],
    api: managementApi,
    ceremonies,
  }

  const addPasskey = (): Promise<AddPasskeyResult> => run(() => runAddPasskeyFlow(ctx))

  return { addPasskey, pending }
}

/**
 * The body of `useRemovePasskey`, for the given platform.
 *
 * @param managementApi The passkey-management functions, usually `api.auth`.
 * @param ceremonies The passkey ceremonies of the platform.
 */
export function useRemovePasskeyImpl(
  managementApi: RemovePasskeyApi,
  ceremonies: ResolvedPasskeyCeremonies,
): {
  /**
   * Removes the given passkey from the account of the signed-in user.
   *
   * Returns an object with a `success` boolean flag. If it is `false`,
   * the object has a `userError` field that tells why.
   */
  removePasskey: (passkeyId: string) => Promise<RemovePasskeyResult>
  /** `true` while a `removePasskey` call is running. */
  pending: Ref<boolean>
} {
  const convex = useConvexOrThrow('useRemovePasskey')
  const { run, pending } = usePasskeyCeremonySlot({ autofill: null })

  const ctx: ManagementFlowContext<RemovePasskeyApi> = {
    convex: convex as unknown as ManagementFlowContext<RemovePasskeyApi>['convex'],
    api: managementApi,
    ceremonies,
  }

  const removePasskey = (passkeyId: string): Promise<RemovePasskeyResult> =>
    run(() => runRemovePasskeyFlow(ctx, { passkeyId }))

  return { removePasskey, pending }
}
