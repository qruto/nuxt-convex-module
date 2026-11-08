import { ConvexError } from 'convex/values'
import { computed, ref, toRaw, type Ref } from 'vue'
import { useConvexOrThrow } from '../client'
import { uploadFile, type GenerateUploadUrl, type StorageId } from './use-upload'

/**
 * Lifecycle status of a single item in an upload queue.
 *
 * @public
 */
export type UploadItemStatus = 'pending' | 'uploading' | 'success' | 'error'

/**
 * Which step an `uploading` item is on: its `prepare` hook, the transfer, or
 * its `after` hook. `null` outside `uploading`.
 *
 * @public
 */
export type UploadItemStage = 'prepare' | 'upload' | 'after'

/**
 * A single entry in the queue managed by {@link useUploadQueue}.
 *
 * @public
 */
export interface UploadQueueItem {
  /** Stable id for this queue entry (not the storage id). */
  id: string
  /** The file or blob being uploaded. */
  file: Blob
  /** Current upload status. */
  status: UploadItemStatus
  /** Upload progress for this item, from `0` to `1`. */
  progress: number
  /**
   * The storage id once the file is stored, or `null`. An item that failed
   * after that keeps it (see `after` and `onItemSuccess`).
   */
  storageId: StorageId | null
  /** The error if this item failed, or `null`. */
  error: Error | null
  /**
   * Whether the error is a refusal rather than a failure: the app said no
   * (`isRefusal`; by default a `ConvexError`), so the same file would be
   * turned away again. `false` while the item has no error.
   */
  refused: boolean
  /** The step an `uploading` item is on, or `null`. */
  stage: UploadItemStage | null
  /**
   * What `prepare` returned, which is what gets sent; `null` until it runs,
   * or without a `prepare` hook (the file itself is sent). Kept for a retry
   * and for a preview.
   */
  prepared: Blob | null
}

/**
 * Options for {@link useUploadQueue}.
 *
 * @public
 */
export interface UseUploadQueueOptions {
  /** Maximum number of uploads to run at once. Defaults to `3`. */
  concurrency?: number
  /**
   * Turn a queued file into what is sent, before an upload URL is asked
   * for: resize, re-encode, strip metadata. Throw to turn the file away; the
   * item ends `error`, refused when `isRefusal` says so. Runs once per
   * item: a retry reuses what it returned.
   */
  prepare?: (file: Blob, item: UploadQueueItem, signal: AbortSignal) => Blob | Promise<Blob>
  /**
   * Runs once the file is stored, before the item counts as a success:
   * attach the storage id to a document, run a check on it. The item stays
   * `uploading` (stage `'after'`) until it settles. A throw ends the item
   * `error`; a retry then runs only this hook again, with the same storage
   * id, unless the throw was a refusal, which sends the file again. After a
   * refusal `item.storageId` still holds the stored file while the item is
   * in error, so `onItemError` can delete it; the queue never deletes files,
   * and a retry forgets it before uploading again.
   */
  after?: (storageId: StorageId, item: UploadQueueItem, signal: AbortSignal) => void | Promise<void>
  /**
   * Whether an error is a refusal (the app turned the file away) rather than
   * a failure (the network, the deployment, an abort). Defaults to: the
   * error is a `ConvexError`, which a Convex function throws on purpose.
   * An aborted item is never refused, and neither is an error this check
   * throws on.
   */
  isRefusal?: (error: Error, item: UploadQueueItem) => boolean
  /**
   * Called when an individual item finishes uploading (after `after`). A
   * throw ends the item `error` with its storage id kept; a retry then runs
   * only this callback again, never `after` a second time.
   */
  onItemSuccess?: (storageId: StorageId, item: UploadQueueItem) => void | Promise<void>
  /** Called when an individual item fails or is refused (`item.refused` says which). */
  onItemError?: (error: Error, item: UploadQueueItem) => void
  /** Called once every queued item has settled (succeeded or failed). */
  onComplete?: (items: UploadQueueItem[]) => void
}

/** Accepted inputs to {@link VueUploadQueue.enqueue}. @public */
export type EnqueueInput = Blob | Blob[] | FileList | null | undefined

/**
 * The reactive queue returned by {@link useUploadQueue}.
 *
 * @public
 */
export interface VueUploadQueue {
  /** Reactive list of queued items, in insertion order. */
  items: Readonly<Ref<UploadQueueItem[]>>
  /** Add one or more files to the queue; uploading starts automatically. */
  enqueue: (files: EnqueueInput) => void
  /** `true` while any item is pending or uploading. */
  isUploading: Readonly<Ref<boolean>>
  /** Aggregate progress across all items, from `0` to `1`. */
  progress: Readonly<Ref<number>>
  /** Number of items waiting to start. */
  pendingCount: Readonly<Ref<number>>
  /** Number of items currently uploading. */
  activeCount: Readonly<Ref<number>>
  /** Abort all in-flight uploads (queued items stay `pending`). */
  cancel: () => void
  /** Remove an item by id, aborting it first if it is uploading. */
  remove: (id: string) => void
  /** Abort everything and empty the queue. */
  clear: () => void
  /**
   * Queue an errored item again, or every errored item without an id. It
   * picks up where it stopped: `onItemSuccess` alone when `after` already
   * finished, `after` alone when the file is stored, the transfer when
   * `prepare` already ran. Whether a refused item is worth
   * retrying is the app's call; nothing here stops it.
   */
  retry: (id?: string) => void
}

function normalizeFiles(input: EnqueueInput): Blob[] {
  if (!input) return []
  if (input instanceof Blob) return [input]
  if (Array.isArray(input)) return input
  return Array.from(input)
}

let queueItemId = 0
function nextQueueItemId(): string {
  return `upload-${++queueItemId}`
}

/**
 * Upload many files to Convex file storage with bounded concurrency and
 * per-item reactive progress.
 *
 * Built on the same flow as {@link useUpload}, but manages a queue: call
 * {@link VueUploadQueue.enqueue} with one or more files (or a `FileList` from
 * a multi-file `<input>`) and the queue uploads up to `concurrency` at a time,
 * exposing per-item and aggregate progress.
 *
 * Options `prepare` and `after` add the app's own steps on either side of
 * the transfer (shrink a photo first; attach it once stored), and a failed
 * item says whether the app `refused` it or it failed, so the UI can show a
 * reason for one and {@link VueUploadQueue.retry} the other.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useUploadQueue, useMutation } from '#imports'
 * import { api } from '#convex/api'
 *
 * const saveImage = useMutation(api.images.save)
 * const { items, enqueue, progress, isUploading } = useUploadQueue(
 *   api.images.generateUploadUrl,
 *   { concurrency: 4, onItemSuccess: storageId => saveImage({ storageId }) },
 * )
 *
 * function onPick(event: Event) {
 *   enqueue((event.target as HTMLInputElement).files)
 * }
 * </script>
 *
 * <template>
 *   <input type="file" multiple @change="onPick">
 *   <progress v-if="isUploading" :value="progress" />
 *   <ul>
 *     <li v-for="item in items" :key="item.id">
 *       {{ item.status }} — {{ Math.round(item.progress * 100) }}%
 *     </li>
 *   </ul>
 * </template>
 * ```
 *
 * @param generateUploadUrl - A `FunctionReference` for the public
 *   `generateUploadUrl` mutation.
 * @param options - Optional {@link UseUploadQueueOptions}.
 * @returns A {@link VueUploadQueue}.
 *
 * @public
 */
export function useUploadQueue(
  generateUploadUrl: GenerateUploadUrl,
  options: UseUploadQueueOptions = {},
): VueUploadQueue {
  const convex = useConvexOrThrow('useUploadQueue')
  const concurrency = Math.max(1, Math.floor(options.concurrency ?? 3))
  const items = ref<UploadQueueItem[]>([])
  const controllers = new Map<string, AbortController>()
  // Items whose `after` finished: a retry must not run it twice.
  const afterDone = new Set<string>()
  // Items whose stored file `after` refused: a retry uploads again.
  const resend = new Set<string>()

  const activeCount = computed(
    () => items.value.filter(item => item.status === 'uploading').length,
  )
  const pendingCount = computed(
    () => items.value.filter(item => item.status === 'pending').length,
  )
  const isUploading = computed(() => activeCount.value > 0 || pendingCount.value > 0)
  const progress = computed(() => {
    if (items.value.length === 0) return 0
    const total = items.value.reduce((sum, item) => sum + item.progress, 0)
    return total / items.value.length
  })

  function pump(): void {
    if (typeof XMLHttpRequest === 'undefined') return
    let slots = concurrency - activeCount.value
    for (const item of items.value) {
      if (slots <= 0) break
      if (item.status !== 'pending') continue
      slots--
      void run(item)
    }
  }

  const isRefusal = options.isRefusal ?? ((error: Error) => error instanceof ConvexError)

  /** `prepare` (once per item), then the transfer: the storage id. */
  async function transfer(item: UploadQueueItem, signal: AbortSignal): Promise<StorageId> {
    if (options.prepare && item.prepared === null) {
      item.stage = 'prepare'
      const prepared = await options.prepare(toRaw(item.file), item, signal)
      signal.throwIfAborted()
      item.prepared = prepared
    }
    item.stage = 'upload'
    const url = await convex.mutation(generateUploadUrl, {})
    const storageId = await uploadFile({
      url,
      // The blob itself, not a reactive proxy of it, wherever Vue would wrap one.
      file: toRaw(item.prepared ?? item.file),
      signal,
      onProgress: (value) => {
        item.progress = value
      },
    })
    item.progress = 1
    return storageId
  }

  /** `isRefusal`, with a throw read as "not a refusal": the item must still settle. */
  function refusal(failure: Error, item: UploadQueueItem): boolean {
    try {
      return isRefusal(failure, item)
    }
    catch {
      return false
    }
  }

  /** Record a failure on the item, refused or not. */
  function fail(item: UploadQueueItem, caught: unknown, signal: AbortSignal): void {
    const failure = caught instanceof Error ? caught : new Error(String(caught))
    item.refused = !signal.aborted && refusal(failure, item)
    // `after` turned the stored file away: a retry sends it again. Until then
    // `item.storageId` says which file, for the app to delete.
    if (item.refused && item.stage === 'after') resend.add(item.id)
    item.stage = null
    item.error = failure
    item.status = 'error'
    options.onItemError?.(failure, item)
  }

  async function run(item: UploadQueueItem): Promise<void> {
    item.status = 'uploading'
    const controller = new AbortController()
    controllers.set(item.id, controller)
    const { signal } = controller

    try {
      const storageId = item.storageId ??= await transfer(item, signal)
      if (options.after && !afterDone.has(item.id)) {
        item.stage = 'after'
        await options.after(storageId, item, signal)
        signal.throwIfAborted()
        afterDone.add(item.id)
      }
      item.stage = null
      item.status = 'success'
      await options.onItemSuccess?.(storageId, item)
    }
    catch (caught) {
      fail(item, caught, signal)
    }
    finally {
      // A retry started from `onItemError` holds a controller of its own by now.
      if (controllers.get(item.id) === controller) controllers.delete(item.id)
      if (pendingCount.value === 0 && activeCount.value === 0) {
        options.onComplete?.(items.value)
      }
      else {
        pump()
      }
    }
  }

  function enqueue(files: EnqueueInput): void {
    const incoming = normalizeFiles(files)
    if (incoming.length === 0) return
    items.value.push(
      ...incoming.map((file): UploadQueueItem => ({
        id: nextQueueItemId(),
        file,
        status: 'pending',
        progress: 0,
        storageId: null,
        error: null,
        refused: false,
        stage: null,
        prepared: null,
      })),
    )
    pump()
  }

  function cancel(): void {
    for (const controller of controllers.values()) {
      controller.abort()
    }
  }

  function remove(id: string): void {
    controllers.get(id)?.abort()
    controllers.delete(id)
    afterDone.delete(id)
    resend.delete(id)
    items.value = items.value.filter(item => item.id !== id)
  }

  function retry(id?: string): void {
    for (const item of items.value) {
      if (item.status !== 'error' || (id !== undefined && item.id !== id)) continue
      item.status = 'pending'
      item.error = null
      item.refused = false
      if (resend.delete(item.id)) item.storageId = null
      if (item.storageId === null) item.progress = 0
    }
    pump()
  }

  function clear(): void {
    cancel()
    controllers.clear()
    afterDone.clear()
    resend.clear()
    items.value = []
  }

  // `computed` returns a `ComputedRef`, which is already assignable to the
  // `Readonly<Ref<…>>` shape declared on `VueUploadQueue` — no cast needed.
  return {
    items,
    enqueue,
    isUploading,
    progress,
    pendingCount,
    activeCount,
    cancel,
    remove,
    clear,
    retry,
  }
}

/** @public */
export const useConvexUploadQueue = useUploadQueue
