import { api } from '#convex/api'

// `preloadQuery` and `fetchQuery` are auto-imported in Nitro server code.
// `preloadQuery` returns a JSON-serializable `Preloaded` payload for
// `usePreloadedQuery`; `fetchQuery` is a plain one-shot read.
export default defineEventHandler(async () => {
  try {
    const [preloaded, count] = await Promise.all([
      preloadQuery(api.messages.list, {}),
      fetchQuery(api.messages.count, {}),
    ])
    return { preloaded, count }
  }
  catch {
    throw createError({
      statusCode: 503,
      statusMessage: 'Convex deployment unavailable',
      message:
        'The local Convex deployment is offline. Start it with `npx convex dev` in the website directory.',
    })
  }
})
