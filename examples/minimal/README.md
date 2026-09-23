# Minimal Nuxt + Convex example

A realtime message list: SSR-rendered with `useAsyncQuery`, live-updating over
WebSocket, with a `useMutation` form — everything auto-imported by
[`nuxt-convex-module`](https://github.com/qruto/nuxt-convex-module).

## Run it

Create a project from this directory, then start it:

```sh
pnpm create nuxt@latest my-app -t gh:qruto/nuxt-convex-module/examples/minimal
cd my-app
pnpm dev
```

In a copy you already have, run `npm install` and `npm run dev` instead.

`pnpm dev` is `convex dev --start 'nuxt dev'` — the script the module writes
into a fresh app on its first run. The Convex CLI creates or attaches a
deployment, starts codegen + sync, starts Nuxt beside it, and hands Nuxt the
deployment URL in the environment; nothing to copy into `.env`.

Open http://localhost:3000 — messages render on the server (view page source)
and update live in every tab.
