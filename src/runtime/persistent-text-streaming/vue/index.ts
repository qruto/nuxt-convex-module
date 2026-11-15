/**
 * A Vue port of `@convex-dev/persistent-text-streaming`'s `useStream`:
 * {@link useStream}. It follows the package's Svelte entry, which reads the
 * request options when a stream starts.
 *
 * @module persistent-text-streaming/client
 */
import type { StreamBody, StreamId } from '@convex-dev/persistent-text-streaming'
import type { FunctionReference } from 'convex/server'
import { computed, ref, toValue, watch, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import { useQuery } from '../../vue/composables/use-query'

type StreamStatus = StreamBody['status']

/**
 * Vue version of the React `useStream` hook. Reactive inputs are values, refs
 * or getters.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import type { StreamId } from '@convex-dev/persistent-text-streaming'
 * import { api } from '~~/convex/_generated/api'
 *
 * const props = defineProps<{ streamId: string, driven: boolean }>()
 * const stream = useStream(
 *   api.chat.getChatBody,
 *   new URL(`${useRuntimeConfig().public.convex.siteUrl}/chat-stream`),
 *   () => props.driven,
 *   () => props.streamId as StreamId,
 * )
 * </script>
 *
 * <template>
 *   <p>{{ stream.text }}</p>
 * </template>
 * ```
 *
 * @param getPersistentBody - A query function reference that returns the body
 * of a stream using the component's `getStreamBody` method.
 * @param streamUrl - The URL of the http action that will kick off the stream
 * generation and stream the result back to the client using the component's
 * `stream` method.
 * @param driven - Whether this particular session is driving the stream. True
 * if this is the client session that first created the stream using the
 * component's `createStream` method. If you're simply reloading an existing
 * stream, false.
 * @param streamId - The ID of the stream. While it is undefined, the text is
 * empty and the status is `pending`.
 * @param opts - Request options. They are read when a stream starts, so a
 * changed auth token applies to the next stream without aborting the current
 * one.
 * @returns A ref of the `text` and `status` of the stream.
 * @public
 */
export function useStream(
  getPersistentBody: FunctionReference<
    'query',
    'public',
    { streamId: string },
    StreamBody
  >,
  streamUrl: URL,
  driven: MaybeRefOrGetter<boolean>,
  streamId: MaybeRefOrGetter<StreamId | undefined>,
  opts?: MaybeRefOrGetter<{
    // If provided, this will be passed as the Authorization header.
    authToken?: string | null
    // If provided, these will be passed as additional headers.
    headers?: Record<string, string>
  } | undefined>,
): ComputedRef<StreamBody> {
  const streamBody = ref('')
  const streamEnded = ref<boolean | null>(null)
  // Set when this session drives a stream it already requested once.
  const resumed = ref(false)

  // Every stream ID this composable has POSTed. Aborting a request does not
  // stop the backend writer, so a second POST for the same ID could start a
  // second writer on the same stream. Holds one entry per stream seen.
  const attempted = new Set<StreamId>()

  // Computed refs only notify dependents when their value changes, so the
  // watcher below never re-runs because a getter re-ran with the same id.
  const isDriven = computed(() => toValue(driven))
  const currentStreamId = computed(() => toValue(streamId))

  const usePersistence = computed(() =>
    // Something is wrong with the stream, so we need to use the database value.
    streamEnded.value === false
    // The HTTP stream for this ID was already used, so only the database
    // has the full text.
    || resumed.value
    // If we're not driving the stream, we must use the database value.
    || !isDriven.value,
  )

  const persistentBody = useQuery(getPersistentBody, () =>
    usePersistence.value && currentStreamId.value ? { streamId: currentStreamId.value } : 'skip',
  )

  // PARITY: D-01
  // Upstream's effects only run in the browser, so SSR never sends the request.
  if (!import.meta.server) {
    // PARITY: D-22
    // Only the stream and whether this session drives it restart the request,
    // as in the Svelte entry. The React entry restarts on new options too.
    watch([isDriven, currentStreamId], ([driving, id], _previous, onCleanup) => {
      // Reset state from any previous stream, also when this one is missing or
      // not driven, so the body never shows the last stream's text.
      streamBody.value = ''
      streamEnded.value = null
      if (!driving || !id) {
        return
      }

      const isResume = attempted.has(id)
      resumed.value = isResume
      if (isResume) {
        return
      }
      attempted.add(id)

      const controller = new AbortController()
      // A watcher tracks only its sources, so the options are read untracked:
      // a changed token or header applies to the next stream and must not
      // abort the current one.
      const options = toValue(opts)
      const headers = {
        'Content-Type': 'application/json',
        ...options?.headers,
        ...(options?.authToken
          ? { Authorization: `Bearer ${options.authToken}` }
          : {}),
      }

      void (async () => {
        try {
          // fallow-ignore-next-line security-sink -- the app's own streaming HTTP action; verified 2026-11-15
          const response = await fetch(streamUrl, {
            method: 'POST',
            body: JSON.stringify({ streamId: id }),
            headers,
            signal: controller.signal,
          })
          // A response that settled just before teardown must not write into
          // the state of the next stream.
          if (controller.signal.aborted) return

          if (response.status === 205) {
            console.error('Stream already finished', response)
            streamEnded.value = false
            return
          }
          if (!response.ok) {
            console.error('Failed to reach streaming endpoint', response)
            streamEnded.value = false
            return
          }
          if (!response.body) {
            console.error('No body in response', response)
            streamEnded.value = false
            return
          }

          const reader = response.body.getReader()
          // One decoder per stream keeps multi-byte characters intact when they
          // are split across chunks.
          const decoder = new TextDecoder()

          for (;;) {
            const { done, value } = await reader.read()
            if (controller.signal.aborted) return
            const text = decoder.decode(value, { stream: !done })
            if (text) {
              streamBody.value += text
            }
            if (done) {
              streamEnded.value = true
              return
            }
          }
        }
        catch (e) {
          if (!controller.signal.aborted) {
            console.error('Error reading stream', e)
            streamEnded.value = false
          }
        }
      })()

      onCleanup(() => {
        controller.abort()
      })
    }, { immediate: true })
  }

  return computed((): StreamBody => {
    if (persistentBody.value) {
      return persistentBody.value
    }
    let status: StreamStatus
    if (streamEnded.value === null) {
      status = streamBody.value.length > 0 ? 'streaming' : 'pending'
    }
    else {
      status = streamEnded.value ? 'done' : 'error'
    }
    return { text: streamBody.value, status }
  })
}
