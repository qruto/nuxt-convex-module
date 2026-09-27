/**
 * Runs a Convex call from a button: `pending` while it runs, `error` if it
 * failed. A mutation or action is a promise, so an unawaited one fails
 * silently; this keeps the failure on screen.
 */
export function useCall() {
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function run<T>(call: () => Promise<T>): Promise<T | undefined> {
    pending.value = true
    error.value = null
    try {
      return await call()
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : String(cause)
    }
    finally {
      pending.value = false
    }
  }

  return { pending, error, run }
}
