// PARITY: D-19
// A deploy that replaced the app's chunks under an open page leaves the
// lazily loaded Better Auth client (D-18) pointing at a chunk that is gone:
// every load asks for the same URL again, and it stays a 404. Upstream has no
// such load, the client is in the bundle. Nuxt reloads the page when a route's
// chunk fails on a navigation; this does the same for the client's chunk,
// once the build Nuxt serves now is not the one the page runs.
import { defineNuxtPlugin, reloadNuxtApp, useRuntimeConfig } from '#app'
import { onAuthClientLoadFailure } from '../vue/auth-client-loader'

/** The `builds/latest.json` Nuxt's app manifest writes, under the build assets dir, past any cache. */
function latestBuildURL(app: { baseURL: string, buildAssetsDir: string, cdnURL?: string }): string {
  const root = (app.cdnURL || app.baseURL).replace(/\/+$/, '')
  const dir = app.buildAssetsDir.replace(/^\/+/, '').replace(/\/+$/, '')
  return `${root}/${dir}/builds/latest.json?${Date.now()}`
}

/** Whether the server now serves a build other than `buildId`; `false` when it cannot say. */
async function replacedBuild(url: string, buildId: string): Promise<boolean> {
  try {
    // fallow-ignore-next-line security-sink -- the app's own build assets URL, from its runtime config, in the browser; verified 2026-11-09
    const response = await fetch(url, { cache: 'no-store' })
    if (!response.ok) return false
    const latest = await response.json() as { id?: unknown }
    return typeof latest.id === 'string' && latest.id !== buildId
  }
  catch {
    return false
  }
}

export default defineNuxtPlugin({
  name: 'nuxt-convex-module:better-auth:chunk-reload',
  setup(nuxtApp) {
    const { app } = useRuntimeConfig()
    // What Nuxt reported through `app:chunkError`: a failed import, as the
    // build's preload helper saw it, and not a module that threw as it ran.
    const chunkErrors = new WeakSet<object>()
    nuxtApp.hook('app:chunkError', ({ error }) => {
      if (typeof error === 'object' && error !== null) chunkErrors.add(error)
    })
    let checking = false
    onAuthClientLoadFailure((error) => {
      if (checking) return
      checking = true
      // A dropped request is what the loader's next try recovers from: the
      // page reloads only once the server says the build moved on. The check
      // also lets `app:chunkError`, which Nuxt calls after the event, run first.
      void replacedBuild(latestBuildURL(app), app.buildId).then((replaced) => {
        checking = false
        // `reloadNuxtApp` keeps the `nuxt:reload` guard in sessionStorage: a
        // page that fails the same way after the reload is not reloaded again.
        if (replaced && typeof error === 'object' && error !== null && chunkErrors.has(error)) reloadNuxtApp()
      })
    })
  },
})
