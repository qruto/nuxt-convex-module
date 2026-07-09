import { useRuntimeConfig } from '#imports'

type ConvexRuntimeConfig = {
  convex?: {
    siteUrl?: string
  }
  public?: {
    convex?: {
      url?: string
      siteUrl?: string
    }
  }
}

export function getConvexRuntimeConfig() {
  try {
    const config = useRuntimeConfig() as ConvexRuntimeConfig
    return {
      url: config.public?.convex?.url,
      siteUrl: config.convex?.siteUrl || config.public?.convex?.siteUrl,
    }
  }
  catch {
    return {}
  }
}
