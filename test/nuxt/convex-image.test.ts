// PARITY: A-17
import { describe, expect, it, vi } from 'vitest'
import { makeFunctionReference, type FunctionReference } from 'convex/server'
import { defineComponent, h, nextTick, provide, ref } from 'vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { ConvexVueClient, ConvexClientKey } from '../../src/runtime/vue/client'
import { ConvexImage } from '../../src/runtime/vue/components/convex-image'
import type { GetStorageUrl } from '../../src/runtime/vue/composables/use-storage-url'
import { nodeWebSocket } from '../helpers/in_memory_web_socket'
import { silentConnectLogger } from '../helpers/silent-logger'

const address = 'https://127.0.0.1:3001'
const getUrl = makeFunctionReference<'query'>('files:url') as GetStorageUrl
const mutationRef = makeFunctionReference<'mutation'>('myMutation:default') as FunctionReference<'mutation'>

function testClient() {
  return new ConvexVueClient(address, {
    webSocketConstructor: nodeWebSocket,
    unsavedChangesWarning: false,
    logger: silentConnectLogger,
  })
}

function seedUrl(client: ConvexVueClient, storageId: string, url: string | null) {
  void client.mutation(mutationRef, {}, {
    optimisticUpdate: (localStore) => {
      localStore.setQuery(getUrl, { storageId: storageId as never }, url)
    },
  })
}

async function mountImage(client: ConvexVueClient, storageId: ReturnType<typeof ref<string | null | undefined>>) {
  const Wrapper = defineComponent({
    setup() {
      provide(ConvexClientKey, client)
      return () => h(ConvexImage, { getUrl, storageId: storageId.value, alt: 'Cover', class: 'cover' }, {
        default: () => h('span', { class: 'loading' }, 'loading'),
        missing: () => h('span', { class: 'missing' }, 'gone'),
      })
    },
  })
  return mountSuspended(Wrapper)
}

describe('<ConvexImage>', () => {
  it('renders the default slot, then the image with fall-through attributes, then the missing slot', async () => {
    const client = testClient()
    const storageId = ref<string | null | undefined>('abc')
    const mounted = await mountImage(client, storageId)

    expect(mounted.find('.loading').exists()).toBe(true)
    expect(mounted.find('img').exists()).toBe(false)

    seedUrl(client, 'abc', 'https://files.example/abc.png')
    await nextTick()
    const img = mounted.find('img')
    expect(img.attributes('src')).toBe('https://files.example/abc.png')
    expect(img.attributes('alt')).toBe('Cover')
    expect(img.classes()).toContain('cover')

    seedUrl(client, 'abc', null)
    await nextTick()
    expect(mounted.find('img').exists()).toBe(false)
    expect(mounted.find('.missing').text()).toBe('gone')

    mounted.unmount()
    await client.close()
  })

  it('skips the query while there is no storage id', async () => {
    const client = testClient()
    const watchQuery = vi.spyOn(client, 'watchQuery')
    const storageId = ref<string | null | undefined>(undefined)
    const mounted = await mountImage(client, storageId)

    expect(mounted.find('.loading').exists()).toBe(true)
    expect(watchQuery).not.toHaveBeenCalled()

    mounted.unmount()
    await client.close()
  })
})
