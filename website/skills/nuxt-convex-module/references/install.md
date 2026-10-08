# Install nuxt-convex-module

Follow these steps in order. Every command runs without prompts, so you can run them yourself. Two things need the user, and you ask before doing either: logging in to Convex, and anything that creates or changes resources in their Convex account.

## 0. Look at the project first

1. **Package manager.** `pnpm-lock.yaml` → pnpm, `package-lock.json` → npm, `yarn.lock` → yarn, `bun.lock` or `bun.lockb` → bun. No lockfile → npm. Use it for every command below:

   | | install | run a package | run the project's `convex` | run a script |
   |---|---|---|---|---|
   | pnpm | `pnpm add` | `pnpm dlx` | `pnpm exec convex` | `pnpm <script>` |
   | npm | `npm i` | `npx` | `npx convex` | `npm run <script>` |
   | yarn | `yarn add` | `yarn dlx` (`npx` on Yarn 1) | `yarn convex` | `yarn <script>` |
   | bun | `bun add` | `bunx` | `bunx convex` | `bun run <script>` |

   `npx convex` below is the project's own `convex`. Run it as that column says, not with `dlx`, which fetches a separate copy.

2. **Versions.** The module needs Nuxt ≥ 4.1.0 and Node ≥ 24.11.0. Check `node -v` and the `nuxt` version in `package.json`. If either is lower, stop and tell the user; don't upgrade Nuxt on your own.
3. **What is already there.**
   - `nuxt-convex-module` in `package.json` and in `modules` in `nuxt.config.ts`: already installed, go to step 2.
   - A `convex/` folder or `convex.json`: the project already has Convex functions. Keep them.
   - `CONVEX_DEPLOYMENT` in `.env.local`: a deployment is already configured. Use it.
   - No `package.json` with `nuxt` at all: there is no Nuxt app here, go to step 1a.

## 1a. No Nuxt app yet: create one from the starter

The starter is a minimal Nuxt app with the module installed and one live `messages` table, shown on a welcome page (`app/app.vue`) that is meant to be replaced. `create nuxt` needs these flags when it has no terminal to ask in:

```bash
pnpm create nuxt@latest my-app -t gh:qruto/nuxt-convex-module/templates/starter --packageManager pnpm --gitInit
npm create nuxt@latest my-app -- -t gh:qruto/nuxt-convex-module/templates/starter --packageManager npm --gitInit
yarn create nuxt my-app -t gh:qruto/nuxt-convex-module/templates/starter --packageManager yarn --gitInit
bun create nuxt@latest my-app --template=gh:qruto/nuxt-convex-module/templates/starter --packageManager bun --gitInit
```

Use the user's name for the app instead of `my-app`, and pass `--gitInit=false` when the folder is already inside a git repository. npm needs the `--` before `-t`; Bun rejects `-t`, so it takes `--template=`. Then `cd` into the new folder and run the `npx skills add` command from the prompt there too: it installed the skill in the folder you started in, and the app needs its own copy for later tasks. Go to step 2.

## 1b. An existing Nuxt app: add the module

```bash
npm i convex
npx nuxi@latest module add nuxt-convex-module
```

(With your package manager's install and run-a-package commands.) `convex` is the package the backend functions import from. `nuxi module add` installs the module, adds it to `modules` in `nuxt.config.ts`, and runs `nuxt prepare`. On that run the module rewrites a plain `"dev": "nuxt dev"` script to `"dev": "convex dev --start \"nuxt dev\""`, so one command runs Convex and Nuxt together.

Check both results:

- `nuxt.config.ts` lists `'nuxt-convex-module'` in `modules`.
- `package.json`'s `dev` script now starts with `convex dev --start` (the quotes around `nuxt dev` differ between module versions). If the user's `dev` script was not plain `nuxt dev` (it chains commands or adds flags the module doesn't recognise), the module leaves it alone. Tell the user, and suggest wrapping their own command: `convex dev --start "<their command>"`.

pnpm notes:

- pnpm 11 can stop the install on dependency build scripts it has not been allowed to run (for example `esbuild`). Show the user the list and let them choose: approve with `pnpm approve-builds`, or deny them in `allowBuilds` in `pnpm-workspace.yaml`. Don't turn off `strictDepBuilds`.
- With Convex components (`@convex-dev/*`, such as Better Auth or Polar) and pnpm's strict layout, add `publicHoistPattern: ['@convex-dev/*']` to `pnpm-workspace.yaml`.

## 2. Create a deployment and generate the code

Convex runs the backend in a deployment. `convex dev --once` connects to one (creating it if needed), writes `CONVEX_DEPLOYMENT`, `CONVEX_URL` and `CONVEX_SITE_URL` to `.env.local`, pushes `convex/`, generates `convex/_generated/` and exits.

- **A deployment is already configured** (`CONVEX_DEPLOYMENT` in `.env.local`):

  ```bash
  npx convex dev --once
  ```

- **No deployment yet.** Create a local one. It needs no account, runs on this machine, and creates nothing in the cloud:

  ```bash
  CONVEX_AGENT_MODE=anonymous npx convex dev --once
  ```

  In PowerShell: `$env:CONVEX_AGENT_MODE='anonymous'; npx convex dev --once`.

- **The user wants a cloud deployment.** That needs their Convex login in a browser. Ask them to run `npx convex dev` in their own terminal and pick or create a project, then continue with step 3 once `.env.local` has `CONVEX_DEPLOYMENT`. Never run `npx convex login` for them.

A local deployment runs only while `convex dev` runs. The `dev` script keeps it running, so that is the command the user starts.

## 3. Add example code, only when the user asked for it

An install request is not a request for example code: skip this step, and never replace the user's pages to make room for it. Offer it in step 5 instead. Do it when the user asked for an example or a demo (or for a feature: then build that feature, not this). The example is the starter's table and functions:

```ts [convex/schema.ts]
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  messages: defineTable({
    body: v.string(),
  }),
})
```

```ts [convex/messages.ts]
import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('messages').order('desc').take(20)
  },
})

export const send = mutation({
  args: { body: v.string() },
  handler: async (ctx, { body }) => {
    await ctx.db.insert('messages', { body })
  },
})
```

Use them in a new page, or in `app.vue` only when it is still Nuxt's untouched welcome page and the user agreed:

```vue
<script setup lang="ts">
import { api } from '#convex/api'

// Rendered on the server, then kept live over a WebSocket.
const { data: messages } = useAsyncQuery(api.messages.list, {})
const send = useMutation(api.messages.send)
const body = ref('')
</script>

<template>
  <form @submit.prevent="send({ body }).then(() => (body = ''))">
    <input v-model="body" placeholder="Write a message">
  </form>
  <ul>
    <li v-for="message in messages" :key="message._id">{{ message.body }}</li>
  </ul>
</template>
```

Run `npx convex dev --once` again (with `CONVEX_AGENT_MODE=anonymous` for a local deployment) to push the functions and regenerate `convex/_generated/`.

## 4. Verify

1. `convex/_generated/api.d.ts` exists.
2. Start the `dev` script in the background (`npm run dev`, `pnpm dev`, …) and wait for the Nuxt URL. The module logs one line that names the deployment, such as `Convex http://127.0.0.1:3210 · functions: convex/ · integrations: none`. A warning that starts with `No Convex deployment URL configured` means step 2 didn't run in this folder.
3. Request the page with `curl` and check for HTTP 200 and no error page. With step 3's example in place, also write a message with `npx convex run messages:send '{"body":"hi"}'` and check that the next request's HTML contains it.
4. Stop the dev process when you are done, with Ctrl-C or, on macOS and Linux, `kill -INT <pid>`. On Windows, `taskkill /PID <pid> /T /F` ends it together with the processes it started. A plain `kill` sends SIGTERM, which stops `convex dev` but leaves Nuxt and the local Convex backend running, and the next `dev` then fails with `A local backend is still running on port …` until you stop the process on that port.

If something fails, every message the module prints is listed with its fix in [Troubleshooting](https://nuxt-convex-module.dev/raw/getting-started/troubleshooting.md).

## 5. Tell the user

- What changed: the packages added, `nuxt.config.ts`, the `dev` script, `.env.local`, and any files you created.
- How to run it: the `dev` script starts Convex and Nuxt together.
- If you created a local deployment: it lives on their machine. To move it to a Convex account, they run `npx convex login` in their own terminal; it offers to link the existing deployment.
- For production: `npx convex deploy --cmd "npm run build"` (with their package manager) pushes the functions to the production deployment and builds with its URL, because the module reads the `CONVEX_URL` that the command sets. Alternatively, set `NUXT_PUBLIC_CONVEX_URL` (and `NUXT_PUBLIC_CONVEX_SITE_URL` with Better Auth) in the build environment.
- Convex's own guidelines for writing backend functions: `npx convex ai-files install` writes them to `convex/_generated/ai/` and points `AGENTS.md` and `CLAUDE.md` at them. Offer it; it edits those two files.
- What they can add: Better Auth, Clerk or Auth0 ([auth.md](auth.md)), Polar billing ([polar.md](polar.md)), and `nuxt-security` for a CSP that knows the deployment's origins.

Install the optional packages only when the user asks for them. If you skipped step 3, offer the example: a `messages` table with a live list and a form.
