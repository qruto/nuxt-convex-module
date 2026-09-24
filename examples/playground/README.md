# Nuxt Convex Playground

A small live message board built with [`nuxt-convex-module`](https://nuxt-convex-module.dev).
It is rendered on the server with `useAsyncQuery`, updates over a WebSocket,
writes through `useMutation`, and shows a connection pill driven by
`useConvexConnectionState`. Everything is auto-imported.

This is also the app behind the **Open in StackBlitz** link on every pull
request. It wires that pull request's build of the module into a real Nuxt app,
and the badge in the header shows which build is installed, so you can confirm
you are exercising that commit rather than the npm release. The backend is
yours: nothing is hosted for you, and nothing runs Convex in the sandbox.

Look at the [nuxt-convex-module documentation](https://nuxt-convex-module.dev) to learn more.

## Quick Start

```bash
pnpm create nuxt@latest my-app -t gh:qruto/nuxt-convex-module/examples/playground
```

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

Then point the app at a Convex deployment of your own.

**1. Add your deployment URL.** `.env.local` is already here, holding the one
line this app needs. Uncomment it and put your URL in place of the example:

```sh
CONVEX_URL=https://your-deployment.convex.cloud
```

Two details there are deliberate. The line is *commented out* rather than left
empty, because a variable that is defined but empty when the dev server starts
stays empty for the life of that process: dotenv does not overwrite a variable
that already exists. And the name is *unprefixed*, because
`NUXT_PUBLIC_CONVEX_URL` is Nuxt's runtime override: an empty one would still be
defined, and Nitro would blank the URL back out at request time. Given a real
URL it wins, which is how you point a deployed build at a deployment. The module
reads both names, so `nuxt.config.ts` has no URL line.

**2. Give that deployment this app's functions.** They are `convex/schema.ts`
and `convex/messages.ts`: a `messages` table, a `list` query and a `send`
mutation. `npm run convex` pushes them to your dev deployment and writes its URL
into `.env.local` in one go:

```sh
npm run convex
```

To use functions your deployment already has instead, edit
`app/components/MessageBoard.vue` to call them. `api` is typed from
`convex/_generated`, so your editor autocompletes whatever is there.

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

`dev` is `nuxt dev --dotenv .env.local`, which both loads *and watches* that
file, so the page turns from its setup panel into the live demo the moment you
save it. Nuxt does not read `.env.local` without that flag.

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

The build does not read `.env.local`. Give it the URL of the deployment you ship
in `NUXT_PUBLIC_CONVEX_URL`, and push the functions to that deployment with
`npx convex deploy` ([details](https://nuxt-convex-module.dev/getting-started/installation#point-it-at-the-deployment-you-ship)).

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

## What to try

- Open the page in two tabs and send a message: both update without a refresh.
- View source: the messages are in the server-rendered HTML, not fetched after
  hydration.
- Take the deployment offline; the pill drops to `connecting` and recovers on its
  own. Send a message while it is down: the button holds at *Sending…* because
  the mutation is still outstanding, and it lands once the socket is back.
- Add a field to `convex/schema.ts` and a function to `convex/messages.ts`, then
  run `npm run convex` if you are running this locally: the codegen refreshes and
  the new function is typed at the call site immediately.

## Relationship to the minimal starter

[`examples/minimal`](https://github.com/qruto/nuxt-convex-module/tree/main/examples/minimal)
is the smallest thing that works, kept short enough to read in one screen. This
app is deliberately larger: it has to be useful for checking that a change
actually behaves in a real Nuxt app.
