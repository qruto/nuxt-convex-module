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
