import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { APP_COMPONENTS, APP_IMPORTS, SERVER_IMPORTS } from '../../src/registry'
import { at, backticked, interfaceKeys, messagesIn, read, tableFirstCells, walk } from './helpers'

// The docs and the code have to agree — if the docs say the module has
// something, it has it; if the module has something, the docs say so. This
// file makes drift fail CI, in both directions, for every surface a user can
// write against: module options, runtime config, auto-imports and components,
// subpath exports, the messages the module prints, the shape `useBetterAuth()`
// returns, and the experimental tier. Each failure message says what to edit.
//
// It runs in the `static` CI job on every pull request. The `test` job is
// skipped for docs-only changes, so a docs gate there would fail only on main.

const README = read('README.md')
const CONFIGURATION = read('website/content/1.getting-started/3.configuration.md')
const BETTER_AUTH = read('website/content/3.components/2.better-auth.md')
const AUTO_IMPORTS = read('website/content/4.api-reference/1.auto-imports.md')
const SERVER_IMPORTS_PAGE = read('website/content/4.api-reference/2.server-imports.md')
const TROUBLESHOOTING = read('website/content/1.getting-started/6.troubleshooting.md')
const STABILITY = read('STABILITY.md')
const STABILITY_PAGE = read('website/content/1.getting-started/5.stability.md')

const contentPages = walk('website/content', ['.md'])
const handWritten = contentPages.filter(p => !p.includes('/9.reference/'))
const manifest = JSON.parse(read('package.json')) as { exports: Record<string, unknown>, engines: { node: string }, peerDependencies: Record<string, string> }

describe('module options', () => {
  const options = interfaceKeys(at('src/module.ts'), 'ModuleOptions')
  const betterAuthOptions = interfaceKeys(at('src/module.ts'), 'BetterAuthModuleOptions')
  const rows = tableFirstCells(CONFIGURATION, '## Module options')

  it('reads the interfaces', () => {
    expect(options.length).toBeGreaterThan(5)
    expect(betterAuthOptions.length).toBeGreaterThan(1)
  })

  it.each(options)('`%s` has a row in the configuration table', (key) => {
    expect(rows, `\`${key}\` is a ModuleOptions key (src/module.ts) with no row in website/content/1.getting-started/3.configuration.md — add the row or remove the option`).toContain(key)
  })

  it.each(betterAuthOptions)('`betterAuth.%s` has a row in both configuration tables and the README snippet', (key) => {
    expect(rows, `\`betterAuth.${key}\` is a BetterAuthModuleOptions key with no row in 3.configuration.md`).toContain(`betterAuth.${key}`)
    expect(tableFirstCells(BETTER_AUTH, '## Configure'), `\`betterAuth.${key}\` has no row in 3.components/2.better-auth.md's Configure table`).toContain(`betterAuth.${key}`)
    expect(README, `\`${key}\` is not shown in README.md's \`convex: { … }\` snippet`).toContain(`betterAuth: { ${key}:`)
  })

  it.each(rows)('table row `%s` is a real option', (row) => {
    const real = options.includes(row) || (row.startsWith('betterAuth.') && betterAuthOptions.includes(row.slice('betterAuth.'.length)))
    expect(real, `3.configuration.md documents \`${row}\`, which is not a ModuleOptions key — remove the row or add the option`).toBe(true)
  })
})

describe('runtime config', () => {
  const source = read('src/module.ts')
  const block = source.slice(source.indexOf('declare module \'@nuxt/schema\''), source.indexOf('export default defineNuxtModule'))
  const keys = [...block.matchAll(/^\s+(\w+)\??: string/gm)].map(m => m[1]!)
  const snake = (key: string) => key.replace(/[A-Z]/g, c => `_${c}`).toUpperCase()

  it('reads the augmentation', () => {
    expect(new Set(keys)).toEqual(new Set(['url', 'siteUrl', 'crossDomainCallbackRoute', 'loginPath']))
  })

  it.each([...new Set(keys)])('`%s` and its override are on the configuration page', (key) => {
    expect(CONFIGURATION).toContain(`runtimeConfig.public.convex.${key}`)
    expect(CONFIGURATION).toContain(`NUXT_PUBLIC_CONVEX_${snake(key)}`)
  })

  it('documents the private key and its override', () => {
    expect(CONFIGURATION).toContain('runtimeConfig.convex.siteUrl')
    expect(CONFIGURATION).toContain('NUXT_CONVEX_SITE_URL')
  })
})

describe('auto-imports and components', () => {
  const flat = (record: Record<string, Array<{ name: string, from: string }>>) => Object.values(record).flat()
  const appImports = flat(APP_IMPORTS)
  const components = flat(APP_COMPONENTS)
  const serverImports = flat(SERVER_IMPORTS)

  it.each([...appImports, ...components, ...serverImports])('$name comes from a file that exists', ({ from }) => {
    expect(['.ts', '.vue'].some(ext => existsSync(at(`src/${from}${ext}`))), `src/${from} does not exist`).toBe(true)
  })

  it.each(appImports.map(e => e.name))('`%s` is on the app auto-imports page and in the README', (name) => {
    expect(backticked(AUTO_IMPORTS).some(t => t.includes(name)), `\`${name}\` is registered by addImports (src/registry.ts) but never appears in 4.api-reference/1.auto-imports.md — add it to a table`).toBe(true)
    expect(backticked(README).some(t => t.includes(name)), `\`${name}\` is registered by addImports but never appears in README.md`).toBe(true)
  })

  it.each(components.map(e => e.name))('<%s> is on the app auto-imports page and in the README', (name) => {
    expect(AUTO_IMPORTS, `<${name}> is registered by addComponent (src/registry.ts) but never appears in 1.auto-imports.md`).toContain(`<${name}>`)
    expect(README, `<${name}> is registered by addComponent but never appears in README.md`).toContain(`<${name}>`)
  })

  it.each(serverImports.map(e => e.name))('`%s` is on the server auto-imports page and in the README', (name) => {
    expect(backticked(SERVER_IMPORTS_PAGE).some(t => t.includes(name)), `\`${name}\` is registered by addServerImports (src/registry.ts) but never appears in 4.api-reference/2.server-imports.md`).toBe(true)
    expect(backticked(README).some(t => t.includes(name)), `\`${name}\` is registered by addServerImports but never appears in README.md`).toBe(true)
  })
})

describe('subpath exports', () => {
  const keys = Object.keys(manifest.exports).filter(k => k !== './package.json')
  const known = new Set(keys.map(k => k === '.' ? 'nuxt-convex-module' : `nuxt-convex-module${k.slice(1)}`))

  const mentions = [
    { file: 'README.md', text: README },
    ...contentPages.map(file => ({ file, text: read(file) })),
  ].flatMap(({ file, text }) => [...text.matchAll(/(?<=['"`])nuxt-convex-module(?:\/[a-z0-9/-]+)?(?=['"`])/g)].map(m => ({ file, specifier: m[0] })))

  it.each([...new Set(mentions.map(m => m.specifier))])('%s, named in the docs, is a real subpath', (specifier) => {
    const where = mentions.filter(m => m.specifier === specifier).map(m => m.file).slice(0, 3).join(', ')
    expect(known.has(specifier), `${specifier} is imported in ${where} but is not a key of package.json exports`).toBe(true)
  })

  const tables = [
    { file: 'README.md', text: README },
    { file: 'website/content/4.api-reference/index.md', text: read('website/content/4.api-reference/index.md') },
  ]
  it.each(keys)('%s is in the README and API-reference subpath tables', (key) => {
    const specifier = key === '.' ? 'nuxt-convex-module' : `nuxt-convex-module${key.slice(1)}`
    const alias = key.endsWith('/vue') || key === './vue' ? `(alias \`${key.slice(1)}\`)` : undefined
    for (const { file, text } of tables) {
      expect(text.includes(`| \`${specifier}\``) || (alias !== undefined && text.includes(alias)), `${key} is a package.json export with no row (or alias mention) in ${file}'s subpath table`).toBe(true)
    }
  })
})

describe('troubleshooting', () => {
  const sources = walk('src', ['.ts'], path => path.includes('devtools'))
  const messages = sources.flatMap(messagesIn)

  // Not documented, on purpose. The text is where the reader would look for it.
  const EXCLUDED = [
    'ConvexVueClient.watchPaginatedQuery is not supported', // @internal; unreachable without a cast
    'Tried to add a new query with identifier', // QueriesObserver invariant — a bug, not a user action
    'No query found with identifier', // same
    'Client created with undefined deployment address', // getConvexUrl resolves a string first
    'Invalid deployment address: found', // same
  ]
  const fences = [...TROUBLESHOOTING.matchAll(/```text\n([\s\S]*?)```/g)].map(m => m[1]!.trim())
  const quoted = fences.join('\n')
  const pieces = (text: string) => text.split('…').map(p => p.replace(/\s+/g, ' ').trim()).filter(p => p.length >= 25)

  it('finds the messages', () => {
    expect(messages.length).toBeGreaterThan(40)
    expect(fences.length).toBeGreaterThan(30)
  })

  const documented = messages.filter(m => !EXCLUDED.some(prefix => m.text.startsWith(prefix)) && pieces(m.text).length > 0)
  it.each(documented.map(m => [`${m.file.replace(`${process.cwd()}/`, '')}:${m.line}`, m] as const))('%s is quoted on the troubleshooting page', (_where, message) => {
    for (const piece of pieces(message.text)) {
      expect(
        quoted.replace(/\s+/g, ' ').includes(piece),
        `${message.kind} at ${_where} says "${message.text}" but 6.troubleshooting.md never quotes it — add an entry (a \`\`\`text fence with the message verbatim, \`…\` for interpolations), or add it to EXCLUDED with a reason`,
      ).toBe(true)
    }
  })

  it.each(fences.map((f, i) => [i + 1, f] as const))('quoted message #%s still exists in the source', (_n, fence) => {
    for (const piece of pieces(fence)) {
      expect(
        messages.some(m => m.text.replace(/\s+/g, ' ').includes(piece)),
        `6.troubleshooting.md quotes "${piece}" but no message in src/ contains it — the wording changed; update the entry`,
      ).toBe(true)
    }
  })
})

describe('useBetterAuth() and useConvexAuth() destructuring', () => {
  const authKeys = new Set(interfaceKeys(at('src/runtime/better-auth/vue/use-better-auth.ts'), 'UseBetterAuthReturn'))
  const convexAuthKeys = new Set(['isLoading', 'isAuthenticated', 'isRefreshing'])
  // The Clerk and Auth0 adapters destructure the *provider's* `useAuth`, not `useBetterAuth`.
  const files = ['README.md', ...contentPages, ...walk('src', ['.ts'], path => /\/(?:clerk|auth0)\//.test(path))]
  const uses = files.flatMap(file => [...read(file).matchAll(/const \{([^}]+)\} = (useBetterAuth|useConvexAuth)\(/g)].map(m => ({ file, keys: m[1]!.split(',').map(k => k.trim().split(':')[0]!.trim()).filter(Boolean), fn: m[2]! })))

  it('finds the idiom', () => {
    expect(uses.length).toBeGreaterThan(3)
  })

  it.each(uses.map(u => [`${u.file.replace(`${process.cwd()}/`, '')} ${u.fn}`, u] as const))('%s destructures real fields', (_where, use) => {
    const real = use.fn === 'useBetterAuth' ? authKeys : convexAuthKeys
    for (const key of use.keys) {
      expect(real.has(key), `${_where} destructures \`${key}\`, which ${use.fn}() does not return — the fields are ${[...real].join(', ')}`).toBe(true)
    }
  })
})

describe('stability', () => {
  const section = (text: string) => text.slice(text.indexOf('**Experimental**'), text.indexOf('**Internal**'))
  const identifiers = (text: string) => new Set(backticked(section(text)).map(t => t.replace(/^<|>$/g, '').replace(/\(\)$/, '').split('.').pop()!).filter(t => /^[a-z_$][\w$]*$/i.test(t)))
  const listed = identifiers(STABILITY)
  const source = walk('src', ['.ts']).map(read).join('\n')

  it('lists the same experimental symbols in STABILITY.md and on the stability page', () => {
    expect(identifiers(STABILITY_PAGE)).toEqual(listed)
    expect(listed.size).toBeGreaterThan(5)
  })

  it.each([...listed])('`%s` exists in src/', (name) => {
    expect(new RegExp(`\\b${name}\\b`).test(source), `STABILITY.md lists \`${name}\` as experimental but nothing in src/ declares it`).toBe(true)
  })

  // The supported-versions table is the one place a reader sees the ranges;
  // package.json is where they change.
  it.each(Object.entries(manifest.peerDependencies))('`%s` range %s is in both supported-versions tables', (pkg, range) => {
    const row = `| \`${pkg}\` | \`${range}\` |`
    expect(STABILITY, `STABILITY.md's supported-versions table has no row for ${pkg}@${range}`).toContain(row)
    expect(STABILITY_PAGE, `the stability page's supported-versions table has no row for ${pkg}@${range}`).toContain(row)
  })
})

describe('contributor docs cite real CI jobs', () => {
  const jobIds = new Set([...read('.github/workflows/ci.yml').matchAll(/^ {2}([a-z-]+):$/gm)].map(m => m[1]!))
  const hooksTable = read('CONTRIBUTING.md').match(/\| Hook \| Runs \| Mirrors[\s\S]*?\n\n/)?.[0] ?? ''
  const cited = [...hooksTable.matchAll(/`([a-z-]+)` ·/g)].map(m => m[1]!)
  const inHooks = ['.githooks/pre-commit', '.githooks/pre-push'].flatMap(f => [...read(f).matchAll(/`([a-z-]+)` job/g)].map(m => m[1]!))

  it('reads the workflow', () => {
    expect(jobIds.has('static')).toBe(true)
    expect(cited.length + inHooks.length).toBeGreaterThan(3)
  })

  it.each([...new Set([...cited, ...inHooks])])('`%s` is a job in ci.yml', (job) => {
    expect(jobIds.has(job), `CONTRIBUTING.md or a git hook cites a \`${job}\` job; ci.yml has ${[...jobIds].join(', ')}`).toBe(true)
  })
})

describe('README', () => {
  it('links no raw docs sources and serves its hero from an absolute URL', () => {
    expect(README).not.toContain('](./website/content/')
    for (const src of README.matchAll(/(?:srcset|src)="([^"]+)"/g)) expect(src[1], 'npm does not rewrite relative image sources').toMatch(/^https:\/\//)
  })

  it('states the Nuxt and Node floors the module enforces', () => {
    const nuxtFloor = read('src/module.ts').match(/nuxt: '>=(\d+\.\d+)/)?.[1]
    const nodeFloor = manifest.engines.node.match(/>=(\d+\.\d+)/)?.[1]
    expect(nuxtFloor && nodeFloor).toBeTruthy()
    for (const [file, text] of [['README.md', README], ['2.installation.md', read('website/content/1.getting-started/2.installation.md')]]) {
      expect(text, `${file} does not state Nuxt ≥ ${nuxtFloor}`).toMatch(new RegExp(`Nuxt\\s*(>=|≥)\\s*${nuxtFloor!.replace('.', '\\.')}`))
      expect(text, `${file} does not state Node ≥ ${nodeFloor}`).toMatch(new RegExp(`Node\\s*(>=|≥)\\s*${nodeFloor!.replace('.', '\\.')}`))
    }
  })
})

describe('section indexes', () => {
  it.each(walk('website/content', ['index.md']).filter(f => /\/\d\.[a-z-]+\/index\.md$/.test(f)))('%s links every sibling page', (indexFile) => {
    const dir = indexFile.slice(0, indexFile.lastIndexOf('/'))
    const section = dir.slice(dir.lastIndexOf('/') + 1).replace(/^\d+\./, '')
    const text = read(indexFile)
    for (const page of walk(dir, ['.md']).filter(p => p !== indexFile && !p.slice(dir.length + 1).includes('/'))) {
      const slug = page.slice(dir.length + 1).replace(/^\d+\./, '').replace(/\.md$/, '')
      if (slug === 'index') continue
      expect(text, `${indexFile.replace(`${process.cwd()}/`, '')} does not link /${section}/${slug}`).toContain(`/${section}/${slug})`)
    }
  })
})

describe('hand-written pages', () => {
  it('exist', () => {
    expect(handWritten.length).toBeGreaterThan(20)
  })
})
