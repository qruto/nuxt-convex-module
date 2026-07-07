import type { OptimisticUpdate } from 'convex/browser'
import type { FunctionArgs, FunctionReference, FunctionReturnType, OptionalRestArgs } from 'convex/server'
import { getFunctionName, makeFunctionReference } from 'convex/server'
import type { Value } from 'convex/values'
import { useConvexOrThrow, type ConvexVueClient } from '../client'

// TODO Typedoc doesn't generate documentation for the comment below perhaps
// because it's a callable interface.
/**
 * An interface to execute a Convex mutation function on the server.
 *
 * @public
 */
export interface VueMutation<Mutation extends FunctionReference<'mutation'>> {
  /**
   * Execute the mutation on the server, returning a `Promise` of its return value.
   *
   * @param args - Arguments for the mutation to pass up to the server.
   * @returns The return value of the server-side function call.
   */
  (...args: OptionalRestArgs<Mutation>): Promise<FunctionReturnType<Mutation>>

  /**
   * Define an optimistic update to apply as part of this mutation.
   *
   * This is a temporary update to the local query results to facilitate a
   * fast, interactive UI. It enables query results to update before a mutation
   * executed on the server.
   *
   * When the mutation is invoked, the optimistic update will be applied.
   *
   * Optimistic updates can also be used to temporarily remove queries from the
   * client and create loading experiences until a mutation completes and the
   * new query results are synced.
   *
   * The update will be automatically rolled back when the mutation is fully
   * completed and queries have been updated.
   *
   * @param optimisticUpdate - The optimistic update to apply.
   * @returns A new `VueMutation` with the update configured.
   *
   * @public
   */
  withOptimisticUpdate<T extends OptimisticUpdate<FunctionArgs<Mutation>>>(
    optimisticUpdate: T
      & (ReturnType<T> extends Promise<any>
        ? 'Optimistic update handlers must be synchronous'
        : {}),
  ): VueMutation<Mutation>
}

// Exported only for testing.
export function createMutation(
  mutationReference: FunctionReference<'mutation'>,
  client: ConvexVueClient,
  update?: OptimisticUpdate<any>,
): VueMutation<any> {
  function mutation(args?: Record<string, Value>): Promise<unknown> {
    assertNotAccidentalArgument(args)

    return client.mutation(mutationReference, args, {
      optimisticUpdate: update,
    })
  }
  mutation.withOptimisticUpdate = function withOptimisticUpdate(
    optimisticUpdate: OptimisticUpdate<any>,
  ): VueMutation<any> {
    if (update !== undefined) {
      throw new Error(
        `Already specified optimistic update for mutation ${getFunctionName(
          mutationReference,
        )}`,
      )
    }
    return createMutation(mutationReference, client, optimisticUpdate)
  }
  return mutation as VueMutation<any>
}

/**
 * Construct a new {@link VueMutation}.
 *
 * Returns a function that you can call to execute a Convex mutation. The
 * returned function is stable for the lifetime of the composable (same
 * reference identity), so it can be safely passed around and memoized.
 *
 * Mutations can optionally be configured with
 * [optimistic updates](https://docs.convex.dev/client/react/optimistic-updates)
 * for instant UI feedback.
 *
 * Throws an error if no Convex client has been provided.
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useMutation } from '#imports'
 * import { api } from '#backend/api'
 *
 * const createTask = useMutation(api.tasks.create)
 *
 * async function handleClick() {
 *   await createTask({ text: 'New task' })
 * }
 * </script>
 * ```
 *
 * @param mutation - A {@link server.FunctionReference} for the public mutation
 * to run like `api.dir1.dir2.filename.func`.
 * @returns The {@link VueMutation} object with that name.
 *
 * @public
 */
export function useMutation<Mutation extends FunctionReference<'mutation'>>(
  mutation: Mutation,
): VueMutation<Mutation> {
  const mutationReference
    = typeof mutation === 'string'
      ? makeFunctionReference<'mutation', any, any>(mutation)
      : mutation

  // Upstream: `useContext(ConvexContext)` plus the in-hook undefined check.
  const convex = useConvexOrThrow('useMutation')
  // Upstream wraps this in `useMemo`; a composable runs once per setup, so
  // the call is already stable.
  return createMutation(mutationReference, convex)
}

/** @public */
export const useConvexMutation = useMutation

// When a function is called with a single argument that looks like a
// DOM Event it was likely called as an event handler. (Upstream detects
// React's SyntheticEvent; Vue event handlers receive native DOM events.)
function assertNotAccidentalArgument(value: any) {
  // these are properties of a DOM Event
  // https://developer.mozilla.org/en-US/docs/Web/API/Event
  if (
    typeof value === 'object'
    && value !== null
    && 'bubbles' in value
    && 'cancelable' in value
    && 'preventDefault' in value
  ) {
    throw new Error(
      `Convex function called with Event object. Did you use a Convex function as an event handler directly? Event handlers like @click receive an event object as their first argument. These Event objects are not valid Convex values. Try wrapping the function like \`const handler = () => myMutation();\` and using \`handler\` in the event handler.`,
    )
  }
}
