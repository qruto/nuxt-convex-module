import { lstatSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { APP_COMPONENTS, APP_IMPORTS, SERVER_IMPORTS } from '../../src/registry'
import { at, contentFile, frontmatter, read, walk } from './helpers'

// The agent-facing surface: the skills the site publishes at
// /.well-known/skills/ and the one prompt that installs the module with an
// agent. (The hook that writes commands into the Markdown agents read is
// tested in test/unit/agent-markdown.test.ts — it imports website code.)
// An agent follows a skill to the letter and never asks whether a name is
// real, so the names, links and floors in it are held to the code here.

const SKILLS_DIR = 'website/skills'
const SITE = 'https://nuxt-convex-module.dev'
const skills = readdirSync(at(SKILLS_DIR))

describe('published skills', () => {
  // The skills CLI rejects the site's whole index when one entry is invalid,
  // so these hold for every skill there, the contributor one included.
  it('finds the module skill', () => {
    expect(skills).toContain('nuxt-convex-module')
  })

  it.each(skills)('%s follows the Agent Skills spec', (name) => {
    const dir = `${SKILLS_DIR}/${name}`
    expect(lstatSync(at(dir)).isSymbolicLink(), `${dir} is a symlink — Docus skips those, so it would not be published`).toBe(false)
    const skill = read(`${dir}/SKILL.md`)
    const meta = frontmatter(skill)
    expect(meta.name, `${dir}/SKILL.md needs a \`name\` equal to its directory — the skills CLI requires it`).toBe(name)
    expect(name).toMatch(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)
    expect(name).not.toContain('--')
    expect(name.length).toBeLessThanOrEqual(64)
    expect(meta.description?.length ?? 0).toBeGreaterThan(0)
    expect(meta.description!.length, 'description is capped at 1024 characters').toBeLessThanOrEqual(1024)
    const allowed = ['name', 'description', 'license', 'compatibility', 'metadata', 'allowed-tools']
    for (const key of Object.keys(meta)) expect(allowed, `\`${key}\` is not an Agent Skills frontmatter key; claude.ai rejects the upload`).toContain(key)
    expect(skill.split('\n').length, 'keep SKILL.md under 500 lines — move detail to references/').toBeLessThanOrEqual(500)
  })
})

describe('the nuxt-convex-module skill', () => {
  const dir = `${SKILLS_DIR}/nuxt-convex-module`
  const files = walk(dir, ['.md']).map(f => f.slice(f.indexOf(dir)))
  const links = files.flatMap(file => [...read(file).matchAll(/\]\(([^)\s]+)\)|(https:\/\/nuxt-convex-module\.dev[^\s)`'"]*)/g)]
    .map(m => ({ file, href: (m[1] ?? m[2])!.replace(/[.,;:]$/, '') })))

  it.each(links.filter(l => !/^[a-z]+:/.test(l.href)).map(l => [`${l.file} → ${l.href}`, l] as const))('%s stays inside the skill', (_where, { file, href }) => {
    // Served from /.well-known/skills/, a link out of the skill folder 404s.
    const target = new URL(href.split('#')[0]!, `file:///${file}`).pathname.slice(1)
    expect(target.startsWith(`${dir}/`), `${file} links ${href}, outside the skill`).toBe(true)
    expect(files, `${file} links ${href}, which does not exist`).toContain(target)
  })

  const pages = links.filter(l => l.href.startsWith(`${SITE}/raw/`))
  it('links the docs as Markdown', () => {
    expect(pages.length).toBeGreaterThan(15)
  })

  it.each([...new Set(pages.map(l => l.href))])('%s is a page on the site', (href) => {
    const route = href.slice(`${SITE}/raw`.length).replace(/\.md$/, '').replace(/\/index$/, '')
    expect(() => contentFile(route)).not.toThrow()
  })

  // Names shaped like this module's API. The plain Convex and Nuxt names an
  // agent also writes (`query`, `ctx.db`, `useState`) don't match; the
  // React-flavoured guesses (`useConvexClient`, `<ConvexProvider>`) do.
  const API_NAME = /\b(?:(?:use|provide)Convex\w*|use(?:Query|Queries|Mutation|Action|Upload|UploadQueue|StorageUrl|PreloadedQuery|PreloadedAuthQuery|PaginatedQuery|AsyncQuery|AsyncPaginatedQuery|BetterAuth)(?:_experimental)?|fetch(?:Query|Mutation|Action)|preload(?:Query|edQueryResult)|convex(?:Auth|BetterAuth)\w*|uploadFile|resolveAuthRedirect)\b/g
  const API_TAG = /<((?:Convex|Auth)[A-Z]\w*|(?:Un)?[Aa]uthenticated|CheckoutLink|CustomerPortalLink)\b/g
  const registered = new Set([APP_IMPORTS, APP_COMPONENTS, SERVER_IMPORTS].flatMap(r => Object.values(r).flat().map(e => e.name)))
  const exported = new Set(walk('src/runtime', ['.ts']).flatMap(f => [
    ...[...read(f).matchAll(/export (?:declare )?(?:async )?(?:function|const|class|interface|type) (\w+)/g)].map(m => m[1]!),
    ...[...read(f).matchAll(/export (?:type )?\{([^}]+)\}/g)].flatMap(m => m[1]!.split(',').map(s => s.trim().split(/\s+as\s+/).pop()!.replace(/^type\s+/, ''))),
  ]))
  const named = files.flatMap((file) => {
    const text = read(file)
    return [...text.matchAll(API_NAME), ...text.matchAll(API_TAG)].map(m => ({ file, name: m[1] ?? m[0] }))
  })

  it('names the API', () => {
    expect(new Set(named.map(n => n.name)).size).toBeGreaterThan(20)
  })

  it.each([...new Set(named.map(n => n.name))])('`%s` is real', (name) => {
    const where = named.filter(n => n.name === name).map(n => n.file).join(', ')
    expect(registered.has(name) || exported.has(name), `${where} names \`${name}\`, which the module neither auto-imports (src/registry.ts) nor exports (src/runtime)`).toBe(true)
  })

  const install = read(`${dir}/references/install.md`)
  const installation = read(contentFile('/getting-started/installation'))

  it('states the Nuxt and Node floors the module enforces', () => {
    const nuxtFloor = read('src/module.ts').match(/nuxt: '>=([\d.]+)'/)?.[1]
    const nodeFloor = (JSON.parse(read('package.json')) as { engines: { node: string } }).engines.node.match(/>=([\d.]+)/)?.[1]
    expect(install, `references/install.md does not state Nuxt ≥ ${nuxtFloor}`).toContain(`Nuxt ≥ ${nuxtFloor}`)
    expect(install, `references/install.md does not state Node ≥ ${nodeFloor}`).toContain(`Node ≥ ${nodeFloor}`)
  })

  it.each(['gh:qruto/nuxt-convex-module/templates/starter', 'nuxi@latest module add nuxt-convex-module'])('installs the way the Installation page does: %s', (command) => {
    expect(installation).toContain(command)
    expect(install).toContain(command)
  })
})

describe('the agent install prompt', () => {
  // One prompt, three places. It names the skill path the skills CLI writes.
  const prompt = read(contentFile('/getting-started/installation')).match(/## With an AI agent[\s\S]*?```text\n([\s\S]*?)```/)?.[1]

  it('is on the Installation page', () => {
    expect(prompt).toContain('npx skills add https://nuxt-convex-module.dev --skill nuxt-convex-module -y')
    expect(prompt).toContain('.agents/skills/nuxt-convex-module/references/install.md')
  })

  it.each(['README.md', 'website/content/index.md'])('%s carries the same prompt', (file) => {
    expect(read(file), `${file} has a different agent prompt from the Installation page — keep the three copies identical`).toContain(`\`\`\`text\n${prompt}\`\`\``)
  })
})
