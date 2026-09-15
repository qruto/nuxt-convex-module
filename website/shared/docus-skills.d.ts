/**
 * docus's skills module writes `runtimeConfig.skills = { catalog }` at
 * setup and declares no type for it, so Nuxt infers the catalog entries
 * from the value as `{}` and the module's own server routes fail to
 * type-check (`skills-files.ts` reads `s.name`). Mirror the module's
 * private `SkillEntry` shape; a derived interface may narrow the inferred
 * member. Lives in `shared/` because the routes are Nitro code: the
 * server project includes `shared/**\/*.d.ts` but not `app/types`.
 */
declare module 'nuxt/schema' {
  interface RuntimeConfig {
    skills: {
      catalog: Array<{ name: string, description: string, files: string[] }>
    }
  }
}

export {}
