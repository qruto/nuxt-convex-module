import { describe, expect, it } from 'vitest'
import { expandForAgents } from '../../website/shared/agent-markdown'

// The content hook behind the Markdown agents read (`/raw/*.md`,
// `/llms-full.txt`, MCP `get-page`): every `:pm-*` block gets one labelled
// fence per package manager, every `:upstream-baseline` the version it names.
// Here rather than in test/docs because it imports website code, whose
// tsconfig needs the `.nuxt/` that only this job prepares.

describe('Markdown for agents', () => {
  type Node = string | [string, Record<string, unknown>, ...Node[]]
  const page = (...value: Node[]) => ({ type: 'minimark', value })

  it('writes each package manager\'s command into a nested `:pm-*` block', () => {
    const body = page(['callout', {}, ['pm-create', { template: 'gh:o/r/t' }]], ['pm-run', { scripts: 'dev, build' }])
    expandForAgents(body)
    const [callout, run] = body.value as [string, object, ...Node[]][]
    expect(callout![2]).toEqual(['pm-create', { template: 'gh:o/r/t' },
      ['pre', { language: 'bash', filename: 'pnpm', code: 'pnpm create nuxt@latest my-app -t gh:o/r/t' }],
      ['pre', { language: 'bash', filename: 'npm', code: 'npm create nuxt@latest my-app -- -t gh:o/r/t' }],
      ['pre', { language: 'bash', filename: 'yarn', code: 'yarn create nuxt my-app -t gh:o/r/t' }],
      ['pre', { language: 'bash', filename: 'bun', code: 'bun create nuxt@latest my-app --template=gh:o/r/t' }],
    ])
    expect(run![3]).toEqual(['pre', { language: 'bash', filename: 'npm', code: 'npm run dev\nnpm run build' }])
  })

  it('installs dev dependencies with the dev flag', () => {
    const body = page(['pm-install', { packages: 'x', dev: true }])
    expandForAgents(body)
    expect((body.value[0] as Node[])[2]).toEqual(['pre', { language: 'bash', filename: 'pnpm', code: 'pnpm add -D x' }])
  })

  it('states the baseline an `:upstream-baseline` plate shows', () => {
    const body = page(['upstream-baseline', { source: 'convex', entry: 'convex/react-clerk' }])
    expandForAgents(body)
    expect((body.value[0] as Node[])[2]).toMatch(/^Matches upstream convex@\d+\.\d+\.\d+ \(convex\/react-clerk\)\.$/)
  })

  it('runs once per block', () => {
    const body = page(['pm-x', { command: 'nuxi' }])
    expandForAgents(body)
    expandForAgents(body)
    expect(body.value[0]).toHaveLength(2 + 4)
  })
})
