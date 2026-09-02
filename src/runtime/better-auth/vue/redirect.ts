/**
 * Safe handling of the `?redirect=` destination the `auth` route middleware
 * attaches when it sends an unauthenticated visitor to the login page.
 *
 * The middleware only ever writes a router path there, but the query is part
 * of a URL anyone can craft: a link to `/login?redirect=https://evil.example`
 * turns a login page that navigates to `route.query.redirect` verbatim into an
 * open redirect — a phishing primitive that borrows the app's own domain, and
 * one that carries whatever the app appends to the destination.
 *
 * @module better-auth/redirect
 */

/**
 * A base whose only job is to be compared against. Resolving the candidate
 * against it turns "is this same-origin?" into an origin equality check, which
 * the URL parser answers for every escape a hand-written check tends to miss —
 * `//evil.example`, `/\evil.example`, `https://evil.example`, `javascript:`.
 * `.invalid` is reserved by RFC 2606, so it can never be a real origin.
 */
const SENTINEL_ORIGIN = 'http://redirect.invalid'

/**
 * Validate a post-sign-in redirect destination, returning `fallback` unless it
 * is a same-origin path.
 *
 * Use it wherever a login page consumes the `?redirect=` query the `auth`
 * middleware sets — never navigate to that value directly.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * const route = useRoute()
 * const { signIn } = useAuth()
 *
 * async function onSubmit() {
 *   await signIn.email({ email, password })
 *   // '/dashboard' survives; 'https://evil.example' becomes '/'.
 *   await navigateTo(resolveAuthRedirect(route.query.redirect))
 * }
 * </script>
 * ```
 *
 * @param value - Candidate destination, typically `route.query.redirect`. A
 *   repeated query parameter arrives as an array and is rejected: which entry
 *   the app meant is ambiguous, and an attacker chooses the other one.
 * @param fallback - Where to send the visitor when `value` is not a safe
 *   same-origin path. Defaults to `/`, and is returned as given — pass a path
 *   you control, not user input.
 *
 * @returns The normalized `pathname + search + hash`, or `fallback`.
 *
 * @public
 */
export function resolveAuthRedirect(value: unknown, fallback: string = '/'): string {
  if (typeof value !== 'string' || value === '') return fallback
  // A safe destination is always host-relative. Requiring a leading `/` up
  // front rejects `https://…` and scheme-relative forms before parsing, and
  // keeps a bare `evil.example` from resolving into a same-origin path.
  if (!value.startsWith('/')) return fallback
  try {
    const url = new URL(value, SENTINEL_ORIGIN)
    // `//evil.example` and `/\evil.example` parse as authorities, not paths,
    // and so land on another origin.
    if (url.origin !== SENTINEL_ORIGIN) return fallback

    const path = `${url.pathname}${url.search}${url.hash}`
    // Checking the input is not enough: parsing resolves dot segments *inside*
    // the path, so a candidate with one leading slash can serialize to one
    // with two. `/..//evil.example` normalizes to `//evil.example`, which is
    // protocol-relative the moment it leaves this function. Re-resolving the
    // serialized result is what closes that gap — the check above ran against
    // the un-normalized input. Dot segments are gone by now, so this second
    // pass is stable and a third would change nothing.
    if (new URL(path, SENTINEL_ORIGIN).origin !== SENTINEL_ORIGIN) return fallback
    return path
  }
  catch {
    return fallback
  }
}
