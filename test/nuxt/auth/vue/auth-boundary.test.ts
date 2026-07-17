// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, nextTick, provide } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { makeFunctionReference } from 'convex/server'
import type { Value } from 'convex/values'
import { AuthBoundary } from '../../../../src/runtime/better-auth/vue/auth-boundary'
import { ConvexClientKey, ConvexVueClient } from '../../../../src/runtime/vue/client'
import { ConvexAuthStateKey } from '../../../../src/runtime/vue/auth'
import { silentConnectLogger } from '../../../helpers/silent-logger'
import { mockAuthState } from '../../../helpers/vue_test_utils'
import FakeWatch from '../../../fake-watch'

const getAuthUserFn = makeFunctionReference<'query'>('auth:getAuthUser')

function makeAuthClient() {
  return { getSession: vi.fn().mockResolvedValue(undefined) }
}

async function mountBoundary(
  authState: { isLoading: boolean, isAuthenticated: boolean },
  props: Record<string, unknown>,
  slot: () => unknown,
  client: ConvexVueClient
    = new ConvexVueClient('https://127.0.0.1:30001', { logger: silentConnectLogger }),
) {
  const Wrapper = defineComponent({
    setup() {
      provide(ConvexClientKey, client)
      provide(ConvexAuthStateKey, mockAuthState(authState).state)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return () => h(AuthBoundary as any, props, { default: slot })
    },
  })
  const wrapper = await mountSuspended(Wrapper)
  await nextTick()
  return wrapper
}

describe('AuthBoundary (Better Auth)', () => {
  it('calls onUnauth (after clearing the session) when unauthenticated', async () => {
    const onUnauth = vi.fn()
    const authClient = makeAuthClient()

    await mountBoundary(
      { isLoading: false, isAuthenticated: false },
      { authClient, getAuthUserFn, isAuthError: () => false, onUnauth },
      () => h('div', { class: 'content' }, 'protected'),
    )
    await nextTick()

    expect(authClient.getSession).toHaveBeenCalledTimes(1)
    expect(onUnauth).toHaveBeenCalledTimes(1)
  })

  it('renders children and does not call onUnauth when authenticated', async () => {
    const onUnauth = vi.fn()
    const authClient = makeAuthClient()

    const wrapper = await mountBoundary(
      { isLoading: false, isAuthenticated: true },
      { authClient, getAuthUserFn, isAuthError: () => false, onUnauth },
      () => h('div', { class: 'content' }, 'protected'),
    )

    expect(wrapper.find('.content').exists()).toBe(true)
    expect(onUnauth).not.toHaveBeenCalled()
  })

  it('does not unauth while still loading', async () => {
    const onUnauth = vi.fn()
    const authClient = makeAuthClient()

    await mountBoundary(
      { isLoading: true, isAuthenticated: false },
      { authClient, getAuthUserFn, isAuthError: () => false, onUnauth },
      () => h('div', 'loading'),
    )

    expect(onUnauth).not.toHaveBeenCalled()
  })

  it('catches auth errors from the slot, unauths, and renders the fallback', async () => {
    const onUnauth = vi.fn()
    const authClient = makeAuthClient()
    const authError = new Error('Unauthenticated')
    const Thrower = defineComponent({
      name: 'Thrower',
      setup() {
        return () => {
          throw authError
        }
      },
    })

    // Authenticated state keeps the watch-based unauth path quiet, so every
    // getSession/onUnauth call below comes from the error-boundary path.
    const wrapper = await mountBoundary(
      { isLoading: false, isAuthenticated: true },
      {
        authClient,
        getAuthUserFn,
        isAuthError: (error: unknown) => error === authError,
        onUnauth,
        renderFallback: () => h('div', { class: 'fallback' }, 'signed out'),
      },
      () => h(Thrower),
    )
    await nextTick()
    await nextTick()

    // Propagation stopped (`return false`): the mount above resolved instead
    // of surfacing the slot error, and the boundary handled the unauth.
    expect(authClient.getSession).toHaveBeenCalledTimes(1)
    expect(onUnauth).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.fallback').exists()).toBe(true)
    expect(wrapper.text()).toBe('signed out')
  })

  it('renders null after an auth error when no renderFallback is given', async () => {
    const onUnauth = vi.fn()
    const authClient = makeAuthClient()
    const authError = new Error('Unauthenticated')
    const Thrower = defineComponent({
      name: 'Thrower',
      setup() {
        return () => {
          throw authError
        }
      },
    })

    const wrapper = await mountBoundary(
      { isLoading: false, isAuthenticated: true },
      { authClient, getAuthUserFn, isAuthError: () => true, onUnauth },
      () => h(Thrower),
    )
    await nextTick()
    await nextTick()

    expect(onUnauth).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toBe('')
  })

  it('unauths when the getAuthUser query transitions to an auth error', async () => {
    const onUnauth = vi.fn()
    const authClient = makeAuthClient()
    const authError = new Error('Unauthenticated')
    const watch = new FakeWatch<Value>()

    // Regression: UserSubscription must *read* the lazy `useQuery` computed in
    // its render function — otherwise the throw inside the computed getter
    // never executes and the query-driven unauth path is dead code.
    const wrapper = await mountBoundary(
      { isLoading: false, isAuthenticated: true },
      {
        authClient,
        getAuthUserFn,
        isAuthError: (error: unknown) => error === authError,
        onUnauth,
        renderFallback: () => h('div', { class: 'fallback' }, 'signed out'),
      },
      () => h('div', { class: 'content' }, 'protected'),
      { watchQuery: () => watch } as unknown as ConvexVueClient,
    )
    await nextTick()

    // Query still loading — no unauth yet.
    expect(onUnauth).not.toHaveBeenCalled()

    // Session invalidated server-side (user deleted / session revoked): the
    // getAuthUser query now yields an auth error while the JWT is still valid.
    watch.localQueryResult = () => {
      throw authError
    }
    watch.setValue(undefined)
    await nextTick()
    await nextTick()

    expect(authClient.getSession).toHaveBeenCalledTimes(1)
    expect(onUnauth).toHaveBeenCalledTimes(1)
    expect(wrapper.find('.fallback').exists()).toBe(true)
  })

  it('lets non-auth errors propagate without unauthing', async () => {
    const onUnauth = vi.fn()
    const authClient = makeAuthClient()
    const renderError = new Error('unrelated render failure')
    const Thrower = defineComponent({
      name: 'Thrower',
      setup() {
        return () => {
          throw renderError
        }
      },
    })

    // `onErrorCaptured` does not return false for non-auth errors, so the
    // error keeps propagating (and may reject the mount) — swallow it here.
    await mountBoundary(
      { isLoading: false, isAuthenticated: true },
      { authClient, getAuthUserFn, isAuthError: () => false, onUnauth },
      () => h(Thrower),
    ).catch(() => {})
    await nextTick()
    await nextTick()

    expect(authClient.getSession).not.toHaveBeenCalled()
    expect(onUnauth).not.toHaveBeenCalled()
  })
})
