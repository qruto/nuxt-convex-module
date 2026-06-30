// @ts-check
import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

// Run `npx @eslint/config-inspector` to inspect the resolved config interactively
export default createConfigForNuxt({
  features: {
    // Rules for module authors
    tooling: true,
    // Rules for formatting
    stylistic: true,
  },
  dirs: {
    src: [
      './website',
    ],
  },
})
  .append(
    // `.agents/` holds AI tooling references (skill scripts, fetched examples),
    // not package source — exclude it from the project's lint rules.
    {
      ignores: ['.agents/**'],
    },
    // Playground demo components use short, single-word names by design.
    {
      files: ['website/**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
  )
