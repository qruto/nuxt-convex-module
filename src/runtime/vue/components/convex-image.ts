// PARITY: A-17
import { defineComponent, h, type PropType } from 'vue'
import { useStorageUrl, type GetStorageUrl } from '../composables/use-storage-url'
import type { StorageId } from '../composables/use-upload'

/**
 * An `<img>` for a file in Convex storage. Resolves the served URL through
 * {@link useStorageUrl} and renders the image once it is known; every other
 * attribute (`alt`, `class`, `loading`, `width`, …) goes onto the `<img>`.
 *
 * - default slot — rendered while the URL is loading or `storageId` is empty
 * - `missing` slot — rendered when the file no longer exists (the query returned `null`)
 *
 * @example
 * ```vue
 * <ConvexImage :get-url="api.files.url" :storage-id="doc.imageId" alt="Cover" class="rounded">
 *   <div class="skeleton" />
 *   <template #missing><div class="placeholder" /></template>
 * </ConvexImage>
 * ```
 *
 * @public
 */
export const ConvexImage = defineComponent({
  name: 'ConvexImage',
  inheritAttrs: false,
  props: {
    /** The public `getUrl` query: `{ storageId }` → served URL or `null`. Read once, at setup. */
    getUrl: { type: Object as PropType<GetStorageUrl>, required: true },
    /** The file to show; `null`/`undefined` renders the default slot. */
    storageId: { type: String as PropType<StorageId | string | null | undefined>, default: undefined },
  },
  setup(props, { attrs, slots }) {
    const url = useStorageUrl(props.getUrl, () => props.storageId)
    return () => {
      const value = url.value
      if (value) return h('img', { ...attrs, src: value })
      if (value === null) return slots.missing?.() ?? null
      return slots.default?.() ?? null
    }
  },
})
