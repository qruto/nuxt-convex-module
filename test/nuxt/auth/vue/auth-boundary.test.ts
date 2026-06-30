// @vitest-environment nuxt
import { describe, it, expect, vi } from 'vitest'
import { defineComponent, h, nextTick, provide } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { makeFunctionReference } from 'convex/server'
import { AuthBoundary } from '../../../../src/runtime/better-auth/vue/auth-boundary'
import { ConvexClientKey, ConvexVueClient } from '../../../../src/runtime/vue/client'
import { ConvexAuthStateKey, type ConvexAuthState } from '../../../../src/runtime/vue/auth'
import { silentConnectLogger } from '../../../helpers/silent-logger'

const getAuthUserFn = makeFunctionReference<'query'>('auth:getAuthUser')

function makeAuthClient() {
  return { getSession: vi.fn().mockResolvedValue(undefined) }
}

async function mountBoundary(
  authState: Pick<ConvexAuthState, 'isLoading' | 'isAuthenticated'>,
  props: Record<string, unknown>,
  slot: () => unknown,
) {
  const client = new ConvexVueClient('https://127.0.0.1:30001', { logger: silentConnectLogger })
  const Wrapper = defineComponent({
    setup() {
      provide(ConvexClientKey, client)
      provide(ConvexAuthStateKey, { isRefreshing: false, ...authState })
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
})
