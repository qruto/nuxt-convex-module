// pnpm 11 and later stop an install until every dependency build script is
// approved or denied. This hook answers for the scripts this app and Nuxt's
// official modules bring: esbuild, better-sqlite3 (@nuxt/content),
// unrs-resolver (@nuxt/eslint) and vue-demi (@nuxt/ui). Their packages already
// ship what those scripts build or check, so the answer is no and none of them
// runs. An answer in your own pnpm settings wins, and any other build script
// still stops the install. npm, Yarn and Bun ignore this file.
//
// To keep these answers in plain config instead, delete this file and move them
// to `allowBuilds` in a pnpm-workspace.yaml. A template can't ship that file:
// `create nuxt` treats it as a pnpm-only template.
export const hooks = {
  updateConfig(config) {
    return {
      ...config,
      allowBuilds: {
        'esbuild': false,
        'better-sqlite3': false,
        'unrs-resolver': false,
        'vue-demi': false,
        ...config.allowBuilds,
      },
    }
  },
}
