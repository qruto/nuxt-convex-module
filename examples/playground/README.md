# Nuxt Convex Playground

A small live message board built with [`nuxt-convex-module`](https://nuxt-convex-module.dev).
It is rendered on the server with `useAsyncQuery`, updates over a WebSocket,
writes through `useMutation`, and shows a connection pill driven by
`useConvexConnectionState`. Everything is auto-imported.

This is also the app behind the **Open in StackBlitz** link on every pull
request. It wires that pull request's build of the module into a real Nuxt app,
and the badge in the header shows which build is installed, so you can confirm
you are exercising that commit rather than the npm release. The backend is
yours: nothing is hosted for you.

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
deployment URL to `.env.local` and starts Nuxt beside it. The functions are
`convex/schema.ts` and `convex/messages.ts`: a `messages` table, a `list` query
and a `send` mutation.

The deployment runs in Convex's cloud. `CONVEX_ALLOW_ANONYMOUS=false` in the
script turns off the CLI's *Start without an account* option, which would run
the Convex backend as a program on your machine.

### In StackBlitz

The sandbox runs the same script. The Convex CLI asks you to log in: open the
link it prints, log in, and paste the token back into the terminal. It keeps the
token in `~/.convex` inside the sandbox, outside the project files. Then create a
new project for the playground: `convex dev` replaces every function on the
deployment it pushes to, so an existing project would lose its own.

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
- Add a field to `convex/schema.ts` and a function to `convex/messages.ts`: the
  running `dev` pushes them, the codegen refreshes, and the new function is typed
  at the call site immediately.

## Relationship to the minimal starter

[`examples/minimal`](https://github.com/qruto/nuxt-convex-module/tree/main/examples/minimal)
is the smallest thing that works, kept short enough to read in one screen. This
app is deliberately larger: it has to be useful for checking that a change
actually behaves in a real Nuxt app.
