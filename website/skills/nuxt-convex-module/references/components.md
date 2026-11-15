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

Client side: `useRateLimit(api.example.getRateLimit, { getServerTimeMutation: api.example.getServerTime, count: 1 })` → `{ status, check }`. `status` is a ref: `undefined` while loading, then `{ ok: true }` or `{ ok: false, retryAt }` in browser time, and it turns back to `ok` when `retryAt` passes. The options can be a ref or a getter. `check(ts?, count?)` returns the value at a given time. The server still enforces the limit with `rateLimiter.limit(ctx, …)`.

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
