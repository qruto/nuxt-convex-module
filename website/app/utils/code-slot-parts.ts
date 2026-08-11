import { Fragment } from 'vue'
import type { Slots, VNode } from 'vue'

/**
 * remark-mdc can't attach named slots to a component nested inside another
 * component's slot section — the `#name` markers bind to the outer component
 * and the inner one comes up empty. So multi-snippet landing components take
 * their fenced code blocks as ONE default slot, in a fixed order, and split
 * them here: `codeSlotParts(slots, 3)` returns three tiny functional
 * components, each rendering the nth code block (order in content/index.md
 * is the contract).
 */

function flatten(nodes: VNode[]): VNode[] {
  return nodes.flatMap(node =>
    node.type === Fragment && Array.isArray(node.children)
      ? flatten(node.children as VNode[])
      : [node],
  )
}

function codeBlocks(slots: Slots): VNode[] {
  const nodes = slots.default?.() ?? []
  // Keep component vnodes (ProsePre) and raw <pre>; drop whitespace text.
  return flatten(nodes).filter(
    node => typeof node.type === 'object' || typeof node.type === 'function' || node.type === 'pre',
  )
}

export function codeSlotParts(slots: Slots, count: number): Array<() => VNode | null> {
  return Array.from({ length: count }, (_, index) =>
    () => codeBlocks(slots)[index] ?? null)
}
