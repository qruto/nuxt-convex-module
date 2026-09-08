import { makeFunctionReference } from 'convex/server'

// Shared function references for the type tests. Typed exactly the way Convex's
// own codegen types an `api.*` entry, so the assertions in this directory are
// about the composables' generics rather than about how the reference was made.

export interface Task {
  _id: string
  text: string
  done: boolean
}

export const listTasks = makeFunctionReference<
  'query',
  { onlyDone: boolean },
  Task[]
>('tasks:list')

/** A query taking no arguments — exercises the `OptionalRestArgs` branch. */
export const countTasks = makeFunctionReference<
  'query',
  Record<string, never>,
  number
>('tasks:count')

export const addTask = makeFunctionReference<
  'mutation',
  { text: string },
  string
>('tasks:add')

export const summarize = makeFunctionReference<
  'action',
  { id: string },
  { summary: string }
>('tasks:summarize')
