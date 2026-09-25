# Nuxt Convex Starter

A Nuxt app with [`nuxt-convex-module`](https://nuxt-convex-module.dev) and one Convex table:
a message list rendered on the server that updates live, and a form that adds to it.

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) and the [module documentation](https://nuxt-convex-module.dev) to learn more.

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

`dev` runs `convex dev --start "nuxt dev"`. The Convex CLI logs you in, creates or attaches
your dev deployment, pushes the functions in `convex/`, writes the deployment URL to
`.env.local` and starts Nuxt beside it.

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

The build does not read `.env.local`. Set `NUXT_PUBLIC_CONVEX_URL` to the deployment you
ship, and push your functions to it with `npx convex deploy`
([details](https://nuxt-convex-module.dev/getting-started/installation#point-it-at-the-deployment-you-ship)).

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
