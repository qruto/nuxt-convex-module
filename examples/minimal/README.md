# Minimal Nuxt + Convex example

A realtime message list: SSR-rendered with `useAsyncQuery`, live-updating over
WebSocket, with a `useMutation` form — everything auto-imported by
[`nuxt-convex-module`](https://github.com/qruto/nuxt-convex-module).

## Run it

```sh
npm install

# 1. Create/attach a Convex deployment and start codegen + sync:
npx convex dev
# → writes CONVEX_URL / NUXT_PUBLIC_CONVEX_URL to .env.local

# 2. Nuxt doesn't load .env.local — copy the URL across once:
grep NUXT_PUBLIC_CONVEX_URL .env.local >> .env

# 3. In a second terminal:
npm run dev
```

Open http://localhost:3000 — messages render on the server (view page source)
and update live in every tab.
