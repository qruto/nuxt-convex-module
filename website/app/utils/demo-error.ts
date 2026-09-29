/**
 * The clean reason out of a rejected demo mutation. The shared table's
 * guarded mutations (moderation, rate windows, the clear cooldown) throw
 * `ConvexError` with a plain-string payload — the only part that survives
 * redaction on a production deployment — so rejections render as sentences,
 * not `[Request ID …] Server Error` dumps. The playground's upload endpoint
 * (convex/files.ts) refuses with a plain sentence, which `useUpload` reports
 * after the status code. Anything else — a network failure, an error page —
 * gets `fallback`.
 */
export function demoRejectionReason(error: unknown, fallback = 'Message rejected.'): string {
  const data = (error as { data?: unknown } | null)?.data
  if (typeof data === 'string') return data
  const refusal = /with status 4\d\d: ([^{<].{0,160})$/.exec(error instanceof Error ? error.message : '')
  return refusal?.[1] ?? fallback
}
