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
    // Playground demo components and DevTools panel pages use short,
    // single-word names by design.
    {
      files: ['website/**/*.vue', 'client/**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off',
      },
    },
    // The runtime mirrors upstream convex/react code shape verbatim (see
    // AGENTS.md's migration contract) — rewriting upstream lines to satisfy
    // these rules breaks side-by-side diffability for no runtime benefit:
    // dynamic `delete` on page-key records, `any` in upstream type
    // constraints and `makeFunctionReference<..., any, any>` calls, the
    // `: {}` conditional-type branch in `withOptimisticUpdate`, plain
    // `new Error` where the rule wants `TypeError`, and upstream doc comments
    // whose `@param` names describe rest-parameter contents.
    {
      files: ['src/runtime/**'],
      rules: {
        '@typescript-eslint/no-dynamic-delete': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-empty-object-type': 'off',
        'unicorn/prefer-type-error': 'off',
        'jsdoc/check-param-names': 'off',
      },
    },
  )
