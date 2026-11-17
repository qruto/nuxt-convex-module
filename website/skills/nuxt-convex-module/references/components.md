# Convex components

Each component's client switches on when its package is in the app's `package.json`. Nothing goes in `nuxt.config.ts`. The Convex side is the component's own setup: `app.use(…)` in `convex/convex.config.ts`, then the functions below.

## Rate Limiter

```bash
npm i @convex-dev/rate-limiter@~0.4.0
```

Convex side: a `RateLimiter` over `components.rateLimiter`, and the two functions the composable reads:

```ts
// convex/example.ts
export const { getRateLimit, getServerTime } = rateLimiter.hookAPI('sendMessage', {
  key: async ctx => await getUserId(ctx),
})
```

Client side: `useRateLimit(api.example.getRateLimit, { getServerTimeMutation: api.example.getServerTime, count: 1 })` → `{ status, check }`. `status` is a ref: `undefined` while loading, then `{ ok: true }` or `{ ok: false, retryAt }` in browser time, and it turns back to `ok` when `retryAt` passes. The options can be a ref or a getter. `check(ts?, count?)` returns the value at a given time. The server still enforces the limit with `rateLimiter.limit(ctx, …)`. A mutation that throws on the limit fails with an error `isRateLimitError(error)` recognises (auto-imported; `error.data.retryAfter` is the wait in ms).

Docs: https://nuxt-convex-module.dev/raw/components/rate-limiter.md

## Presence

```bash
npm i @convex-dev/presence@~0.4.0
```

Convex side: `new Presence(components.presence)` and three functions in one module: `heartbeat` (args `roomId`, `userId`, `sessionId`, `interval`; check room access here), `list` (arg `roomToken`) and `disconnect` (arg `sessionToken`; no auth check, it is called over HTTP when the tab closes).

Client side: `usePresence(api.presence, roomId, userId)` → a ref of the room's users, current user first, `undefined` until the first heartbeat answers. `roomId` and `userId` can be refs or getters; a change leaves the old room. `<FacePile :presence-state="presenceState ?? []" />` renders avatars with the package's own stylesheet. The functions may live in any module: the tab-close beacon uses the `disconnect` reference given.

Docs: https://nuxt-convex-module.dev/raw/components/presence.md

## R2

```bash
npm i @convex-dev/r2@~0.10.0
```

Convex side: `new R2(components.r2)` with the bucket's `R2_*` environment variables (ask the user for them, never invent them), and `export const { generateUploadUrl, syncMetadata } = r2.clientApi<DataModel>({ checkUpload, onUpload })`.

Client side: `const uploadFile = useUploadFile(api.example)`, then `await uploadFile(file, { onProgress })` → the object's key. Do not import from `@convex-dev/r2/vue`: it needs the community `convex-vue` client. For Convex's own file storage use `useUpload` instead.

Docs: https://nuxt-convex-module.dev/raw/components/r2.md

## Text Streaming

```bash
npm i @convex-dev/persistent-text-streaming@~0.3.0
```

Convex side: `new PersistentTextStreaming(components.persistentTextStreaming)`, a query that returns `getStreamBody(ctx, streamId)`, and an HTTP action (usually `/chat-stream`) that calls `stream(ctx, request, streamId, writer)`.

Client side: `const stream = useStream(api.chat.getChatBody, new URL(`${useRuntimeConfig().public.convex.siteUrl}/chat-stream`), () => driven, () => streamId)` → a ref of `{ text, status }`. `driven` is true only in the browser that created the stream. An optional fifth argument `{ authToken, headers }` is read when a stream starts. No request is sent during server rendering.

Docs: https://nuxt-convex-module.dev/raw/components/persistent-text-streaming.md

## Convex Helpers (client side)

```bash
npm i convex-helpers@~0.1.135
```

The server helpers of `convex-helpers` work as they are. The module ports its React entries:

- Sessions: `provideSession({ ssrFriendly: true })` in `app.vue`, then `useSessionQuery`, `useSessionMutation`, `useSessionAction`, `useSessionPaginatedQuery`, which add `sessionId` to the arguments. The functions take `sessionId: vSessionId` from `convex-helpers/server/sessions`. `useSessionId()` → `[sessionIdRef, refresh, promiseRef]`. `useStorage` takes a composable returning a writable ref (VueUse `useLocalStorage` fits). For calls outside components, `convex: { convexHelpers: { sessionClient: true } }` makes `useConvex()` a `ConvexVueSessionClient` with `sessionQuery`, `sessionMutation`, `sessionAction`. `useConvex()` stays typed as the plain client: narrow it with `instanceof ConvexVueSessionClient` (from `nuxt-convex-module/convex-helpers/sessions`), and call it in setup, a plugin or a Pinia store, then pass the client on.
- Query cache: `provideConvexQueryCache()` in `app.vue`, then `import { useQuery, usePaginatedQuery } from 'nuxt-convex-module/convex-helpers/cache'` where the cache is wanted.
- Status query: `import { useQuery } from 'nuxt-convex-module/convex-helpers/client'` → a ref of `{ status, data, error, isSuccess, isPending, isError }`; `makeUseQueryWithStatus(useQueries)` for another `useQueries`.
- The `stream` and `paginator` server helpers: `usePaginatedQuery` from `nuxt-convex-module/convex-helpers/client`.

The cached and status `useQuery` / `useQueries` / `usePaginatedQuery` are not auto-imported, because they share the core names.

Docs: https://nuxt-convex-module.dev/raw/components/convex-helpers.md
