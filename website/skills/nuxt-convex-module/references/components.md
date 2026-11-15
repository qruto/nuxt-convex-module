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
