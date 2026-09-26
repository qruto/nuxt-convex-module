// The reader's package manager, chosen once in the docs sidebar and kept in
// localStorage. Every `:pm-*` block renders the one command for it, so the
// pages carry no tab strips. SSR renders the default; the stored choice is
// applied on mount, the same way Nuxt UI's own `sync` code groups do.
export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun'

export const PACKAGE_MANAGERS: PackageManager[] = ['pnpm', 'npm', 'yarn', 'bun']

const STORAGE_KEY = 'nc-package-manager'

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

const isPackageManager = (value: unknown): value is PackageManager =>
  PACKAGE_MANAGERS.includes(value as PackageManager)

export function usePackageManager() {
  const pm = useState<PackageManager>(STORAGE_KEY, () => 'pnpm')

  onMounted(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (isPackageManager(stored)) pm.value = stored
    }
    catch {
      // Private mode or blocked storage — the default stands.
    }
  })

  function set(value: PackageManager) {
    pm.value = value
    try {
      localStorage.setItem(STORAGE_KEY, value)
    }
    catch {
      // Same as above: the choice lives for the session only.
    }
  }

  const commands = computed(() => COMMANDS[pm.value])

  return { pm, set, commands }
}
