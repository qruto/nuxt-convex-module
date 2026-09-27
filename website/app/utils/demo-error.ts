/**
 * The clean reason out of a rejected demo mutation. The shared table's
 * guarded mutations (moderation, rate windows, the clear cooldown) throw
 * `ConvexError` with a plain-string payload — the only part that survives
 * redaction on a production deployment — so rejections render as sentences,
 * not `[Request ID …] Server Error` dumps. Anything else — a network or
 * upload failure — gets `fallback`.
 */
export function demoRejectionReason(error: unknown, fallback = 'Message rejected.'): string {
  const data = (error as { data?: unknown } | null)?.data
  return typeof data === 'string' ? data : fallback
}
