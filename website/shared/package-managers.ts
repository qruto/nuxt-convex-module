// THE PACKAGE-MANAGER COMMANDS — one table for every `:pm-*` block. The
// `Pm*.vue` components render the reader's pick from the sidebar; the
// content hook in nuxt.config.ts writes all four into each block for the
// Markdown that agents read (shared/agent-markdown.ts). Vue-free, so both
// sides import it.
export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export const PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun']

interface Commands {
  add: string
  addDev: string
  dlx: string
  run: (script: string) => string
  /** A new app from a template. npm drops `-t` without a `--` before it; Bun rejects `-t`. */
  create: (template: string) => string
}

const COMMANDS: Record<PackageManager, Commands> = {
  pnpm: { add: 'pnpm add', addDev: 'pnpm add -D', dlx: 'pnpm dlx', run: s => `pnpm ${s}`, create: t => `pnpm create nuxt@latest my-app -t ${t}` },
  npm: { add: 'npm i', addDev: 'npm i -D', dlx: 'npx', run: s => `npm run ${s}`, create: t => `npm create nuxt@latest my-app -- -t ${t}` },
  yarn: { add: 'yarn add', addDev: 'yarn add -D', dlx: 'yarn dlx', run: s => `yarn ${s}`, create: t => `yarn create nuxt my-app -t ${t}` },
  bun: { add: 'bun add', addDev: 'bun add -d', dlx: 'bunx', run: s => `bun run ${s}`, create: t => `bun create nuxt@latest my-app --template=${t}` },
}

/** The props a `:pm-*` block takes, as they arrive from markdown. */
export interface PmProps {
  packages?: string
  dev?: boolean | string
  command?: string
  scripts?: string
  template?: string
}

/** The MDC tags that render a command, and how each builds its lines. */
const BUILDERS = {
  'pm-install': (c: Commands, p: PmProps) => [`${p.dev && p.dev !== 'false' ? c.addDev : c.add} ${p.packages}`],
  'pm-x': (c: Commands, p: PmProps) => [`${c.dlx} ${p.command}`],
  'pm-run': (c: Commands, p: PmProps) => (p.scripts ?? '').split(',').map(s => c.run(s.trim())),
  'pm-create': (c: Commands, p: PmProps) => [c.create(p.template ?? '')],
} satisfies Record<string, (c: Commands, p: PmProps) => string[]>

export type PmTag = keyof typeof BUILDERS

export const isPmTag = (tag: unknown): tag is PmTag => typeof tag === 'string' && tag in BUILDERS

/** The shell lines a `:pm-*` block shows for one package manager. */
export function pmLines(tag: PmTag, props: PmProps, pm: PackageManager): string[] {
  return BUILDERS[tag](COMMANDS[pm], props)
}
