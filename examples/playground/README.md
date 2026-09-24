# Nuxt Convex Playground

One page that runs every core feature of
[`nuxt-convex-module`](https://nuxt-convex-module.dev), one click each, in the
website's design:

| Card | Composables | Try |
|---|---|---|
| live queries | `useQueries` | Totals from the other cards update as you click. |
| mutations | `useMutation`, `.withOptimisticUpdate`, `useQuery` | Click +1 with *optimistic* on and off. |
| cursor pagination | `usePaginatedQuery`, `insertAtTop` | Tap an emoji to post; reload, then *Load 4 more*. |
| file storage | `useUpload`, `<ConvexImage>` | Upload an image drawn in the browser, or pick one. |
| actions | `useAction` | Roll a die on the server; the roll lands in the feed. |
| server & ssr | `useAsyncQuery`, `fetchQuery` | View source for the rendered number; call a Nitro route. |

The bar above the cards shows `useConvexConnectionState`: whether the socket is
open and how many mutations and actions are waiting. *Reset data* clears
everything. Everything is auto-imported.

This is also the app behind the **Open in StackBlitz** link on every pull
request. It wires that pull request's build of the module into a real Nuxt app,
and the badge in the header shows which build is installed, so you can confirm
you are exercising that commit rather than the npm release. The backend is
yours: nothing is hosted for you. [In StackBlitz](#in-stackblitz) shows how to
connect it.

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

## Development Server

Start Convex and the development server on `http://localhost:3000`:

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

`dev` runs `convex dev --start 'nuxt dev'`. The Convex CLI logs you in, creates
or attaches your dev deployment, pushes this app's functions, saves the
deployment URL to `.env.local` and starts Nuxt beside it. Each card's functions
have their own file in `convex/`, and `server/api/totals.get.ts` is the Nitro
route.

The deployment runs in Convex's cloud. `CONVEX_ALLOW_ANONYMOUS=false` in the
script turns off the CLI's *Start without an account* option, which would run
the Convex backend as a program on your machine.

### In StackBlitz

Every pull request's pkg.pr.new comment links this app with that pull request's
build of the module. To run it against a Convex deployment of your own:

**Once: create a deploy key**

1. In the [Convex dashboard](https://dashboard.convex.dev), create a project for
   this playground only. Each run pushes the playground's functions to it and
   replaces the functions already there.
2. Open the project's dev deployment settings, find **Deploy keys** and click
   **Generate a deploy key**. The key starts with `dev:`. Keep it, for example
   in your password manager, and reuse it on every pull request.

**On each pull request**

1. Click **Open in StackBlitz** in the pull request's pkg.pr.new comment.
2. When the terminal asks for a development deploy key, paste yours and press
   Enter.
3. The Convex CLI pushes the functions and starts Nuxt, and the preview shows the
   playground.

The key reaches only that one deployment, and it lives only in the terminal
process: nothing is saved in the sandbox. To cut off access, delete the key in
the dashboard. If the key is wrong, run `node .stackblitz/start.mjs` to paste
another.

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

## What else to try

- Open the page in two tabs: every card updates in both.
- Go offline for a moment and click +1: the bar counts the mutation in flight,
  and it lands once the socket is back.
- Add a field to `convex/schema.ts` or a function to a file in `convex/`: the
  running `dev` pushes it, the codegen refreshes, and the new function is typed
  at the call site immediately.

## Relationship to the minimal starter

[`examples/minimal`](https://github.com/qruto/nuxt-convex-module/tree/main/examples/minimal)
is the smallest thing that works, kept short enough to read in one screen. This
app is deliberately larger: it has to be useful for checking that a change
actually behaves in a real Nuxt app.
