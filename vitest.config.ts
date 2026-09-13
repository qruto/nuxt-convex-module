import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

const nuxtImportsTestAlias = fileURLToPath(new URL('./test/helpers/nuxt-imports.ts', import.meta.url))
// The Better Auth runtime imports the app's client via `#convex/auth-client`
// (the module aliases it to the user's client or the bundled default). Tests
// resolve it to the bundled default and mock it where needed.
const authClientTestAlias = fileURLToPath(new URL('./src/runtime/better-auth/vue/client.ts', import.meta.url))

export default defineConfig({
  test: {
    // In CI, also write a JUnit report for Codecov (failure and flaky tracking)
    // and use the `github-actions` reporter, so a failure is annotated on the
    // failing line in the Files-changed view instead of only in a folded log.
    // Local runs keep the console reporter.
    reporters: process.env.CI
      ? ['default', 'github-actions', ['junit', { outputFile: 'test-report.junit.xml' }]]
      : ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text', 'json', 'lcov'],
      // e2e is excluded from this run (`--project '!e2e'`), so files only e2e
      // reaches — better-auth/nuxt/proxy.ts, the module's register* functions —
      // show 0% here. That is a measurement artifact, not an untested path:
      // both fixtures install the module and the proxy answers real requests.
      // Lock in the current baseline (a small margin below the measured numbers)
      // so a regression fails CI without being brittle. Raise these as coverage
      // climbs; the harder build-time/runtime files (module, auth plugins/
      // middleware) keep the global ceiling modest for now.
      thresholds: {
        statements: 84,
        branches: 77,
        functions: 85,
        lines: 85,
      },
    },
    projects: [
      {
        // A plain Vue app: no Nuxt aliases and, above all, no `define` — in a
        // consumer's Vite build neither `import.meta.client` nor
        // `import.meta.server` exists, and the `/vue` entries advertised as
        // Nuxt-free have to work with both undefined. Neither other project can
        // express that: `unit` defines client true, `unit-server` defines both.
        test: {
          name: 'plain-vue',
          include: ['test/plain-vue/**/*.{test,spec}.ts'],
          environment: 'happy-dom',
        },
      },
      {
        resolve: {
          alias: {
            '#imports': nuxtImportsTestAlias,
            '#convex/auth-client': authClientTestAlias,
          },
        },
        // The plain unit project is the client build: `import.meta.client`
        // compiles truthy (and `import.meta.server` stays undefined → falsy),
        // so client-only branches — e.g. the base plugin's missing-URL warning
        // — get real coverage. The unit-server project below inverts both.
        define: {
          'import.meta.client': 'true',
        },
        test: {
          name: 'unit',
          include: ['test/unit/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      {
        resolve: {
          alias: {
            '#imports': nuxtImportsTestAlias,
            '#convex/auth-client': authClientTestAlias,
          },
        },
        // `import.meta.server` is compile-time: the plain unit project compiles
        // it falsy (client build), this project compiles it truthy the same way
        // Nuxt's server bundle does — so SSR-only branches get real coverage.
        define: {
          'import.meta.server': 'true',
          'import.meta.client': 'false',
          // The server bundle in its static-generation flavour. Nothing else
          // under src/ reads the flag, so the SSR guards above are unaffected.
          'import.meta.prerender': 'true',
        },
        test: {
          name: 'unit-server',
          include: ['test/unit-server/**/*.{test,spec}.ts'],
          environment: 'node',
        },
      },
      await defineVitestProject({
        resolve: {
          alias: {
            '#convex/auth-client': authClientTestAlias,
          },
        },
        test: {
          name: 'nuxt',
          include: ['test/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          setupFiles: ['./test/setup/websocket.ts'],
          environmentOptions: {
            nuxt: {
              rootDir: fileURLToPath(new URL('.', import.meta.url)),
              domEnvironment: 'happy-dom',
            },
          },
        },
      }),
      {
        // End-to-end: builds the fixture apps with @nuxt/test-utils/e2e and
        // exercises the module against a real Nitro server. Each fixture build
        // takes on the order of a minute, so the default scripts exclude this
        // project (`--project '!e2e'`) — run it via `pnpm test:e2e` (own CI step).
        test: {
          name: 'e2e',
          include: ['test/e2e/**/*.{test,spec}.ts'],
          environment: 'node',
          testTimeout: 120_000,
          hookTimeout: 300_000,
          // Fixture builds share .nuxt/dist paths per rootDir; keep files sequential.
          fileParallelism: false,
        },
      },
    ],
  },
})
