import { describe, expect, it } from 'vitest'
import { AGENT_PROMPT, AGENT_PROVIDERS } from '../../website/shared/agent-prompt'
import { expandForAgents } from '../../website/shared/agent-markdown'
import { contentFile, read } from '../docs/helpers'

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

  it('writes the open-in-agent links into `:agent-prompt-links`', () => {
    const body = page(['agent-prompt-links', {}])
    expandForAgents(body)
    const links = JSON.stringify(body.value)
    for (const { href, app } of AGENT_PROVIDERS.flatMap(provider => provider.links)) expect(links).toContain(JSON.stringify(['a', { href }, app]))
  })

  it('runs once per block', () => {
    const body = page(['pm-x', { command: 'nuxi' }])
    expandForAgents(body)
    expandForAgents(body)
    expect(body.value[0]).toHaveLength(2 + 4)
  })
})

describe('the agent install prompt', () => {
  it('is the prompt the Installation page shows', () => {
    // test/docs/agent-skill.test.ts holds the page, the README and the landing
    // to each other; this ties the links' copy to them.
    const page = read(contentFile('/getting-started/installation'))
    expect(page).toContain(`\`\`\`text\n${AGENT_PROMPT}\n\`\`\``)
  })

  it('hands the whole prompt to each agent link', () => {
    // VS Code and its forks decode the link once more before the handler
    // reads it, so their links carry the prompt encoded twice; every other
    // app reads it encoded once.
    const vscodeFamily = new Set(['vscode:', 'vscode-insiders:', 'vscodium:', 'cursor:', 'windsurf:', 'kiro:', 'antigravity-ide:', 'trae:', 'positron:'])
    for (const { href } of AGENT_PROVIDERS.flatMap(provider => provider.links)) {
      const url = new URL(href)
      const params = url.searchParams
      const prompt = params.get('prompt') ?? params.get('text') ?? params.get('q') ?? params.get('query') ?? ''
      expect(vscodeFamily.has(url.protocol) ? decodeURIComponent(prompt) : prompt, href).toBe(AGENT_PROMPT)
    }
  })

  it('is a prompt Cursor accepts', () => {
    // Cursor's link handler refuses any prompt that mentions an env file.
    expect(AGENT_PROMPT).not.toMatch(/\.env(?:\b|\W)/)
  })
})
