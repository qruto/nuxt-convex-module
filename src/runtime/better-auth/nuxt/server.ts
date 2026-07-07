/**
 * Server-side Better Auth + Convex integration for Nuxt.
 *
 * Provides {@link backendAuth} for Nuxt server handlers.
 *
 * It accepts the H3
 * {@link H3Event} that is available in every Nuxt server route, API handler
 * and server middleware.
 *
 * @module
 */

import type { H3Event } from 'h3'
import { getRequestHeaders, toWebRequest } from 'h3'
import { getToken } from '@convex-dev/better-auth/utils'
import type { GetTokenOptions } from '@convex-dev/better-auth/utils'
import type {
  ArgsAndOptions,
  FunctionReference,
  FunctionReturnType,
} from 'convex/server'
import type { Preloaded } from '../../vue/hydration'
import { getBackendRuntimeConfig } from '../../nuxt/config'
import { fetchAction, fetchMutation, fetchQuery, preloadQuery } from '../../nuxt/index'

const parseConvexSiteUrl = (url: string | undefined) => {
  // Texts mirror upstream verbatim, modulo the sanctioned env-var/framework
  // substitutions, plus an additive pointer at the Nuxt-only `backend.siteUrl`
  // config source.
  if (!url) {
    throw new Error(
      'NUXT_PUBLIC_CONVEX_SITE_URL is not set.\n'
      + 'This is automatically set in the Convex backend, but must be set in the Nuxt environment.\n'
      + 'For local development, this can be set in the .env file, '
      + 'or via the `backend.siteUrl` option in nuxt.config.',
    )
  }
  if (url.endsWith('.convex.cloud')) {
    throw new Error(
      `NUXT_PUBLIC_CONVEX_SITE_URL should be set to your Convex Site URL, which ends in .convex.site.\n`
      + `Currently set to ${url}.`,
    )
  }
  return url
}

const handler = async (request: Request, siteUrl: string) => {
  const requestUrl = new URL(request.url)
  // String concatenation like upstream — `new URL(path, base)` would drop a
  // path prefix on a self-hosted site URL.
  const nextUrl = `${siteUrl}${requestUrl.pathname}${requestUrl.search}`

  const headers = new Headers(request.headers)
  // Strip hop-by-hop headers; undici rejects outbound `transfer-encoding: chunked`.
  headers.delete('transfer-encoding')
  headers.delete('content-length')
  headers.delete('connection')
  headers.set('accept-encoding', 'application/json')
  headers.set('host', new URL(siteUrl).host)
  headers.set('x-forwarded-host', requestUrl.host)
  headers.set('x-forwarded-proto', requestUrl.protocol.replace(/:$/, ''))
  headers.set('x-better-auth-forwarded-host', requestUrl.host)
  headers.set('x-better-auth-forwarded-proto', requestUrl.protocol.replace(/:$/, ''))

  const init: RequestInit = {
    headers,
    method: request.method,
    redirect: 'manual',
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    const body = await request.arrayBuffer()
    if (body.byteLength > 0) {
      init.body = body
    }
  }

  const response = await fetch(nextUrl, init)

  // Forced Nitro deviation from upstream's bare `return fetch(nextUrl, init)`:
  // `fetch` transparently decompresses the upstream body but leaves the
  // `Content-Encoding`/`Content-Length` headers untouched. Forwarding those
  // verbatim makes the browser try to decode an already-decoded body
  // (`ERR_CONTENT_DECODING_FAILED`), so drop them before relaying. Every
  // other header is preserved — `Set-Cookie` (the auth session cookies, kept
  // as separate entries) and `Location` (manual redirects) included.
  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

// Nuxt server routes use a single event handler rather than Next's
// `{ GET, POST }` route-handler pair, so the Nuxt analog of `nextJsHandler`
// returns one thunk over the H3 event.
const nuxtHandler = (event: H3Event, siteUrl: string) => () =>
  handler(toWebRequest(event), siteUrl)

// `Record<string, never>` inlines upstream's `EmptyObject` — upstream imports
// it from `convex-helpers`, which is not a dependency of this package.
type OptionalArgs<FuncRef extends FunctionReference<any, any>>
  = FuncRef['_args'] extends Record<string, never>
    ? [args?: Record<string, never>]
    : [args: FuncRef['_args']]

const getArgsAndOptions = <FuncRef extends FunctionReference<any, any>>(
  args: OptionalArgs<FuncRef>,
  token?: string,
): ArgsAndOptions<FuncRef, { token?: string }> => {
  return [args[0], { token }]
}

/**
 * Options for {@link backendAuth}.
 *
 * Extends {@link GetTokenOptions} from `@convex-dev/better-auth/utils` with
 * an optional override for the Convex site URL.
 *
 * @public
 */
export type BackendAuthOptions = GetTokenOptions & {
  /**
   * Accepted for drop-in compatibility with upstream `convexBetterAuthNextJs`
   * option objects and ignored — upstream requires but never reads it either;
   * the deployment URL comes from runtime config.
   */
  convexUrl?: string
  /**
   * Override the Convex site URL. Defaults to `NUXT_PUBLIC_CONVEX_SITE_URL`.
   */
  convexSiteUrl?: string
}

/**
 * Per-request Better Auth + Convex helper returned by {@link backendAuth}.
 *
 * @public
 */
export interface BackendAuthService {
  /** Convex JWT for the current user, or `undefined` when not authenticated. */
  getToken: () => Promise<string | undefined>
  /** Proxy a Better Auth route to the configured Convex site URL. */
  handler: () => Promise<Response>
  /** `true` when the current request has a valid Convex auth token. */
  isAuthenticated: () => Promise<boolean>
  /** Preload a Convex query with the current user's auth token. */
  preloadAuthQuery: <Query extends FunctionReference<'query'>>(
    query: Query,
    ...args: OptionalArgs<Query>
  ) => Promise<Preloaded<Query>>
  /** Execute a Convex query with the current user's auth token. */
  fetchAuthQuery: <Query extends FunctionReference<'query'>>(
    query: Query,
    ...args: OptionalArgs<Query>
  ) => Promise<FunctionReturnType<Query>>
  /** Execute a Convex mutation with the current user's auth token. */
  fetchAuthMutation: <Mutation extends FunctionReference<'mutation'>>(
    mutation: Mutation,
    ...args: OptionalArgs<Mutation>
  ) => Promise<FunctionReturnType<Mutation>>
  /** Execute a Convex action with the current user's auth token. */
  fetchAuthAction: <Action extends FunctionReference<'action'>>(
    action: Action,
    ...args: OptionalArgs<Action>
  ) => Promise<FunctionReturnType<Action>>
}

/**
 * Create a per-request Better Auth + Convex helper for Nuxt server code.
 *
 * Adapts the Better Auth + Convex server helper pattern to H3 events.
 *
 * Call once at the top of a server route / event handler and destructure the
 * helpers you need. The auth token is fetched at most once per request — the
 * cache lives on `event.context`, so every `backendAuth(event)` instance for
 * the same request (server plugin, middleware, your route) shares one Better
 * Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.
 *
 * @example
 * ```ts
 * // server/api/profile.get.ts
 * export default defineEventHandler(async (event) => {
 *   const { fetchAuthQuery, isAuthenticated } = backendAuth(event)
 *   if (!await isAuthenticated()) {
 *     throw createError({ statusCode: 401 })
 *   }
 *   return fetchAuthQuery(api.users.current)
 * })
 * ```
 *
 * @example
 * ```ts
 * // pages/profile.vue — preloading data for SSR
 * const { data } = await useAsyncData(async () => {
 *   const event = useRequestEvent()!
 *   return backendAuth(event).preloadAuthQuery(api.users.current)
 * })
 * ```
 *
 * @param event - The H3 event from a Nuxt server route or middleware.
 * @param opts  - Optional {@link BackendAuthOptions}.
 *
 * @public
 */
export function backendAuth(event: H3Event, opts?: BackendAuthOptions): BackendAuthService {
  // Upstream requires `opts.convexSiteUrl`; Nuxt auto-provides it from runtime
  // config / env when the override is omitted.
  const siteUrl = parseConvexSiteUrl(
    opts?.convexSiteUrl
    ?? getBackendRuntimeConfig().siteUrl
    ?? process.env.NUXT_PUBLIC_CONVEX_SITE_URL,
  )

  // Per-REQUEST token cache — memoized on `event.context` (keyed by site URL
  // and token endpoint) so separate `backendAuth(event)` instances share one
  // fetch, the H3 analog of upstream wrapping `getToken` in `React.cache` on
  // a module-level singleton. The promise is cached (deduping concurrent
  // callers, and caching rejections for the request like `React.cache` does);
  // a forced refresh overwrites the shared entry.
  type TokenResult = Awaited<ReturnType<typeof getToken>>
  const cacheKey = `__nuxtConvexToken:${siteUrl}|${opts?.basePath ?? ''}`
  const tokenCache = event.context as Record<string, Promise<TokenResult> | undefined>

  const cachedGetToken = (
    { forceRefresh }: { forceRefresh?: boolean } = {},
  ): Promise<TokenResult> => {
    const cached = tokenCache[cacheKey]
    if (cached && !forceRefresh) return cached

    const headers = getRequestHeaders(event)
    const mutableHeaders = new Headers(headers as Record<string, string>)
    mutableHeaders.delete('content-length')
    mutableHeaders.delete('transfer-encoding')
    mutableHeaders.set('accept-encoding', 'identity')
    const promise = getToken(siteUrl, mutableHeaders, { ...opts, forceRefresh })
    tokenCache[cacheKey] = promise
    return promise
  }

  const callWithToken = async <
    FnType extends 'query' | 'mutation' | 'action',
    Fn extends FunctionReference<FnType>,
  >(
    fn: (token?: string) => Promise<FunctionReturnType<Fn>>,
  ): Promise<FunctionReturnType<Fn>> => {
    const token = await cachedGetToken()
    try {
      return await fn(token?.token)
    }
    catch (error) {
      // Intentional divergence from upstream v0.12.5 `callWithToken`, whose
      // predicate is inverted (it rethrows on auth errors and retries
      // non-auth errors — almost certainly an upstream bug). We retry with a
      // force-refreshed token exactly when the cached JWT is rejected as an
      // auth error, which is what the JWT cache's `isAuthError` option
      // exists for. Documented in AGENTS.md/PARITY.md; do not "sync" back.
      if (
        !opts?.jwtCache?.enabled
        || token.isFresh
        || !opts.jwtCache.isAuthError(error)
      ) {
        throw error
      }
      const newToken = await cachedGetToken({ forceRefresh: true })
      return await fn(newToken.token)
    }
  }

  return {
    getToken: async () => {
      const token = await cachedGetToken()
      return token.token
    },
    handler: nuxtHandler(event, siteUrl),
    isAuthenticated: async () => {
      const token = await cachedGetToken()
      return !!token.token
    },
    preloadAuthQuery: async <Query extends FunctionReference<'query'>>(
      query: Query,
      ...args: OptionalArgs<Query>
    ): Promise<Preloaded<Query>> => {
      return callWithToken((token?: string) => {
        const argsAndOptions = getArgsAndOptions(args, token)
        return preloadQuery(query, ...argsAndOptions)
      })
    },
    fetchAuthQuery: async <Query extends FunctionReference<'query'>>(
      query: Query,
      ...args: OptionalArgs<Query>
    ): Promise<FunctionReturnType<Query>> => {
      return callWithToken((token?: string) => {
        const argsAndOptions = getArgsAndOptions(args, token)
        return fetchQuery(query, ...argsAndOptions)
      })
    },
    fetchAuthMutation: async <Mutation extends FunctionReference<'mutation'>>(
      mutation: Mutation,
      ...args: OptionalArgs<Mutation>
    ): Promise<FunctionReturnType<Mutation>> => {
      return callWithToken((token?: string) => {
        const argsAndOptions = getArgsAndOptions(args, token)
        return fetchMutation(mutation, ...argsAndOptions)
      })
    },
    fetchAuthAction: async <Action extends FunctionReference<'action'>>(
      action: Action,
      ...args: OptionalArgs<Action>
    ): Promise<FunctionReturnType<Action>> => {
      return callWithToken((token?: string) => {
        const argsAndOptions = getArgsAndOptions(args, token)
        return fetchAction(action, ...argsAndOptions)
      })
    },
  }
}

/**
 * Upstream-named alias of {@link backendAuth} — the mechanical rename target
 * for `@convex-dev/better-auth/nextjs`'s `convexBetterAuthNextJs` (framework
 * suffix `NextJs` → `Nuxt`). Unlike upstream's module-level factory (which
 * reads request state ambiently via `next/headers`), Nitro has no ambient
 * per-request context, so the H3 `event` is passed explicitly.
 *
 * @public
 */
export const convexBetterAuthNuxt = backendAuth
