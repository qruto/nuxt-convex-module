import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { defineComponent, h, provide, nextTick } from 'vue'
import { Authenticated, AuthLoading, AuthRefreshing, Unauthenticated } from '../../../src/runtime/vue/auth/helpers'
import { ConvexAuthStateKey } from '../../../src/runtime/vue/auth'
import { mockAuthState } from '../../helpers/vue_test_utils'

describe('auth helpers', () => {
  it('helpers are valid children', async () => {
    const { state } = mockAuthState({ isLoading: false, isAuthenticated: true, isRefreshing: false })

    const Wrapper = defineComponent({
      setup() {
        provide(ConvexAuthStateKey, state)
        return () => h('div', [
          h(Authenticated, () => 'Yay'),
          h(Unauthenticated, () => 'Nay'),
          h(AuthLoading, () => '???'),
        ])
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    expect(wrapper.text()).toContain('Yay')
    expect(wrapper.text()).not.toContain('Nay')
    expect(wrapper.text()).not.toContain('???')
  })

  it('renders AuthRefreshing only while authenticated and refreshing', async () => {
    const { source, state } = mockAuthState({ isLoading: false, isAuthenticated: true, isRefreshing: false })

    const Wrapper = defineComponent({
      setup() {
        provide(ConvexAuthStateKey, state)
        return () => h('div', [
          h(AuthRefreshing, () => 'Refreshing'),
        ])
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    // Authenticated but not refreshing → hidden.
    expect(wrapper.text()).not.toContain('Refreshing')

    source.isRefreshing = true
    await nextTick()
    expect(wrapper.text()).toContain('Refreshing')

    // Refreshing only renders while authenticated.
    source.isAuthenticated = false
    await nextTick()
    expect(wrapper.text()).not.toContain('Refreshing')
  })

  it('helpers can take many children', async () => {
    const { state } = mockAuthState({ isLoading: false, isAuthenticated: true, isRefreshing: false })

    const Wrapper = defineComponent({
      setup() {
        provide(ConvexAuthStateKey, state)
        return () => h('div', [
          h(Authenticated, () => [h('div', 'Yay'), h('div', 'Yay again')]),
          h(Unauthenticated, () => [h('div', 'Nay'), h('div', 'Nay again')]),
          h(AuthLoading, () => [h('div', 'Load'), h('div', 'Load again')]),
        ])
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    expect(wrapper.text()).toContain('Yay')
    expect(wrapper.text()).toContain('Yay again')
    expect(wrapper.text()).not.toContain('Nay')
    expect(wrapper.text()).not.toContain('Load')
  })

  it('renders the matching helper when auth state changes', async () => {
    const { source, state } = mockAuthState({ isLoading: true, isAuthenticated: false, isRefreshing: false })

    const Wrapper = defineComponent({
      setup() {
        provide(ConvexAuthStateKey, state)
        return () => h('div', [
          h(Authenticated, () => 'Authenticated'),
          h(Unauthenticated, () => 'Unauthenticated'),
          h(AuthLoading, () => 'Loading'),
        ])
      },
    })

    const wrapper = await mountSuspended(Wrapper)
    expect(wrapper.text()).toBe('Loading')

    source.isLoading = false
    await nextTick()
    expect(wrapper.text()).toBe('Unauthenticated')

    source.isAuthenticated = true
    await nextTick()
    expect(wrapper.text()).toBe('Authenticated')
  })
})
