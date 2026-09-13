// Contents of the templates the module renders. Off the module entry for the
// same reason as options.ts. Tests import this file directly.

/**
 * Contents of the fallback type template: placeholder (`any`-typed) ambient
 * declarations for the generated `#convex/*` modules while `convex dev`
 * hasn't emitted codegen yet, so a fresh project typechecks instead of failing
 * on every `#convex/api` import. Once codegen exists the template goes empty
 * and the real generated types win via the tsconfig `paths` the aliases
 * already produce.
 */
export function convexTypeFallbackContents(hasApi: boolean, functionsDir: string): string {
  if (hasApi) {
    // Real codegen resolves through the tsconfig paths — declare nothing so
    // the generated types are the only source of truth.
    return 'export {}\n'
  }
  return [
    `// Placeholder until \`npx convex dev\` generates ${functionsDir}/_generated.`,
    'declare module \'#convex/api\' {',
    '  export const api: any',
    '  export const internal: any',
    '  export const components: any',
    '}',
    'declare module \'#convex/server\' {',
    '  export const query: any',
    '  export const internalQuery: any',
    '  export const mutation: any',
    '  export const internalMutation: any',
    '  export const action: any',
    '  export const internalAction: any',
    '  export const httpAction: any',
    '  export type QueryCtx = any',
    '  export type MutationCtx = any',
    '  export type ActionCtx = any',
    '  export type DatabaseReader = any',
    '  export type DatabaseWriter = any',
    '}',
    'declare module \'#convex/dataModel\' {',
    '  export type Doc<TableName extends string = string> = any',
    '  export type Id<TableName extends string = string> = string',
    '  export type DataModel = any',
    '  export type TableNames = string',
    '}',
    '',
  ].join('\n')
}
