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
  // Every Nuxt app in the repo, so the Nuxt-aware rules know which auto-imports
  // and components exist in each (nuxt/starter#module-devtools registers its
  // `client/` app the same way).
  dirs: {
    src: [
      './website',
      './devtools-client-app',
    ],
  },
})
  .append(
    // `.agents/` holds AI tooling references (skill scripts, fetched examples),
    // not package source — exclude it from the project's lint rules. `.claude/`
    // is the same content seen through Claude Code's own skills directory,
    // which is symlinks back into `.agents/skills` (see
    // `scripts/link-agent-skills.mjs`), so it has to be ignored alongside it.
    // `.deepsec/` is the deepsec security-scanner workspace (its own
    // package.json/lockfile) — not package source either.
    {
      // `examples/` are standalone consumer apps (own package.json, import the
      // published package and Convex codegen output that only exists after
      // `npx convex dev`) — not lintable as part of this workspace.
      ignores: ['.agents/**', '.claude/**', '.deepsec/**', 'examples/**'],
    },
    // Playground demo components and DevTools panel pages use short,
    // single-word names by design.
    {
      files: ['website/**/*.vue', 'devtools-client-app/**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off',
        // The default of one attribute per line exists to keep long prop lists
        // readable. These apps are mostly inline SVG, where the attributes are
        // short positional values — `<linearGradient x1 y1 x2 y2>`, `<stop
        // offset stop-color>` — that read worse one per line, and the rule was
        // producing 70 warnings nobody was ever going to act on. Six is the
        // widest such element here; a seventh is a prop list and should wrap.
        'vue/max-attributes-per-line': ['warn', { singleline: { max: 6 } }],
      },
    },
    // Type-aware rules. `@nuxt/eslint-config` only wires the TypeScript program
    // in when `features.typescript.tsconfigPath` is set — and setting it turns
    // on the whole typed ruleset, including the `no-unsafe-*` family, which
    // fights the port (upstream's `any` in type constraints is deliberate, see
    // the block below). So the program is wired up here instead, for exactly
    // the six rules that catch a defect class nothing else in this repository
    // can see. Each of these needs the checker; none of them has a syntactic
    // approximation.
    //
    // Scoped to `src/` — the published surface, and the only tree the root
    // tsconfig includes. `src/` has no `.vue` files, so the glob is complete.
    // Cost: `pnpm lint` goes from ~4.6s to ~8.2s.
    {
      files: ['src/**/*.ts'],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      },
      rules: {
        // A promise nobody awaits: the failure is an unhandled rejection at
        // runtime, and in a Nuxt plugin that means a silently half-initialised
        // app rather than an error anyone sees.
        '@typescript-eslint/no-floating-promises': 'error',
        // An async function passed where a void-returning one is expected —
        // event handlers, `watch` callbacks. The rejection has nowhere to go.
        '@typescript-eslint/no-misused-promises': 'error',
        // `await` on a non-thenable: always a mistake, and usually a missing
        // call parenthesis.
        '@typescript-eslint/await-thenable': 'error',
        // `String(value)` / template interpolation on something whose
        // `toString` is `Object.prototype`'s — ships "[object Object]" into a
        // log line, a header or a URL.
        '@typescript-eslint/no-base-to-string': 'error',
        // Throwing a non-Error loses the stack, and `instanceof Error` guards
        // downstream stop matching.
        '@typescript-eslint/only-throw-error': 'error',
        // Calling something upstream has marked `@deprecated` — the earliest
        // possible warning that a ported file has drifted behind its source.
        '@typescript-eslint/no-deprecated': 'error',
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
