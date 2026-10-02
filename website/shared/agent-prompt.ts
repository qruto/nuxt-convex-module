// THE AGENT INSTALL PROMPT — the text the Installation page, the README and
// the landing tray show in a ```text fence (test/unit/agent-markdown.test.ts
// keeps all four the same), and the links that hand it to an agent. Every
// link only pre-fills the agent's input: the reader still presses Enter.
export const AGENT_PROMPT = [
  'Install nuxt-convex-module, the Convex module for Nuxt, in this project:',
  'run `npx skills add https://nuxt-convex-module.dev --skill nuxt-convex-module -y`,',
  'then follow .agents/skills/nuxt-convex-module/references/install.md.',
].join('\n')

const text = encodeURIComponent(AGENT_PROMPT)

/**
 * Agents that open a pre-filled prompt in the reader's current project.
 * Claude Code's terminal link (`claude-cli://`) is left out on purpose: it
 * opens in the home directory, not the project the prompt talks about.
 */
export const AGENT_PROMPT_LINKS = [
  { label: 'Cursor', icon: 'i-simple-icons-cursor', href: `cursor://anysphere.cursor-deeplink/prompt?text=${text}` },
  { label: 'Claude Code in VS Code', icon: 'i-simple-icons-claude', href: `vscode://anthropic.claude-code/open?prompt=${text}` },
]
