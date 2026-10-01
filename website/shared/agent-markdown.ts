import type { UpstreamSource } from '../app/utils/upstream-baselines'
import type { PmProps } from './package-managers'
import { upstreamBaselines } from '../app/utils/upstream-baselines'
import { isPmTag, PACKAGE_MANAGERS, pmLines } from './package-managers'

// THE PAGES AS AGENTS READ THEM. `/raw/<page>.md`, `/llms-full.txt` and the
// docs MCP server's `get-page` print each page from its parsed body, and a
// `:pm-*` block or an `:upstream-baseline` plate has nothing in it to print —
// the Vue component computes what the reader sees. So an agent got
// `<pm-install packages="convex"></pm-install>` and never the command.
//
// The `content:file:afterParse` hook in nuxt.config.ts runs this over every
// page: each such block gets the text it stands for as children — one
// labelled bash fence per package manager, or the baseline it names. The
// components render no slot, so the site itself does not change.

/** A minimark node: `[tag, props, ...children]`, or a text string. */
type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

/** Fill one node, then its children; a node that already has children is left as it is. */
function expand(node: MinimarkNode): void {
  if (typeof node === 'string') return
  const [tag, props, ...children] = node
  if (children.length === 0) {
    if (isPmTag(tag)) {
      for (const pm of PACKAGE_MANAGERS)
        node.push(['pre', { language: 'bash', filename: pm, code: pmLines(tag, props as PmProps, pm).join('\n') }])
      return
    }
    if (tag === 'upstream-baseline') {
      const baseline = upstreamBaselines[(props.source ?? 'convex') as UpstreamSource]
      if (baseline) node.push(`Matches upstream ${baseline.package}@${baseline.version} (${props.entry ?? baseline.entries}).`)
      return
    }
  }
  children.forEach(expand)
}

/** Fill the agent-facing text into a parsed page body, in place. Safe to run twice. */
export function expandForAgents(body: unknown): void {
  if (!body || typeof body !== 'object') return
  const { type, value } = body as { type?: unknown, value?: unknown }
  if (type === 'minimark' && Array.isArray(value)) value.forEach(expand)
}
