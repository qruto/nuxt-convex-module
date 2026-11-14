// Stand-in for `nuxt/server` in the unit projects: the real one imports
// Nitro-only virtual modules. Runtime config is the `#imports` stand-in's.
export { useRuntimeConfig } from './nuxt-imports'

export const defineEventHandler = <Handler>(handler: Handler) => handler

export function createError(input: { status: number, statusText?: string }) {
  return Object.assign(new Error(input.statusText), input)
}

export function getRouterParam(
  event: { context: { params?: Record<string, string | undefined> } },
  name: string,
  options?: { decode?: boolean },
) {
  const value = event.context.params?.[name]
  return value !== undefined && options?.decode ? decodeURIComponent(value) : value
}

// The request and cookie helpers, over the parts of the event the runtime
// touches: a web `Request`, and a response whose headers collect `Set-Cookie`.
type CookieAttributes = { path?: string, domain?: string, maxAge?: number, httpOnly?: boolean, secure?: boolean, sameSite?: string }

export const getRequestURL = (event: { req: Request }) => new URL(event.req.url)

export function getCookie(event: { req: Request }, name: string): string | undefined {
  const pair = (event.req.headers.get('cookie') ?? '').split('; ').find(entry => entry.startsWith(`${name}=`))
  return pair?.slice(name.length + 1)
}

export function setCookie(event: { res: { headers: Headers } }, name: string, value: string, options: CookieAttributes = {}): void {
  const attributes = [
    `${name}=${value}`,
    options.path && `Path=${options.path}`,
    options.maxAge !== undefined && `Max-Age=${options.maxAge}`,
    options.httpOnly && 'HttpOnly',
    options.secure && 'Secure',
    options.sameSite && `SameSite=${options.sameSite}`,
  ]
  event.res.headers.append('set-cookie', attributes.filter(Boolean).join('; '))
}

export function deleteCookie(event: { res: { headers: Headers } }, name: string, options: CookieAttributes = {}): void {
  setCookie(event, name, '', { ...options, maxAge: 0 })
}
