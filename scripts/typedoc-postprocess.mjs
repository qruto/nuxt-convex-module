// Post-process the TypeDoc markdown so it renders cleanly inside Nuxt Content /
// Docus. TypeDoc emits inter-page links relative to each file and with a `.md`
// extension (`[convex/app](convex/app.md)`). Two problems for Nuxt Content:
//   1. routes are extension-less, so `.md` links 404; and
//   2. the prerender crawler resolves *relative* links against the current URL,
//      and because the folder index route has no trailing slash, `convex/app`
//      resolves to `/api-reference/convex/app` (missing `/reference/`) → fatal
//      crawl errors.
// Fix both by rewriting every internal link to a root-absolute route, resolved
// against the file's own location. External URLs, in-page anchors, and already
// absolute links are left untouched.
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative, posix, sep } from 'node:path'

const ROOT = new URL(
  '../website/content/4.api-reference/9.reference/',
  import.meta.url,
).pathname

// The route the `9.reference` folder is served at (Nuxt Content strips the
// numeric `N.` prefixes: `4.api-reference/9.reference` -> `/api-reference/reference`).
const BASE_ROUTE = '/api-reference/reference'

// Any relative link target: skip external (`https://`), root-absolute (`/`),
// pure anchors (`#`), and protocol-ish (`mailto:`) links.
const LINK = /\]\((?!https?:\/\/|\/|#|mailto:)([^)]+)\)/g

// `Defined in:` paths for symbols re-exported from dependencies (convex, the TS
// lib) are emitted as the on-disk location, which under pnpm's default isolated
// linker is the store path: `node_modules/.pnpm/convex@1.42.3_react@19.2.8/
// node_modules/convex/...`. That embeds both the node_modules layout and the
// exact resolved version, so the committed reference drifts — and the ci drift
// gate fails — whenever the linker or any dependency version changes. Collapse
// the store segment back to the plain `node_modules/<pkg>/...` form, which is
// what the path means and is stable across both. Underscores arrive
// markdown-escaped (`node\_modules`), so match either spelling.
const PNPM_STORE = /node(\\?)_modules\/\.pnpm\/[^/]+\/node\\?_modules\//g

// TypeDoc emits only `navigation: true` in each page's frontmatter, and Nuxt
// Content does NOT read the H1 — it falls back to the *filename* for `title`
// and leaves `description` empty. That gives four pages titled "Client"
// (`{better-auth,clerk,auth0,polar}/client.md`) and no meta description
// anywhere. Derive both from what TypeDoc already wrote: the H1 is the module
// path, and the paragraph under it is the module's TSDoc summary.
//
// `title` is deliberately left alone — the filename fallback is what the
// sidebar shows, and it reads better there than the full module path. Only
// `seo.title` is spelled out, so the `<title>` tag is unique per page.
const DESCRIPTION_MAX = 160

/** First prose paragraph under the H1, flattened and stripped of markdown. */
function summarize(body) {
  const afterH1 = body.split(/^# .*$/m)[1] ?? ''
  const paragraph = afterH1.trimStart().split(/\n\s*\n/)[0]
  // Tables, lists and headings are not prose — those modules have no summary.
  // An empty paragraph needs no guard: it falls through and flattens to ''.
  if (/^[|\-*#>]/.test(paragraph)) return ''
  return paragraph
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links -> their text
    .replace(/[`*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function describe(module, body) {
  const suffix = ` — generated TypeScript API reference for nuxt-convex-module/${module}.`
  const summary = summarize(body)
  if (!summary) return suffix.replace(/^ — g/, 'G')
  // The suffix only earns its place when the whole summary still fits with it;
  // clipping the summary to make room would end the sentence mid-thought.
  const withSuffix = summary.replace(/\.$/, '') + suffix
  if (withSuffix.length <= DESCRIPTION_MAX) return withSuffix
  if (summary.length <= DESCRIPTION_MAX) return summary
  return `${summary.slice(0, summary.lastIndexOf(' ', DESCRIPTION_MAX - 1))}…`
}

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(path)
    else if (entry.name.endsWith('.md')) yield path
  }
}

let touched = 0
for await (const file of walk(ROOT)) {
  const src = await readFile(file, 'utf8')
  const relPath = relative(ROOT, file).split(sep).join('/')
  // Route directory of THIS file, e.g. `convex/app.md` -> `/api-reference/reference/convex`.
  const relDir = posix.dirname(relPath)
  const linkBase = relDir === '.' ? BASE_ROUTE : posix.join(BASE_ROUTE, relDir)

  let out = src.replace(PNPM_STORE, 'node$1_modules/').replace(LINK, (_match, target) => {
    const hash = target.indexOf('#')
    const path = hash === -1 ? target : target.slice(0, hash)
    const anchor = hash === -1 ? '' : target.slice(hash)
    const clean = path.replace(/\.md$/, '')
    if (!clean) return `](${anchor})` // safety: anchor-only
    const abs = posix.normalize(posix.join(linkBase, clean))
    return `](${abs}${anchor})`
  })

  // `index.md` gets its own (hand-written) meta below.
  if (relPath !== 'index.md') {
    const module = out.match(/^# (.+)$/m)?.[1]?.trim() ?? relPath.replace(/\.md$/, '')
    // The docs sidebar is a READING PATH; TypeDoc is a lookup surface. Modules
    // that live in a subfolder here (`auth0/client`, `better-auth/server`, …)
    // would add four folder groups and a third level of nesting to the tree,
    // and every one of them is already deep-linked from the prose page that
    // documents it and listed WITH a description in the All Modules table —
    // which is more than a sidebar row can say. So they stay out of the nav
    // (routes, links and search are untouched) and only the two top-level
    // surfaces people look up constantly, `client` and `server`, keep a row.
    const nested = relPath.includes('/')
    out = out.replace(/^---\nnavigation: true\n---/, [
      '---',
      `navigation: ${!nested}`,
      `description: ${JSON.stringify(describe(module, out))}`,
      'seo:',
      `  title: ${JSON.stringify(`API reference: ${module}`)}`,
      '---',
    ].join('\n'))
  }

  if (out !== src) {
    await writeFile(file, out)
    touched++
  }
}

// TypeDoc wipes the output dir on every run (`cleanOutputDir`), so the Docus
// folder-navigation file has to be (re)written here rather than committed by hand.
await writeFile(
  join(ROOT, '.navigation.yml'),
  'title: Generated Reference\nicon: i-lucide-boxes\n',
)

// Give the generated landing page a human title/description instead of the bare
// package name TypeDoc emits as the H1.
const indexPath = join(ROOT, 'index.md')
const index = await readFile(indexPath, 'utf8')
await writeFile(
  indexPath,
  index
    .replace(/^---\nnavigation: true\n---/, [
      '---',
      'navigation: true',
      'title: All Modules',
      'description: Auto-generated TypeScript API reference for every public nuxt-convex-module module.',
      'seo:',
      '  title: "API reference: all modules"',
      '---',
    ].join('\n'))
    .replace(/^# nuxt-convex-module$/m, '# All Modules'),
)

console.log(`typedoc-postprocess: cleaned links in ${touched} file(s); wrote nav + index meta`)
