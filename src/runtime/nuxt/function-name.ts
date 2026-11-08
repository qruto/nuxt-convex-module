// PARITY: D-17
// The browser client names the function in every error it throws
// (`[CONVEX M(billing:checkout)] …`, convex's `createHybridErrorStacktrace`);
// `ConvexHttpClient` names none, so a failed server call says nothing about
// which function it ran. Prefix the message in the browser's form, on the
// error that was thrown: a `ConvexError` keeps its class and `data`. An error
// that already carries a prefix, or whose message cannot be written (a
// `DOMException`'s is a getter), is rethrown untouched.
import { getFunctionName } from 'convex/server'

const SOURCE_PREFIX = { query: 'Q', mutation: 'M', action: 'A' } as const

/** What each prefixed error said before the prefix, and the stack it had then. */
const unnamed = new WeakMap<Error, { message: string, stack: string | undefined }>()

/** `call`, with the function's name put in front of the message of the error it rejects with. */
export async function withFunctionName<T>(
  source: keyof typeof SOURCE_PREFIX,
  reference: Parameters<typeof getFunctionName>[0],
  call: Promise<T>,
): Promise<T> {
  try {
    return await call
  }
  catch (error) {
    if (error instanceof Error && !error.message.startsWith('[CONVEX ')) name(error, `[CONVEX ${SOURCE_PREFIX[source]}(${getFunctionName(reference)})] `)
    throw error
  }
}

function name(error: Error, prefix: string): void {
  const original = error.message
  // Read first: V8 formats the stack on first read, from the message as it is then.
  const stack = error.stack
  try {
    error.message = `${prefix}${original}`
  }
  catch {
    // A read-only message: leave the error exactly as it was thrown.
    return
  }
  if (error.message !== `${prefix}${original}`) return
  unnamed.set(error, { message: original, stack })
  // Only the header V8 writes, `<name>: <message>`: a message such as
  // `Error` also matches the name, and other engines' stacks carry no header.
  const header = `${error.name}: ${original}`
  if (original && stack?.startsWith(header)) error.stack = `${error.name}: ${error.message}${stack.slice(header.length)}`
}

/**
 * `read(error)`, with the error showing the message it was thrown with while
 * `read` runs: the same object, prefix taken off and put back after. For a
 * check written against the message the server sent (F-01's
 * `jwtCache.isAuthError`), which a function's path in the prefix must not
 * satisfy (`/auth/i` against `[CONVEX A(auth:sendWelcome)] …`). @internal
 */
export function withoutFunctionName<T>(error: unknown, read: (error: unknown) => T): T {
  const before = error instanceof Error ? unnamed.get(error) : undefined
  if (!before) return read(error)
  const named = error as Error
  const { message, stack } = named
  named.message = before.message
  named.stack = before.stack
  try {
    return read(error)
  }
  finally {
    named.message = message
    named.stack = stack
  }
}
