# Nuxt + Convex playground

A small live message board — SSR-rendered with `useAsyncQuery`, updating over a
WebSocket subscription, writing through `useMutation`, with a connection pill
driven by `useConvexConnectionState`. Everything is auto-imported by
[`nuxt-convex-module`](https://github.com/qruto/nuxt-convex-module).

This is the app behind the **Open in StackBlitz** link on every pull request. Its
job is to wire that pull request's build of the module into a real Nuxt app so
you can try a change without setting one up. The badge in the header shows which
build is installed, so you can confirm you are exercising that commit rather than
the npm release.

The backend is yours. Nothing is hosted for you, and nothing needs to run Convex
in the sandbox.

## Point it at your deployment

**1. Add your deployment URL.** `.env.local` is already here, holding the one
line this app needs. Uncomment it, put your URL in place of the example, save:

```sh
CONVEX_URL=https://your-deployment.convex.cloud
```

`npm run dev` is `nuxt dev --dotenv .env.local`, which both loads *and watches*
that file — so the page turns from its setup panel into the live demo the moment
you save, with no restart. (Nuxt does not read `.env.local` without that flag,
which is the usual stumbling block: it is the file the Convex CLI writes to.)

Two details there are deliberate, and both bite once rather than teaching
themselves. The line is *commented out* rather than left empty to fill in,
because a variable that is defined but empty when the dev server starts stays
empty for the life of that process — dotenv will not overwrite a variable that
already exists — so filling it in afterwards would quietly do nothing. And the
name is *unprefixed*, because `NUXT_PUBLIC_CONVEX_URL` is Nuxt's runtime-override
channel: an empty one would still be a defined variable, and Nitro would apply
it at request time and blank the URL back out on an app that is configured
correctly. Given a real URL it wins, which is how you would point a deployed
build at a deployment; `nuxt.config.ts` reads both names.

**2. Give that deployment this app's functions.** They are `convex/schema.ts` and
`convex/messages.ts` — a `messages` table, a `list` query and a `send` mutation,
about twenty lines together. Push them from wherever you already run Convex:

```sh
npx convex deploy
```

If you would rather use functions your deployment already has, edit
`components/MessageBoard.vue` to call them instead. `api` is typed from
`convex/_generated`, so your editor autocompletes whatever is there — `nuxt
prepare` runs on install, so that works straight away.

## What to try

- Open the page in two tabs and send a message — both update without a refresh.
- View source: the messages are in the server-rendered HTML, not fetched after
  hydration.
- Take the deployment offline; the pill drops to `connecting` and recovers on its
  own. Send a message while it is down: the button holds at *Sending…* because
  the mutation is still outstanding, and it lands once the socket is back.
- Add a field to `convex/schema.ts` and a function to `convex/messages.ts`, then
  `npm run convex` (`convex dev`) if you are running this locally — the codegen
  refreshes and the new function is typed at the call site immediately.

## Relationship to `examples/minimal`

[`examples/minimal`](../minimal) is the smallest thing that works, kept short
enough to read in one screen. This app is deliberately larger: it has to be
useful for checking that a change actually behaves in a real Nuxt app.
