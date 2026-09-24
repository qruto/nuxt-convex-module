# Nuxt Convex Minimal Starter

A realtime message list built with [`nuxt-convex-module`](https://nuxt-convex-module.dev).
The list is rendered on the server with `useAsyncQuery` and updates live over a
WebSocket; the form writes with `useMutation`. Everything is auto-imported.

Look at the [nuxt-convex-module documentation](https://nuxt-convex-module.dev) to learn more.

## Quick Start

```bash
pnpm create nuxt@latest my-app -t gh:qruto/nuxt-convex-module/examples/minimal
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

`dev` runs `convex dev --start 'nuxt dev'`. The Convex CLI creates or attaches
your dev deployment, pushes the functions in `convex/`, saves the deployment URL
to `.env.local` and starts Nuxt beside it.

Open the page in two tabs: the messages are in the server-rendered HTML and
update live in both.

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
