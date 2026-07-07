/**
 * Helpers for integrating Convex into Nuxt applications using server rendering.
 *
 * This module contains:
 * 1. {@link preloadQuery}, for preloading data for reactive client components.
 * 2. {@link fetchQuery}, {@link fetchMutation} and {@link fetchAction} for loading and mutating Convex data
 *   from Nuxt server routes, API handlers, and middleware.
 *
 * ## Usage
 *
 * All exported functions assume that a Convex deployment URL is set in the
 * `NUXT_PUBLIC_CONVEX_URL` environment variable. `npx convex dev` will
 * automatically set it during local development.
 *
 * ### Preloading data
 *
 * Preload data inside a server route:
 *
 * ```typescript
 * // server/api/tasks.get.ts
 * export default defineEventHandler(async () => {
 *   return await preloadQuery(api.foo.baz)
 * })
 * ```
 *
 * And pass it to a client component:
 * ```vue
 * <script setup lang="ts">
 * const props = defineProps<{
 *   preloaded: Preloaded<typeof api.foo.baz>
 * }>()
 *
 * const data = usePreloadedQuery(props.preloaded)
 * // render `data`...
 * </script>
 * ```
 *
 * @module
 */

import { ConvexHttpClient } from 'convex/browser'
import type {
  ArgsAndOptions,
  FunctionReference,
  FunctionReturnType,
} from 'convex/server'
import { getFunctionName } from 'convex/server'
import { convexToJson, jsonToConvex } from 'convex/values'
import type { Preloaded } from '../vue/index'
import { getBackendRuntimeConfig } from './config'

/**
 * Options to {@link preloadQuery}, {@link fetchQuery}, {@link fetchMutation} and {@link fetchAction}.
 *
 * @public
 */
export type NuxtOptions = {
  /**
   * The JWT-encoded OpenID Connect authentication token to use for the function call.
   */
  token?: string
  /**
   * The URL of the Convex deployment to use for the function call.
   * Defaults to `process.env.NUXT_PUBLIC_CONVEX_URL` if not provided.
   *
   * Explicitly passing undefined here (such as from missing ENV variables) will throw an error in the future.
   */
  url?: string

  /**
   * @internal
   */
  adminToken?: string
  /**
   * Skip validating that the Convex deployment URL looks like
   * `https://happy-animal-123.convex.cloud` or localhost.
   *
   * This can be useful if running a self-hosted Convex backend that uses a different
   * URL.
   *
   * The default value is `false`
   */
  skipConvexDeploymentUrlCheck?: boolean
}

/**
 * Execute a Convex query function and return a `Preloaded`
 * payload which can be passed to `usePreloadedQuery` in a client
 * component.
 *
 * @param query - a `FunctionReference` for the public query to run
 * like `api.dir1.dir2.filename.func`.
 * @param args - The arguments object for the query. If this is omitted,
 * the arguments will be `{}`.
 * @param options -  A {@link NuxtOptions} options object for the query.
 * @returns A promise of the `Preloaded` payload.
 *
 * @public
 */
export async function preloadQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  ...args: ArgsAndOptions<Query, NuxtOptions>
): Promise<Preloaded<Query>> {
  const value = await fetchQuery(query, ...args)
  const preloaded = {
    _name: getFunctionName(query),
    _argsJSON: convexToJson(args[0] ?? {}),
    _valueJSON: convexToJson(value),
  }
  return preloaded as any
}

/**
 * Returns the result of executing a query via {@link preloadQuery}.
 *
 * @param preloaded - The `Preloaded` payload returned by {@link preloadQuery}.
 * @returns The query result.
 *
 * @public
 */
export function preloadedQueryResult<Query extends FunctionReference<'query'>>(
  preloaded: Preloaded<Query>,
): FunctionReturnType<Query> {
  return jsonToConvex(preloaded._valueJSON)
}

/**
 * Execute a Convex query function.
 *
 * @param query - a `FunctionReference` for the public query to run
 * like `api.dir1.dir2.filename.func`.
 * @param args - The arguments object for the query. If this is omitted,
 * the arguments will be `{}`.
 * @param options -  A {@link NuxtOptions} options object for the query.
 * @returns A promise of the query's result.
 *
 * @public
 */
export async function fetchQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  ...args: ArgsAndOptions<Query, NuxtOptions>
): Promise<FunctionReturnType<Query>> {
  const [fnArgs, options] = args
  const client = setupClient(options ?? {})
  return client.query(query, fnArgs || {})
}

/**
 * Execute a Convex mutation function.
 *
 * @param mutation - A `FunctionReference` for the public mutation
 * to run like `api.dir1.dir2.filename.func`.
 * @param args - The arguments object for the mutation. If this is omitted,
 * the arguments will be `{}`.
 * @param options -  A {@link NuxtOptions} options object for the mutation.
 * @returns A promise of the mutation's result.
 *
 * @public
 */
export async function fetchMutation<
  Mutation extends FunctionReference<'mutation'>,
>(
  mutation: Mutation,
  ...args: ArgsAndOptions<Mutation, NuxtOptions>
): Promise<FunctionReturnType<Mutation>> {
  const [fnArgs, options] = args
  const client = setupClient(options ?? {})
  return client.mutation(mutation, fnArgs || {})
}

/**
 * Execute a Convex action function.
 *
 * @param action - A `FunctionReference` for the public action
 * to run like `api.dir1.dir2.filename.func`.
 * @param args - The arguments object for the action. If this is omitted,
 * the arguments will be `{}`.
 * @param options -  A {@link NuxtOptions} options object for the action.
 * @returns A promise of the action's result.
 *
 * @public
 */
export async function fetchAction<Action extends FunctionReference<'action'>>(
  action: Action,
  ...args: ArgsAndOptions<Action, NuxtOptions>
): Promise<FunctionReturnType<Action>> {
  const [fnArgs, options] = args
  const client = setupClient(options ?? {})
  return client.action(action, fnArgs || {})
}

// The published `convex` types omit the `@internal` `setFetchOptions` /
// `setAdminAuth` methods upstream calls directly — surface them for setupClient.
interface ConvexHttpClientWithFetchOptions extends ConvexHttpClient {
  setFetchOptions(options: RequestInit): void
  setAdminAuth(token: string): void
}

function setupClient(options: NuxtOptions) {
  if ('url' in options && options.url === undefined) {
    // This will be an error in the future.
    console.error(
      'deploymentUrl is undefined, are your environment variables set? In the future explicitly passing undefined will cause an error. To explicitly use the default, pass `process.env.NUXT_PUBLIC_CONVEX_URL`.',
    )
  }
  const client = new ConvexHttpClient(
    getConvexUrl(options.url, options.skipConvexDeploymentUrlCheck ?? false),
  ) as ConvexHttpClientWithFetchOptions
  if (options.token !== undefined) {
    client.setAuth(options.token)
  }
  if (options.adminToken !== undefined) {
    client.setAdminAuth(options.adminToken)
  }
  client.setFetchOptions({ cache: 'no-store' })
  return client
}

function getConvexUrl(
  /**
   * The URL of the Convex deployment to use for the function call.
   *
   * Defaults to `process.env.NUXT_PUBLIC_CONVEX_URL` if not provided.
   *
   * Explicitly passing undefined here (such as in broken ENV variables) will throw an error in the future
   */
  deploymentUrl: string | undefined,
  skipConvexDeploymentUrlCheck: boolean,
) {
  // Nuxt runtimeConfig defaults unset strings to '' — treat that (and a
  // set-but-empty env var) as unset so misconfiguration takes the same error
  // paths as upstream. An explicitly passed `{ url: '' }` is NOT normalized:
  // it falls through to the verbatim upstream validation messages below.
  const url = deploymentUrl
    ?? (getBackendRuntimeConfig().url || undefined)
    ?? (process.env.NUXT_PUBLIC_CONVEX_URL || undefined)
  const isFromEnv = deploymentUrl === undefined
  if (typeof url !== 'string') {
    // TypeError (upstream throws Error) — a benign subclass upgrade; the
    // message text is the contract.
    throw new TypeError(
      isFromEnv
        ? `Environment variable NUXT_PUBLIC_CONVEX_URL is not set.`
        : `Convex function called with invalid deployment address.`,
    )
  }
  if (!skipConvexDeploymentUrlCheck) {
    validateDeploymentUrl(url)
  }
  return url!
}

// Mirrored verbatim from upstream `src/common/index.ts` — the published
// `convex` package has no `convex/common` export to import it from.
function validateDeploymentUrl(deploymentUrl: string) {
  // Don't use things like `new URL(deploymentUrl).hostname` since these aren't
  // supported by React Native's JS environment
  if (typeof deploymentUrl === 'undefined') {
    throw new Error(
      `Client created with undefined deployment address. If you used an environment variable, check that it's set.`,
    )
  }
  if (typeof deploymentUrl !== 'string') {
    throw new Error(
      `Invalid deployment address: found ${deploymentUrl as any}".`,
    )
  }
  if (
    !(deploymentUrl.startsWith('http:') || deploymentUrl.startsWith('https:'))
  ) {
    throw new Error(
      `Invalid deployment address: Must start with "https://" or "http://". Found "${deploymentUrl}".`,
    )
  }

  // Most clients should connect to ".convex.cloud". But we also support localhost and
  // custom custom. We validate the deployment url is a valid url, which is the most
  // common failure pattern.
  try {
    new URL(deploymentUrl)
  }
  catch {
    throw new Error(
      `Invalid deployment address: "${deploymentUrl}" is not a valid URL. If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`,
    )
  }

  // If a user uses .convex.site, this is very likely incorrect.
  if (deploymentUrl.endsWith('.convex.site')) {
    throw new Error(
      `Invalid deployment address: "${deploymentUrl}" ends with .convex.site, which is used for HTTP Actions. Convex deployment URLs typically end with .convex.cloud? If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`,
    )
  }
}
