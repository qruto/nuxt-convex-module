/**
 * nuxt-og-image calls `nuxt-og-image:context` on the Nitro app before every
 * card render but declares no hook type, so a plugin listening to it does not
 * type-check. The fields are the ones server/plugins/og-image-page-description.ts
 * reads (the module's own `OgImageRenderEventContext` has more). Lives in
 * `shared/` because the plugin is Nitro code: the server project includes
 * `shared/**\/*.d.ts` but not `app/types`.
 */
import type { H3Event } from 'h3'

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'nuxt-og-image:context': (ctx: {
      e: H3Event
      basePath: string
      options: { component?: string, props?: Record<string, unknown> }
    }) => void | Promise<void>
  }
}

export {}
