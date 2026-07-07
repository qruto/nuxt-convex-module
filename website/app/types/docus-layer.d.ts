/**
 * Type shims for the docus layer.
 *
 * docus's app code reads `useRuntimeConfig().public.i18n` unconditionally,
 * but it only registers @nuxtjs/i18n — whose types declare that key — when
 * the consuming app configures `i18n`. This site doesn't, so load the
 * module's runtime-config types directly to type-check the layer sources.
 * Keep the dependency range in sync with docus.
 *
 * @nuxtjs/i18n itself only augments `@nuxt/schema`, while app composables
 * such as `useRuntimeConfig` type against `nuxt/schema` — a separate
 * interface symbol that Nuxt's schema bridge does not cover for
 * `PublicRuntimeConfig` — so the augmentation is mirrored there.
 */
import type { ModulePublicRuntimeConfig } from '@nuxtjs/i18n'

declare module 'nuxt/schema' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- the empty extends IS the augmentation
  interface PublicRuntimeConfig extends ModulePublicRuntimeConfig {}
}

/**
 * nuxt-og-image's generated `OgImageComponents` interface omits the plain
 * `Docs` alias because docus and the bundled community templates both ship
 * a `Docs.takumi.vue` (the alias is only emitted for unambiguous base
 * names). At runtime `defineOgImage('Docs', …)` resolves to the docus
 * template — app components take precedence over community ones — so
 * declare that alias here.
 */
declare module '#og-image/components' {
  interface OgImageComponents {
    Docs: typeof import('docus/app/components/OgImage/Docs.takumi.vue')['default']
  }
}
