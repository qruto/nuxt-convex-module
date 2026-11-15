/**
 * Vue building blocks that the sign-in methods use to expose their state as
 * composables: a port of `@convex-dev/auth`'s `react/methods.ts`. This module
 * is internal: it is not a public entry point, and apps do not use it.
 *
 * An ambient sign-in publishes its actions and status from its client
 * (passed to `provideConvexAuth`'s `ambientSignIns` option); its composables
 * read them back with {@link useAmbientSignInValue}.
 */
import { inject, onScopeDispose, shallowRef, type ShallowRef } from 'vue'
import { AuthClientKey } from './client'

/**
 * Subscribe to a value published by the ambient sign-in registered as `id`
 * (the same scope its setup writes through). Holds `undefined` when nothing
 * is registered at `key`, typically meaning the sign-in wasn't passed to
 * `provideConvexAuth`'s `ambientSignIns` option, which the composables of a
 * provider should surface as an error.
 */
export function useAmbientSignInValue<T>(
  id: string,
  key: string,
): ShallowRef<T | undefined> {
  const client = inject(AuthClientKey, undefined)
  if (client === undefined) {
    throw new Error(
      'useAmbientSignInValue must be used below `provideConvexAuth` (or within a <ConvexAuthProvider>).',
    )
  }
  const values = client.ambientSignInValues(id)
  // The values are already published during SSR, so the server reads the
  // same thing.
  const value = shallowRef(values.get<T>(key))
  if (!import.meta.server) {
    onScopeDispose(values.subscribe(key, () => {
      value.value = values.get<T>(key)
    }))
  }
  return value
}
