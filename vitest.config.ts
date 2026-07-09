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
    // In CI, also emit a JUnit report for Codecov Test Analytics (flaky/failure
    // tracking). Local runs keep the default console reporter only.
    reporters: process.env.CI
      ? ['default', ['junit', { outputFile: 'test-report.junit.xml' }]]
      : ['default'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      reporter: ['text', 'json', 'lcov'],
      // Lock in the current baseline (a small margin below the measured numbers)
      // so a regression fails CI without being brittle. Raise these as coverage
      // climbs; the harder build-time/runtime files (module, auth plugins/
      // middleware) keep the global ceiling modest for now.
      thresholds: {
        statements: 75,
        branches: 68,
        functions: 75,
        lines: 75,
      },
    },
    projects: [
      {
        resolve: {
          alias: {
            '#imports': nuxtImportsTestAlias,
            '#convex/auth-client': authClientTestAlias,
          },
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
    ],
  },
})
