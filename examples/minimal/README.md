# Minimal Nuxt + Convex example

A realtime message list: SSR-rendered with `useAsyncQuery`, live-updating over
WebSocket, with a `useMutation` form — everything auto-imported by
[`nuxt-convex-module`](https://github.com/qruto/nuxt-convex-module).

## Run it

```sh
npm install

# 1. Create/attach a Convex deployment and start codegen + sync:
npx convex dev
# → writes CONVEX_URL to .env.local

# 2. In a second terminal:
npm run dev
```

`npm run dev` is `nuxt dev --dotenv .env.local`: Nuxt doesn't read `.env.local`
by default, and that flag makes it both load *and watch* the file — so the app
picks the deployment up on its own, with nothing to copy across.

Open http://localhost:3000 — messages render on the server (view page source)
and update live in every tab.
