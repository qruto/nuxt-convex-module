import { type App, hasInjectionContext, inject, type InjectionKey, provide } from 'vue'

/**
 * The consumer's generated Convex `api` object (`#convex/api`). Its exact shape
 * is app-specific, so it's kept loose here — composables and components cast the
 * namespaces they consume (`api.billing`, `api.email`, …) to the precise
 * `FunctionReference` types they expect.
 */
export type ConvexApi = Record<string, Record<string, unknown>>

// Public API: exported for downstream apps that inject the key directly; no in-repo consumer.
// fallow-ignore-next-line unused-export
export const ConvexApiKey: InjectionKey<ConvexApi> = Symbol('nuxt-convex-module:api')

/**
 * Make the generated Convex `api` available to every `nuxt-convex-module` composable
 * and component, so `useBilling()`, `<CheckoutLink>`, `useEmailStatus()`, … work
 * with zero arguments.
 *
 * The packaged Nuxt plugin calls this automatically with `#convex/api`. Call it
 * yourself (e.g. with a custom `api`) only to override that default — pass the
 * Nuxt `vueApp` so the binding is available during SSR too:
 *
 * ```ts
 * export default defineNuxtPlugin((nuxtApp) => {
 *   provideConvexApi(api, nuxtApp.vueApp)
 * })
 * ```
 */
export function provideConvexApi(api: ConvexApi, app?: App): void {
  if (app) app.provide(ConvexApiKey, api)
  else provide(ConvexApiKey, api)
}

/**
 * The injected generated `api`, or `undefined` when it hasn't been provided
 * (e.g. outside a setup context, or before Convex codegen has run). Prefer
 * {@link useConvexNamespace} for feature access.
 */
export function useConvexApi(): ConvexApi | undefined {
  if (!hasInjectionContext()) return undefined
  return inject(ConvexApiKey, undefined)
}

/**
 * The named function group from the generated `api` (e.g. `'billing'`,
 * `'email'`), or `undefined` when billing/email isn't scaffolded — letting the
 * feature degrade to a graceful no-op rather than throwing.
 *
 * @typeParam T - The expected shape of the namespace's function references.
 */
export function useConvexNamespace<T = Record<string, unknown>>(name: string): T | undefined {
  const api = useConvexApi()
  const namespace = api?.[name]
  return namespace as T | undefined
}
