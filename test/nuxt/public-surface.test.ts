import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

// The published surface, recorded. What 1.0 promises is exactly this: every
// `package.json` subpath, and every value and type reachable from it. A new
// symbol here is a deliberate act — it becomes API that only a major can take
// away. A missing one is a breaking change. Neither happens by accident:
// change the literal below in the same commit, and let the diff say so.
//
// Two halves. The runtime half imports each barrel and reads `Object.keys`.
// The type half asks the TypeScript checker — `getExportsOfModule` — because
// most of `./client` is type-only and never reaches `Object.keys`. The checker
// also sees which declarations carry `@internal`: `stripInternal` drops those
// from the emitted `.d.ts`, so a tagged symbol on the type surface would ship
// as a dangling name, and a tagged value is public at runtime but invisible to
// the consumer's editor. Both are recorded, on purpose, below.
//
// Related gates, for scope: package-contract.test.ts reads peer ranges,
// upstream-exports.test.ts reads *upstream's* surface, scripts/check-tarball.mjs
// reads specifiers, scripts/check-consumer-types.mjs compiles one app. None of
// them records this package's export names. The TypeDoc drift gate pins the
// *documented* surface; this pins the *reachable* one, and the `@internal`
// rule is what keeps the two equal.

// The nuxt environment gives `import.meta.url` an http: scheme; vitest runs
// from the repository root, which is also this project's `rootDir`.
const root = process.cwd()
const at = (file: string) => resolve(root, file)
const read = (file: string) => readFileSync(at(file), 'utf8')
const manifest = JSON.parse(read('package.json')) as {
  exports: Record<string, string | { types: string, import: string }>
  typesVersions: Record<'*', Record<string, string[]>>
}

interface Entry {
  /** The barrel behind the subpath. */
  source: string
  /** Another subpath this one is a byte-for-byte alias of. */
  aliasOf?: string
  values: string[]
  types: string[]
  /**
   * Values that are `@internal` — present at runtime, stripped from the
   * published types — because upstream ships them exactly that way.
   */
  runtimeOnly?: string[]
}

const ENTRY: Record<string, Entry> = {
  '.': {
    source: 'src/module.ts',
    values: ['default'],
    types: ['BetterAuthModuleOptions', 'ModuleOptions'],
  },
  './client': {
    source: 'src/runtime/vue/index.ts',
    values: [
      'AuthLoading', 'AuthRefreshing', 'Authenticated', 'Unauthenticated',
      'ConvexApiKey', 'ConvexAuthStateKey', 'ConvexClientKey', 'ConvexVueClient',
      'createConvexAuthState', 'createScopedConvexAuthState', 'provideConvexAuth', 'useConvexAuth',
      'insertAtBottomIfLoaded', 'insertAtPosition', 'insertAtTop', 'optimisticallyUpdateValueInPaginatedQuery',
      'resetPaginationId',
      'provideConvexApi', 'useConvexApi', 'useConvexNamespace',
      'useConvex', 'useConvexConnectionState', 'usePreloadedQuery', 'useSubscription',
      'useQuery', 'useQuery_experimental', 'useQueries', 'useMutation', 'useAction',
      'usePaginatedQuery', 'usePaginatedQuery_experimental',
      'useUpload', 'uploadFile', 'useUploadQueue', 'useStorageUrl',
      // `useConvex*` aliases of the above — PARITY A-01. Deliberate duplicates,
      // frozen with everything else; see STABILITY.md before "cleaning up".
      'useConvexAction', 'useConvexMutation', 'useConvexPaginatedQuery', 'useConvexQueries', 'useConvexQuery',
      'useConvexStorageUrl', 'useConvexUpload', 'useConvexUploadQueue',
    ],
    types: [
      'ArgsAndOptions', 'AuthTokenFetcher', 'ConnectionState', 'ConvexApi', 'ConvexAuthProviderOptions',
      'ConvexAuthState', 'ConvexLogger', 'ConvexVueClientOptions', 'FunctionArgs', 'FunctionReference',
      'FunctionReturnType', 'GenerateUploadUrl', 'GetStorageUrl', 'IConvexVueClient', 'MutationOptions',
      'OptimisticUpdate', 'OptionalRestArgs', 'OptionalRestArgsOrSkip', 'PaginatedQueryArgs', 'PaginatedQueryItem',
      'PaginatedQueryReference', 'PaginatedWatch', 'PaginationStatus', 'Preloaded', 'QueryJournal', 'QueryOptions',
      'RequestForQueries', 'StorageId', 'UploadFileOptions', 'UploadItemStatus', 'UploadQueueItem',
      'UsePaginatedQueryObjectReturnType', 'UsePaginatedQueryOptions', 'UsePaginatedQueryResult',
      'UsePaginatedQueryReturnType', 'UseQueryResult', 'UseUploadOptions', 'UseUploadQueueOptions', 'Value',
      'VueAction', 'VueMutation', 'VueMutationOptions', 'VueUpload', 'VueUploadQueue', 'Watch', 'WatchQueryOptions',
    ],
    // Upstream's `react/index.js` exports it; `react/index.d.ts` does not.
    runtimeOnly: ['useSubscription'],
  },
  './vue': { source: 'src/runtime/vue/index.ts', aliasOf: './client', values: [], types: [] },
  './server': {
    source: 'src/runtime/nuxt/index.ts',
    values: ['fetchAction', 'fetchMutation', 'fetchQuery', 'preloadQuery', 'preloadedQueryResult'],
    types: ['NuxtOptions'],
  },
  './app': {
    source: 'src/runtime/nuxt/app.ts',
    values: ['useAsyncQuery', 'useConvexAsyncQuery'],
    types: ['AsyncQueryData', 'AsyncQueryOptions', 'AsyncQueryReturn', 'AsyncQueryStatus'],
  },
  './better-auth/client': {
    source: 'src/runtime/better-auth/vue/index.ts',
    values: [
      'AuthBoundary', 'authClient', 'consumeCrossDomainOneTimeToken', 'convexClient', 'crossDomainClient',
      'resolveAuthRedirect', 'useAuth', 'usePreloadedAuthQuery',
    ],
    types: ['AuthClient', 'AuthSession', 'AuthUser', 'ConsumeCrossDomainOneTimeTokenOptions', 'UseAuthService'],
  },
  './better-auth/vue': { source: 'src/runtime/better-auth/vue/index.ts', aliasOf: './better-auth/client', values: [], types: [] },
  './better-auth/server': {
    source: 'src/runtime/better-auth/nuxt/server.ts',
    values: ['convexAuth', 'convexBetterAuthNuxt'],
    types: ['ConvexAuthOptions', 'ConvexAuthService'],
  },
  './polar/client': {
    source: 'src/runtime/polar/vue/components.ts',
    values: ['CheckoutLink', 'CustomerPortalLink'],
    types: ['CheckoutArgs', 'PolarComponentApi'],
  },
  './polar/vue': { source: 'src/runtime/polar/vue/components.ts', aliasOf: './polar/client', values: [], types: [] },
  './clerk/client': {
    source: 'src/runtime/clerk/vue/index.ts',
    values: ['ConvexProviderWithClerk', 'provideConvexAuthFromClerk'],
    types: ['ConvexProviderWithClerkOptions', 'UseAuth'],
  },
  './clerk/vue': { source: 'src/runtime/clerk/vue/index.ts', aliasOf: './clerk/client', values: [], types: [] },
  './auth0/client': {
    source: 'src/runtime/auth0/vue/index.ts',
    values: ['ConvexProviderWithAuth0', 'provideConvexAuthFromAuth0'],
    types: ['ConvexProviderWithAuth0Options'],
  },
  './auth0/vue': { source: 'src/runtime/auth0/vue/index.ts', aliasOf: './auth0/client', values: [], types: [] },
}

const canonical = (subpath: string): [string, Entry] => {
  const entry = ENTRY[subpath]!
  return entry.aliasOf ? [entry.aliasOf, ENTRY[entry.aliasOf]!] : [subpath, entry]
}
const sorted = (names: string[]) => [...names].sort()

describe('package.json', () => {
  const exportKeys = Object.keys(manifest.exports).filter(k => k !== './package.json')

  it('exports exactly the subpaths recorded here', () => {
    expect(sorted(exportKeys)).toEqual(sorted(Object.keys(ENTRY)))
  })

  it('typesVersions mirrors exports key for key', () => {
    const expected = exportKeys.map(k => (k === '.' ? '.' : k.slice(2)))
    expect(sorted(Object.keys(manifest.typesVersions['*']))).toEqual(sorted(expected))
  })

  it.each(exportKeys)('%s resolves to the build of its recorded source', (subpath) => {
    const target = manifest.exports[subpath]!
    const entry = ENTRY[subpath]!
    expect(typeof target).toBe('object')
    const { types, import: js } = target as { types: string, import: string }
    if (subpath === '.') {
      expect(types).toBe('./dist/types.d.mts')
      expect(js).toBe('./dist/module.mjs')
      return
    }
    const built = `./dist/${entry.source.replace(/^src\//, '').replace(/\.ts$/, '')}`
    expect(js).toBe(`${built}.js`)
    expect(types).toBe(`${built}.d.ts`)
    expect(manifest.typesVersions['*'][subpath.slice(2)]).toEqual([types])
  })

  it.each(Object.entries(ENTRY).filter(([, e]) => e.aliasOf))('%s is a byte-for-byte alias', (subpath, entry) => {
    expect(manifest.exports[subpath]).toEqual(manifest.exports[entry.aliasOf!])
    expect(entry.source).toBe(ENTRY[entry.aliasOf!]!.source)
  })
})

describe('runtime surface', () => {
  it.each(Object.keys(ENTRY))('%s exports exactly the recorded values', async (subpath) => {
    const [, entry] = canonical(subpath)
    const mod = await import(/* @vite-ignore */ at(entry.source)) as Record<string, unknown>
    expect(sorted(Object.keys(mod))).toEqual(sorted(entry.values))
  })
})

describe('type surface', () => {
  // One program over every barrel, with the repo's own tsconfig so the `#app`,
  // `#imports` and `#convex/*` aliases resolve the way `vue-tsc` sees them.
  const tsconfigPath = at('tsconfig.json')
  const config = ts.readConfigFile(tsconfigPath, ts.sys.readFile)
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root)
  const sources = [...new Set(Object.values(ENTRY).map(e => at(e.source)))]
  const program = ts.createProgram(sources, { ...parsed.options, noEmit: true })
  const checker = program.getTypeChecker()

  /** Mirrors `stripInternal`: any leading comment containing `@internal`. */
  const isInternal = (declaration: ts.Declaration): boolean => {
    const text = declaration.getSourceFile().text
    // For `export { x } from`, the comment sits on the export statement.
    const node = ts.isExportSpecifier(declaration) ? declaration.parent.parent : declaration
    const ranges = ts.getLeadingCommentRanges(text, node.getFullStart()) ?? []
    return ranges.some(range => text.slice(range.pos, range.end).includes('@internal'))
  }

  const surface = (source: string) => {
    const file = program.getSourceFile(at(source))!
    const symbol = checker.getSymbolAtLocation(file)!
    const values: string[] = []
    const types: string[] = []
    const internal: string[] = []
    for (const exported of checker.getExportsOfModule(symbol)) {
      const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported
      ;(target.flags & ts.SymbolFlags.Value ? values : types).push(exported.name)
      const declarations = [...(exported.declarations ?? []), ...(target.declarations ?? [])]
      if (declarations.some(isInternal)) internal.push(exported.name)
    }
    return { values: sorted(values), types: sorted(types), internal: sorted([...new Set(internal)]) }
  }

  const canonicalEntries = Object.entries(ENTRY).filter(([, e]) => !e.aliasOf)

  it.each(canonicalEntries)('%s exports exactly the recorded types', (_subpath, entry) => {
    expect(surface(entry.source).types).toEqual(sorted(entry.types))
  })

  it.each(canonicalEntries)('%s agrees with the runtime half on values', (_subpath, entry) => {
    expect(surface(entry.source).values).toEqual(sorted(entry.values))
  })

  it.each(canonicalEntries)('%s reaches no @internal declaration except the recorded runtime-only ones', (_subpath, entry) => {
    expect(
      surface(entry.source).internal,
      'an `@internal` symbol reachable from a subpath ships at runtime but is stripped from the types — '
      + 'drop the tag, stop exporting it, or record it in `runtimeOnly` with the upstream precedent',
    ).toEqual(sorted(entry.runtimeOnly ?? []))
  })
})

describe('typedoc.json', () => {
  it('documents every subpath that is not an alias', () => {
    const json = read('typedoc.json').replace(/^\s*\/\/.*$/gm, '')
    const { entryPoints } = JSON.parse(json) as { entryPoints: string[] }
    const documented = Object.entries(ENTRY)
      .filter(([subpath, e]) => subpath !== '.' && !e.aliasOf)
      .map(([, e]) => e.source)
    expect(sorted(entryPoints)).toEqual(sorted(documented))
  })

  it.each(Object.values(ENTRY).map(e => e.source))('%s exists', (source) => {
    expect(existsSync(at(source))).toBe(true)
  })
})
