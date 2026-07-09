import { afterEach, describe, expect, it, vi } from 'vitest'

// The base client plugin (registered only when no auth integration owns the
// client) is never exercised by the repo's own Nuxt test app, because
// `@convex-dev/better-auth` is a devDep and so always auto-enables there. Drive
// the plugin's setup directly with a stubbed `#app` to cover the no-auth path.
const runtimeConfig = { public: { backend: { url: 'https://example.convex.cloud' } } }

vi.mock('#app', () => ({
  // Handles both plugin forms: the plugin under test uses the named object
  // form, so unwrap its `setup`.
  defineNuxtPlugin: (plugin: unknown) =>
    typeof plugin === 'function' ? plugin : (plugin as { setup: unknown }).setup,
  useRuntimeConfig: () => runtimeConfig,
}))

const { ConvexVueClient, ConvexClientKey } = await import('../../src/runtime/vue/client')
const pluginMod = await import('../../src/runtime/vue/plugin')
const runPlugin = pluginMod.default as unknown as (app: {
  vueApp: { provide: (key: unknown, value: unknown) => void }
}) => void

function fakeNuxtApp() {
  const provided = new Map<unknown, unknown>()
  return {
    provided,
    app: { vueApp: { provide: (k: unknown, v: unknown) => provided.set(k, v) } },
  }
}

afterEach(() => {
  runtimeConfig.public.backend.url = 'https://example.convex.cloud'
})

describe('base Convex client plugin', () => {
  it('provides a ConvexVueClient via ConvexClientKey when a URL is configured', () => {
    const { provided, app } = fakeNuxtApp()
    runPlugin(app)
    expect(provided.get(ConvexClientKey)).toBeInstanceOf(ConvexVueClient)
  })

  it('no-ops when no Convex URL is configured', () => {
    runtimeConfig.public.backend.url = ''
    const { provided, app } = fakeNuxtApp()
    runPlugin(app)
    expect(provided.size).toBe(0)
  })
})
