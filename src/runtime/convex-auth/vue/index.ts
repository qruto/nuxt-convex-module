/**
 * Vue bindings for Convex Auth.
 *
 * A Vue/Nuxt port of `@convex-dev/auth/react`. Call {@link provideConvexAuth}
 * in a top-level component to enable authentication. The provider owns the
 * token lifecycle (storing the session, refreshing the access token, signing
 * out) and feeds {@link client!provideConvexWithAuth | provideConvexWithAuth}.
 *
 * Sign-in methods are deliberately not part of this core: each sign-in method
 * (password, OAuth, passkey, …) ships its own authentication API that returns a
 * {@link TokenBundle}. Hand that bundle to {@link useAuthActions}'s `setSession`
 * which allows the Convex client to authenticate with the backend.
 *
 * @module convex-auth/client
 */
import type { ConvexAuthApi } from '@convex-dev/auth'
import { AuthClient, defaultStorage, type TokenStorage } from '@convex-dev/auth/browser'
import { ConvexHttpClient } from 'convex/browser'
import { computed, defineComponent, h, inject, type ComputedRef, type PropType } from 'vue'
import type { ConvexAuthState } from '../../vue/auth/index'
import { provideConvexWithAuth } from '../../vue/auth/index'
import { useConvexOrThrow, type ConvexVueClient } from '../../vue/client'
import type { AmbientSignInClient, AuthSignInApi } from '../upstream/browser/ambientSignInClient'
import { oauth } from '../upstream/methods/oauth/client'
import {
  ConvexAuthActionsKey,
  ConvexAuthTokenKey,
  provideAuth,
  useSessionWatcher,
  type ConvexAuthActionsContextType,
} from './client'
import { routerReplaceUrl, useAppRouter } from './router'

export type { ConvexAuthApi, TokenBundle } from '@convex-dev/auth'
export type { TokenStorage } from '@convex-dev/auth/browser'
export type { ConvexAuthActionsContextType } from './client'

/**
 * Options for {@link provideConvexAuth} / `<ConvexAuthProvider>`.
 */
export interface ConvexAuthProviderOptions {
  /** Convex client to authenticate. Defaults to the client `useConvex()` returns. */
  client?: ConvexVueClient
  /**
   * The app's `refreshSession` and `signOut` mutation references, and its
   * `isAuthenticated` query reference. The provider subscribes to
   * `isAuthenticated`, so a session revoked server-side signs the client out reactively.
   */
  api: ConvexAuthApi
  /**
   * A custom {@link TokenStorage} implementation.
   *
   * If none is supplied, the system defaults to `localStorage` in the browser
   * and in-memory where there is no `localStorage` (SSR).
   */
  storage?: TokenStorage
  /**
   * Namespace for storage keys, which determines whether tokens are shared.
   * Non-alphanumeric characters are ignored. Defaults to the deployment URL.
   */
  storageNamespace?: string
  /**
   * Advanced. Ambient sign-ins run initialization for sign-in methods that can
   * take action outside of a user activated sign in flow, such as reading an
   * oauth code from a url query param.
   *
   * Setting this replaces the default (`[oauth()]`) entirely rather than adding
   * to it. Pass `[]` to register nothing. Read once when the client is created
   * and not expected to change.
   */
  ambientSignIns?: AmbientSignInClient[]
}

/**
 * The client options of Convex Auth's cookie sessions: the default export of
 * an optional `app/convex-auth.ts`. They are upstream's `storage` and
 * `ambientSignIns` props of `ConvexAuthNextjsProvider`, which the module's
 * plugin passes on.
 *
 * Under cookie sessions `storage` only holds the access token: the refresh
 * token stays in the httpOnly cookie. The file is imported on the server too,
 * so a storage that needs `window` must check for it.
 *
 * @example
 * ```ts
 * // app/convex-auth.ts
 * import type { ConvexAuthNuxtClientOptions } from 'nuxt-convex-module/convex-auth/client'
 *
 * export default {
 *   storage: sessionStorageAdapter,
 * } satisfies ConvexAuthNuxtClientOptions
 * ```
 *
 * @public
 */
export type ConvexAuthNuxtClientOptions = Pick<ConvexAuthProviderOptions, 'storage' | 'ambientSignIns'>

/**
 * Call this in a top-level component's `setup` to enable authentication: the
 * Vue translation of wrapping the app in `@convex-dev/auth/react`'s
 * `<ConvexAuthProvider>`.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { provideConvexAuth } from 'nuxt-convex-module/convex-auth/client'
 * import { api } from '../convex/_generated/api'
 *
 * provideConvexAuth({
 *   api: {
 *     refreshSession: api.auth.refreshSession,
 *     signOut: api.auth.signOut,
 *     isAuthenticated: api.auth.isAuthenticated,
 *   },
 * })
 * </script>
 * ```
 *
 * @public
 */
export function provideConvexAuth(options: ConvexAuthProviderOptions): ConvexAuthState {
  const { api, storage, storageNamespace, ambientSignIns } = options
  const client = options.client ?? useConvexOrThrow('provideConvexAuth')
  // Refresh and sign-out go over a *separate* HTTP client, not the websocket
  // `client`. A refresh happens while `client` is paused waiting for a token,
  // so calling it through `client` would deadlock on the very handshake the
  // refresh is meant to satisfy.
  const httpClient = new ConvexHttpClient(client.url, {
    logger: client.logger,
  })
  // Sign-in functions run against the deployment over the same websocket
  // client as the rest of the app (it isn't paused pre-auth, unlike the
  // refresh path below), so the response carries the full token bundle for
  // `setSession` to persist. The same object serves the setups of the
  // methods here and, via provideAuth below, the composables of the methods.
  const signInApi: AuthSignInApi = {
    mutation: (fn, args) => client.mutation(fn, args),
    action: (fn, args) => client.action(fn, args),
  }
  const authClient = new AuthClient({
    mode: 'spa',
    authApi: {
      refreshSession: refreshToken =>
        httpClient.mutation(api.refreshSession, { refreshToken }),
      signOut: async (refreshToken) => {
        await httpClient.mutation(api.signOut, { refreshToken })
      },
    },
    storage: storage ?? defaultStorage(),
    storageNamespace: storageNamespace ?? client.url,
    ambientSignIns: {
      signIns: ambientSignIns ?? [oauth()],
      signInApi,
      // Mutations that mint no session use the same websocket client.
      convex: { mutation: (fn, args) => client.mutation(fn, args) },
      // PARITY: N-17
      // Upstream works around Next's router here. This goes through the
      // app's own, when it has one.
      replaceUrl: routerReplaceUrl(useAppRouter()),
    },
  })

  const auth = provideAuth({ authClient, signInApi })
  const authState = provideConvexWithAuth({ client, useAuth: () => auth })
  useSessionWatcher(authClient, api.isAuthenticated, authState, client)
  return authState
}

const providerProps = {
  client: { type: Object as PropType<ConvexVueClient>, default: undefined },
  api: { type: Object as PropType<ConvexAuthApi>, required: true },
  storage: { type: Object as PropType<TokenStorage>, default: undefined },
  storageNamespace: { type: String, default: undefined },
  ambientSignIns: { type: Array as PropType<AmbientSignInClient[]>, default: undefined },
} as const

/**
 * A wrapper Vue component which enables authentication: the component form of
 * {@link provideConvexAuth}, kept as a drop-in parity port of
 * `@convex-dev/auth/react`'s `<ConvexAuthProvider>`. Renders its default slot.
 *
 * @public
 */
export const ConvexAuthProvider = /* @__PURE__ */ defineComponent({
  name: 'ConvexAuthProvider',
  props: providerProps,
  setup(props, { slots }) {
    // PARITY: D-23
    // Upstream builds a new `AuthClient` when `client` changes (`useMemo`).
    // A Vue component provides once, so a new client remounts the subtree.
    return () => h(ConvexAuthProviderScope, { ...props, key: clientKey(props.client) }, slots)
  },
})

const clientKeys = new WeakMap<ConvexVueClient, number>()
let lastClientKey = 0
const clientKey = (client: ConvexVueClient | undefined): number => {
  if (client === undefined) return 0
  let key = clientKeys.get(client)
  if (key === undefined) clientKeys.set(client, key = ++lastClientKey)
  return key
}

const ConvexAuthProviderScope = /* @__PURE__ */ defineComponent({
  name: 'ConvexAuthProviderScope',
  props: providerProps,
  setup(props, { slots }) {
    provideConvexAuth({
      client: props.client,
      api: props.api,
      storage: props.storage,
      storageNamespace: props.storageNamespace,
      ambientSignIns: props.ambientSignIns,
    })
    return () => slots.default?.()
  },
})

/**
 * Access the auth actions:
 *
 * ```ts
 * const { setSession, signOut } = useAuthActions();
 * ```
 *
 * - `setSession` adopts a {@link TokenBundle} produced by the sign-in of a
 *   method.
 * - `signOut` revokes and clears the session.
 *
 * @public
 */
export function useAuthActions(): ConvexAuthActionsContextType {
  const actions = inject(ConvexAuthActionsKey, undefined)
  if (actions === undefined) {
    throw new Error(
      'useAuthActions must be used below `provideConvexAuth` (or within a <ConvexAuthProvider>).',
    )
  }
  return actions
}

/**
 * The current access token (a JWT), or null when signed out.
 *
 * Use it to authenticate requests to your Convex HTTP actions
 * (`Authorization: Bearer <token>`). Treat it as an ID token — do not send it
 * to other servers.
 *
 * @public
 */
export function useAuthToken(): ComputedRef<string | null> {
  return inject(ConvexAuthTokenKey, () => computed(() => null), true)
}
