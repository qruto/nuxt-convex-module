import type { UpstreamSource } from '../app/utils/upstream-baselines'
import type { PmProps } from './package-managers'
import { AGENT_PROVIDERS } from './agent-prompt'
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
// labelled bash fence per package manager, the baseline it names, or the
// open-in-agent links. The
// components render no slot, so the site itself does not change.

/** A minimark node: `[tag, props, ...children]`, or a text string. */
type MinimarkNode = string | [string, Record<string, unknown>, ...MinimarkNode[]]

type Props = Record<string, unknown>

/** The text each kind of block stands for, as minimark children. */
const FILLERS: Record<string, (props: Props) => MinimarkNode[]> = {
  'agent-prompt-links': () => [
    ['p', {}, 'Or open it in your agent with the prompt typed in:'],
    ['ul', {}, ...AGENT_PROVIDERS.map(({ agent, maker, links }): MinimarkNode =>
      ['li', {}, `${agent} (${maker}): `, ...links.flatMap(({ app, href }, i): MinimarkNode[] => [...(i ? [', '] : []), ['a', { href }, app]])])],
  ],
  'upstream-baseline': (props) => {
    const baseline = upstreamBaselines[(props.source ?? 'convex') as UpstreamSource]
    return baseline ? [`Matches upstream ${baseline.package}@${baseline.version} (${props.entry ?? baseline.entries}).`] : []
  },
}

/** One labelled bash fence per package manager for a `:pm-*` block. */
const pmFences = (tag: string, props: Props): MinimarkNode[] => isPmTag(tag)
  ? PACKAGE_MANAGERS.map(pm => ['pre', { language: 'bash', filename: pm, code: pmLines(tag, props as PmProps, pm).join('\n') }])
  : []

/** Fill one node, then its children; a node that already has children is left as it is. */
function expand(node: MinimarkNode): void {
  if (typeof node === 'string') return
  const [tag, props, ...children] = node
  if (children.length > 0) return children.forEach(expand)
  node.push(...(FILLERS[tag]?.(props) ?? pmFences(tag, props)))
}

/** Fill the agent-facing text into a parsed page body, in place. Safe to run twice. */
export function expandForAgents(body: unknown): void {
  if (!body || typeof body !== 'object') return
  const { type, value } = body as { type?: unknown, value?: unknown }
  if (type === 'minimark' && Array.isArray(value)) value.forEach(expand)
}
