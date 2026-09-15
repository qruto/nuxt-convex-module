import type { OptimisticUpdate } from 'convex/browser'
import type { FunctionArgs, FunctionReference, FunctionReturnType } from 'convex/server'
import type { VueMutation } from 'nuxt-convex-module/client'

// The landing page's live plates render with or without a deployment: the
// docs build and a fresh clone have no Convex client, and every plate then
// runs on local state so the stage never reads as broken. These two wrap
// the real composables in that guard so each plate states it once.

/** `useAsyncQuery` when a client exists, else an empty result that never errors. */
export async function useDemoQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: MaybeRefOrGetter<FunctionArgs<Query>>,
) {
  if (useConvex()) return await useAsyncQuery(query, args)
  return {
    data: shallowRef<FunctionReturnType<Query> | undefined>(undefined),
    error: shallowRef<Error | null>(null),
  }
}

/** `useMutation` with its optimistic update when a client exists, else nothing to call. */
export function useDemoMutation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
  update: OptimisticUpdate<FunctionArgs<Mutation>>,
): VueMutation<Mutation> | undefined {
  return useConvex() ? useMutation(mutation).withOptimisticUpdate(update) : undefined
}
