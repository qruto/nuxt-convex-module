/**
 * Server-side Better Auth + Convex integration for Nuxt.
 *
 * Provides {@link convexBetterAuthNuxt} for Nuxt server handlers: it takes the event
 * every Nuxt server route, API handler and server middleware receives, and
 * returns a request-scoped, authenticated Convex client.
 *
 * @module better-auth/server
 */

import type { RequestEvent } from 'nuxt/schema'
import { getToken } from '@convex-dev/better-auth/utils'
import type { GetTokenOptions } from '@convex-dev/better-auth/utils'
import type {
  ArgsAndOptions,
  FunctionReference,
  FunctionReturnType,
} from 'convex/server'
import type { Preloaded } from '../../vue/hydration'
import { getConvexRuntimeConfig } from '../../nuxt/config'
import { fetchAction, fetchMutation, fetchQuery, preloadQuery } from '../../nuxt/index'
import { withoutFunctionName } from '../../nuxt/function-name'

const parseConvexSiteUrl = (url: string | undefined) => {
  // Texts mirror upstream verbatim, modulo the sanctioned env-var/framework
  // substitutions, plus an additive pointer at the Nuxt-only `convex.siteUrl`
  // config source.
  if (!url) {
    throw new Error(
      'NUXT_PUBLIC_CONVEX_SITE_URL is not set.\n'
      + 'This is automatically set in the Convex deployment, but must be set in the Nuxt environment.\n'
      + 'For local development, this can be set in the .env file, '
      + 'or via the `convex.siteUrl` option in nuxt.config.',
    )
  }
  if (url.endsWith('.convex.cloud')) {
    throw new Error(
      `NUXT_PUBLIC_CONVEX_SITE_URL should be set to your Convex Site URL, which ends in .convex.site.\n`
      + `Currently set to ${url}.`,
    )
  }
  // PARITY: A-14
  // Additive guard with no upstream counterpart: every auth request — session
  // cookies included — is proxied to this origin, and it is the only thing
  // pinning the proxy's destination host. An unparseable or non-HTTP value has
  // to fail here rather than at the first `fetch`. `http:` stays legal because
  // self-hosted Convex runs over it in local development.
  let protocol: string
  try {
    protocol = new URL(url).protocol
  }
  catch {
    throw new Error(
      `NUXT_PUBLIC_CONVEX_SITE_URL must be an absolute URL, including the scheme.\n`
      + `Currently set to ${url}.`,
    )
  }
  if (protocol !== 'https:' && protocol !== 'http:') {
    throw new Error(
      `NUXT_PUBLIC_CONVEX_SITE_URL must use http: or https:.\n`
      + `Currently set to ${url}.`,
    )
  }
  return url
}

/** The headers that describe one connection, never relayed (RFC 9110 §7.6.1). */
const HOP_BY_HOP = ['connection', 'keep-alive', 'proxy-connection', 'transfer-encoding', 'te', 'trailer', 'upgrade']

/** The hop-by-hop headers of a response: the fixed set, and any its `Connection` names. */
function hopByHopHeaders(headers: Headers): string[] {
  const named = (headers.get('connection') ?? '').split(',').map(name => name.trim().toLowerCase()).filter(Boolean)
  return [...new Set([...HOP_BY_HOP, ...named])]
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
  // The original origin travels only in x-better-auth-forwarded-*. Drop any
  // x-forwarded-* the request arrived with so they can't be mistaken for it.
  headers.delete('x-forwarded-host')
  headers.delete('x-forwarded-proto')
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

  // Not SSRF: scheme and host come wholly from the parseConvexSiteUrl'd config,
  // the request contributes only pathname + search (a `//evil.com/x` pathname
  // lands as a path segment), and `redirect: 'manual'` blocks redirect-following.
  // fallow-ignore-next-line security-sink -- destination host is pinned by config; verified 2026-09-02
  const response = await fetch(nextUrl, init)

  // PARITY: D-04
  // Forced Nitro deviation from upstream's bare `return fetch(nextUrl, init)`:
  // `fetch` transparently decompresses the upstream body but leaves the
  // `Content-Encoding`/`Content-Length` headers untouched. Forwarding those
  // verbatim makes the browser try to decode an already-decoded body
  // (`ERR_CONTENT_DECODING_FAILED`), so drop them before relaying. The
  // upstream connection's hop-by-hop headers go too (RFC 9110 §7.6.1):
  // `Transfer-Encoding`/`Connection` describe the Convex leg, not the reply
  // Nitro writes. In `nuxt dev`, a relayed `Connection: keep-alive` on a
  // `Connection: close` request leaves the worker's socket open but no longer
  // read, so the dev proxy's keep-alive pool reuses it and gets a 400.
  // Every other header is preserved — `Set-Cookie` (the auth session
  // cookies, kept as separate entries) and `Location` (manual redirects)
  // included.
  const responseHeaders = new Headers(response.headers)
  responseHeaders.delete('content-encoding')
  responseHeaders.delete('content-length')
  for (const name of hopByHopHeaders(response.headers)) responseHeaders.delete(name)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  })
}

/**
 * The server event {@link convexBetterAuthNuxt} reads: the one `defineEventHandler` from
 * `nuxt/server` passes, whose `req` is a web `Request`, or the h3 event a
 * Nuxt 4 route defined with the auto-imported `defineEventHandler`, and
 * `useRequestEvent()` during SSR, still pass, which carries `headers`.
 *
 * @public
 */
export type ConvexBetterAuthEvent
  = Pick<RequestEvent, 'req' | 'context'>
    | { headers: Headers, context: Record<string, unknown> }

/** The event's web `Request`, when it has one. */
const requestOf = (event: ConvexBetterAuthEvent) =>
  'req' in event && event.req instanceof Request ? event.req : undefined

// Nuxt server routes use a single event handler rather than Next's
// `{ GET, POST }` route-handler pair, so the Nuxt analog of `nextJsHandler`
// returns one thunk over the event.
const nuxtHandler = (event: ConvexBetterAuthEvent, siteUrl: string) => () => {
  const request = requestOf(event)
  if (!request) {
    throw new Error(
      '[nuxt-convex-module] convexBetterAuthNuxt(event).handler() needs the event `defineEventHandler` '
      + 'from `nuxt/server` passes, whose `req` is a web Request.',
    )
  }
  return handler(request, siteUrl)
}

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
 * Options for {@link convexBetterAuthNuxt}.
 *
 * Extends {@link GetTokenOptions} from `@convex-dev/better-auth/utils` with
 * an optional override for the Convex site URL.
 *
 * @public
 */
export type ConvexBetterAuthOptions = GetTokenOptions & {
  /**
   * Accepted for drop-in compatibility with upstream `convexBetterAuthNextJs`
   * option objects and ignored — upstream requires but never reads it either;
   * the deployment URL comes from runtime config.
   */
  convexUrl?: string
  /**
   * Override the Convex site URL. Defaults to
   * `runtimeConfig.public.convex.siteUrl`, then the
   * `NUXT_PUBLIC_CONVEX_SITE_URL` process variable.
   */
  convexSiteUrl?: string
}

/**
 * Per-request Better Auth + Convex helper returned by {@link convexBetterAuthNuxt}.
 *
 * @public
 */
export interface ConvexBetterAuthService {
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
 * The port of `@convex-dev/better-auth/nextjs`'s `convexBetterAuthNextJs`, with
 * the framework suffix `NextJs` swapped for `Nuxt`. Upstream reads the request
 * from `next/headers`; Nitro has no ambient per-request context, so the
 * `event` is passed explicitly.
 *
 * Call once at the top of a server route / event handler and destructure the
 * helpers you need. The auth token is fetched at most once per request — the
 * cache lives on `event.context`, so every `convexBetterAuthNuxt(event)` instance for
 * the same request (server plugin, middleware, your route) shares one Better
 * Auth round-trip. Mirrors upstream's `React.cache`-wrapped `getToken`.
 *
 * @example
 * ```ts
 * // server/api/profile.get.ts
 * export default defineEventHandler(async (event) => {
 *   const { fetchAuthQuery, isAuthenticated } = convexBetterAuthNuxt(event)
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
 *   return convexBetterAuthNuxt(event).preloadAuthQuery(api.users.current)
 * })
 * ```
 *
 * @param event - The event from a Nuxt server route or middleware, or `useRequestEvent()` during SSR. See {@link ConvexBetterAuthEvent}.
 * @param opts  - Optional {@link ConvexBetterAuthOptions}.
 *
 * @public
 */
export function convexBetterAuthNuxt(event: ConvexBetterAuthEvent, opts?: ConvexBetterAuthOptions): ConvexBetterAuthService {
  // PARITY: N-09
  // Upstream requires `opts.convexSiteUrl`; Nuxt auto-provides it from runtime
  // config / env when the override is omitted: the request's own config, and
  // `||` because the config holds '' for a URL never set.
  const config = getConvexRuntimeConfig(event)
  const siteUrl = parseConvexSiteUrl(
    opts?.convexSiteUrl
    || config.siteUrl
    || process.env.NUXT_PUBLIC_CONVEX_SITE_URL,
  )
  // The token endpoint sits under the app's auth route, which the same-origin
  // proxy forwards to the deployment unchanged: `/api/auth` unless
  // `convex.betterAuth.authRoute` moved it.
  const basePath = opts?.basePath ?? config.authRoute

  // Per-REQUEST token cache — memoized on `event.context` (keyed by site URL
  // and token endpoint) so separate `convexBetterAuthNuxt(event)` instances share one
  // fetch, the Nitro analog of upstream wrapping `getToken` in `React.cache` on
  // a module-level singleton. The promise is cached (deduping concurrent
  // callers, and caching rejections for the request like `React.cache` does);
  // a forced refresh overwrites the shared entry.
  type TokenResult = Awaited<ReturnType<typeof getToken>>
  const cacheKey = `__nuxtConvexToken:${siteUrl}|${basePath ?? ''}`
  const tokenCache = event.context as Record<string, Promise<TokenResult> | undefined>

  const cachedGetToken = (
    { forceRefresh }: { forceRefresh?: boolean } = {},
  ): Promise<TokenResult> => {
    const cached = tokenCache[cacheKey]
    if (cached && !forceRefresh) return cached

    const mutableHeaders = new Headers(requestOf(event)?.headers ?? (event as { headers: Headers }).headers)
    mutableHeaders.delete('content-length')
    mutableHeaders.delete('transfer-encoding')
    mutableHeaders.set('accept-encoding', 'identity')
    const promise = getToken(siteUrl, mutableHeaders, { ...opts, basePath, forceRefresh })
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
      // PARITY: F-01
      // Fixes an upstream bug: upstream's `callWithToken` condition is inverted.
      // It rethrows auth errors and retries every other error. Here a cached
      // token rejected with an auth error is refreshed once and the call
      // retried. Do not sync upstream's condition back.
      // PARITY: D-17 — the check reads the message the server sent, without
      // the `[CONVEX A(module:fn)]` prefix, which a function path containing
      // "auth" would otherwise satisfy.
      if (
        !opts?.jwtCache?.enabled
        || token.isFresh
        || !withoutFunctionName(error, opts.jwtCache.isAuthError.bind(opts.jwtCache))
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
 * The old name of {@link convexBetterAuthNuxt}.
 *
 * @deprecated Use `convexBetterAuthNuxt`. Names with `ConvexAuth` and no
 * `Better` now belong to Convex Auth (`@convex-dev/auth`). Removed in the
 * next minor release.
 * @public
 */
export const convexAuth = convexBetterAuthNuxt

/** @deprecated Use {@link ConvexBetterAuthEvent}. Removed in the next minor release. */
export type ConvexAuthEvent = ConvexBetterAuthEvent
/** @deprecated Use {@link ConvexBetterAuthOptions}. Removed in the next minor release. */
export type ConvexAuthOptions = ConvexBetterAuthOptions
/** @deprecated Use {@link ConvexBetterAuthService}. Removed in the next minor release. */
export type ConvexAuthService = ConvexBetterAuthService
