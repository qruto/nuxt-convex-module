import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, provide } from 'vue'
import { makeFunctionReference } from 'convex/server'
import { ConvexClientKey, ConvexVueClient } from '../../src/runtime/vue/client'
import { silentConnectLogger } from '../helpers/silent-logger'
import { CheckoutLink, CustomerPortalLink, type PolarComponentApi } from '../../src/runtime/polar/vue/components'

// The docs say `nuxt-convex-module/polar/vue` works in a plain Vue app. This
// project has no `define`, so `import.meta.client` and `import.meta.server`
// are both undefined here — the one condition the Nuxt-shaped projects cannot
// reproduce. A guard written as `import.meta.client && …` never runs in it,
// and the components render an anchor with no href.

vi.mock('@polar-sh/checkout/embed', () => ({ PolarEmbedCheckout: { init: vi.fn(), create: vi.fn() } }))

const checkoutRef = makeFunctionReference<'action'>('billing:generateCheckoutLink')
const portalRef = makeFunctionReference<'action'>('billing:generateCustomerPortalUrl')
const api = { generateCheckoutLink: checkoutRef, generateCustomerPortalUrl: portalRef } as unknown as PolarComponentApi

let client: ConvexVueClient
beforeEach(() => {
  client = new ConvexVueClient('https://127.0.0.1:3001', { logger: silentConnectLogger })
})
afterEach(() => vi.restoreAllMocks())

const mountWithClient = (target: typeof CheckoutLink | typeof CustomerPortalLink, props: Record<string, unknown>) =>
  mount(defineComponent({
    setup() {
      provide(ConvexClientKey, client)
      return () => h(target, props, { default: () => 'Go' })
    },
  }))

describe('polar components without Nuxt', () => {
  it('<CheckoutLink> resolves its href', async () => {
    vi.spyOn(client, 'action').mockResolvedValue({ url: 'https://polar.test/checkout' })
    const wrapper = mountWithClient(CheckoutLink, { productIds: ['prod_1'], embed: false, polarApi: api })
    await flushPromises()
    await nextTick()
    expect(wrapper.find('a').attributes('href')).toBe('https://polar.test/checkout')
  })

  it('<CustomerPortalLink> resolves its href', async () => {
    vi.spyOn(client, 'action').mockResolvedValue({ url: 'https://polar.test/portal' })
    const wrapper = mountWithClient(CustomerPortalLink, { polarApi: api })
    await flushPromises()
    await nextTick()
    expect(wrapper.find('a').attributes('href')).toBe('https://polar.test/portal')
  })
})
