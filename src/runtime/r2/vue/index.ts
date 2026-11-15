/**
 * A Vue port of `@convex-dev/r2/vue`: {@link useUploadFile}, on the module's
 * own client rather than the community `convex-vue` that upstream's entry
 * imports.
 *
 * @module r2/client
 */
import type { ClientApi } from '@convex-dev/r2'
import { useConvexOrThrow } from '../../vue/client'
// PARITY: D-21 — the package exports this helper from no entry, so it is copied.
import { uploadWithProgress } from '../upstream/client/upload'

/**
 * A composable that allows you to upload a file to R2.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { api } from '~~/convex/_generated/api'
 *
 * const uploadFile = useUploadFile(api.example)
 *
 * async function onChange(event: Event) {
 *   const file = (event.target as HTMLInputElement).files?.[0]
 *   if (file) await uploadFile(file)
 * }
 * </script>
 *
 * <template>
 *   <input type="file" @change="onChange">
 * </template>
 * ```
 *
 * @param api - The client API object from the R2 component, including at least
 * `generateUploadUrl` and `syncMetadata`.
 * @returns A function that uploads a file to R2.
 * @public
 */
export function useUploadFile(
  api: Pick<ClientApi, 'generateUploadUrl' | 'syncMetadata'>,
) {
  const client = useConvexOrThrow('useUploadFile')

  return async (
    file: File,
    options?: {
      onProgress?: (progress: { loaded: number, total: number }) => void
    },
  ) => {
    const { url, key } = await client.mutation(api.generateUploadUrl, {})
    await uploadWithProgress(url, file, options?.onProgress)
    await client.mutation(api.syncMetadata, { key })
    return key
  }
}
