import { expectTypeOf } from 'vitest'
import { makeFunctionReference } from 'convex/server'
import { useUploadQueue } from '../../src/runtime/vue/composables/use-upload-queue'
import type { UploadQueueItem } from '../../src/runtime/vue/composables/use-upload-queue'

// Type-level coverage for `useUploadQueue`'s per-item data (PARITY A-02).
// Never executed: `test:types:lib` runs `vue-tsc` over this file. The point is
// the `enqueue` signature: `data` is optional while the queue takes none, and
// required, with its type, once the queue declares one that excludes `undefined`.

const generateUploadUrl = makeFunctionReference<'mutation', Record<string, never>, string>('files:generateUploadUrl')
const file = new Blob(['photo'])

// A queue without data keeps the signature it always had.
const plain = useUploadQueue(generateUploadUrl)
plain.enqueue(file)
expectTypeOf(plain.items.value[0]!.data).toEqualTypeOf<undefined>()
// @ts-expect-error a queue that declares no data takes none.
plain.enqueue(file, { kind: 'cover' })

interface Photo { kind: 'cover' | 'page', position: number }

// Declared data reaches every hook through the item, and `enqueue` requires it.
const photos = useUploadQueue<Photo>(generateUploadUrl, {
  prepare: (blob, item) => {
    expectTypeOf(item.data).toEqualTypeOf<Photo>()
    return blob
  },
  after: (_storageId, item) => {
    expectTypeOf(item.data.position).toEqualTypeOf<number>()
  },
  onItemSuccess: (_storageId, item) => {
    expectTypeOf(item).toEqualTypeOf<UploadQueueItem<Photo>>()
  },
  onComplete: (items) => {
    expectTypeOf(items).toEqualTypeOf<UploadQueueItem<Photo>[]>()
  },
})
photos.enqueue(file, { kind: 'cover', position: 0 })
expectTypeOf(photos.items.value[0]!.data.kind).toEqualTypeOf<'cover' | 'page'>()
// @ts-expect-error the queue's data is required.
photos.enqueue(file)
// @ts-expect-error `kind` is one of the declared kinds.
photos.enqueue(file, { kind: 'back', position: 1 })

// Data that may be missing stays optional.
const tagged = useUploadQueue<string | undefined>(generateUploadUrl)
tagged.enqueue(file)
tagged.enqueue(file, 'tag')
expectTypeOf(tagged.items.value[0]!.data).toEqualTypeOf<string | undefined>()
