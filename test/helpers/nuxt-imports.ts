type TestRuntimeConfig = {
  public?: {
    convex?: {
      url?: string
      siteUrl?: string
      authRoute?: string
    }
  }
}

let runtimeConfig: TestRuntimeConfig = {}
/** The event each `useRuntimeConfig` call was given, in order. */
export const runtimeConfigEvents: unknown[] = []

export function useRuntimeConfig(event?: unknown) {
  runtimeConfigEvents.push(event)
  return runtimeConfig
}

export function setNuxtRuntimeConfigForTests(config: TestRuntimeConfig) {
  runtimeConfig = config
}

export function resetNuxtRuntimeConfigForTests() {
  runtimeConfig = {}
  runtimeConfigEvents.length = 0
}
