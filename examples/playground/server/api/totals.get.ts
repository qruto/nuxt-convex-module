import { api } from '#convex/api'

// A Nitro route reading Convex over HTTP with `fetchQuery`, which the module
// auto-imports in server code. Use it for API handlers, webhooks and
// middleware; pages read with `useAsyncQuery` instead.
export default defineEventHandler(async () => {
  const [clicks, posts, files] = await Promise.all([
    fetchQuery(api.counters.get, { name: 'clicks' }),
    fetchQuery(api.counters.get, { name: 'posts' }),
    fetchQuery(api.counters.get, { name: 'files' }),
  ])
  return { clicks, posts, files, at: new Date().toISOString() }
})
