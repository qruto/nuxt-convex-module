import { describe, expect, it } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { createApp, defineComponent, h } from 'vue'
import {
  type ConvexApi,
  provideConvexApi,
  useConvexApi,
  useConvexNamespace,
} from '../../src/runtime/vue/provide'

const api: ConvexApi = {
  billing: { generateCheckoutLink: { _ref: 'billing' } },
  email: { getEmailStatus: { _ref: 'email' } },
}

describe('useConvexApi / useConvexNamespace', () => {
  it('returns undefined outside an injection context', () => {
    expect(useConvexApi()).toBeUndefined()
    expect(useConvexNamespace('billing')).toBeUndefined()
  })

  it('exposes the provided api to descendant setups', async () => {
    let injectedApi: ConvexApi | undefined
    let billing: unknown
    let missing: unknown

    const Child = defineComponent({
      setup() {
        injectedApi = useConvexApi()
        billing = useConvexNamespace('billing')
        missing = useConvexNamespace('missing')
        return () => h('div')
      },
    })
    const Parent = defineComponent({
      setup() {
        provideConvexApi(api)
        return () => h(Child)
      },
    })

    await mountSuspended(Parent)

    expect(injectedApi).toBe(api)
    expect(billing).toBe(api.billing)
    expect(missing).toBeUndefined()
  })

  it('provides at the app level when given an app instance', () => {
    let billing: unknown
    const Root = defineComponent({
      setup() {
        billing = useConvexNamespace('billing')
        return () => h('div')
      },
    })

    const app = createApp(Root)
    provideConvexApi(api, app)
    const el = document.createElement('div')
    app.mount(el)

    expect(billing).toBe(api.billing)

    app.unmount()
  })
})
