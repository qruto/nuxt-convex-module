<script setup lang="ts">
import { AGENT_PROVIDERS } from '#shared/agent-prompt'

// `:agent-prompt-links` — under the agent prompt, a tab per agent and, under
// the chosen one, a key for every app that opens it with the prompt typed in.
// The reader's agent is kept in localStorage the way the package manager is
// (usePackageManager): SSR renders the first agent, the stored one is applied
// on mount.
const STORAGE_KEY = 'nc-agent'
const agent = useState(STORAGE_KEY, () => AGENT_PROVIDERS[0]!.agent)

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (AGENT_PROVIDERS.some(provider => provider.agent === stored)) agent.value = stored!
  }
  catch {
    // Private mode or blocked storage — the first agent stands.
  }
})

// The tab's value is a slug of the agent's name: Reka builds the tab's and
// the panel's ids from it, and "Claude Code" made both ids invalid and
// split the tab's aria-controls into two references to nothing.
const slug = (name: string) => name.toLowerCase().replaceAll(' ', '-')

function choose(value: string | number) {
  const provider = AGENT_PROVIDERS.find(entry => slug(entry.agent) === value)
  if (!provider) return
  agent.value = provider.agent
  try {
    localStorage.setItem(STORAGE_KEY, agent.value)
  }
  catch {
    // The choice lives for the session only.
  }
}

// Below 42rem the tabs are marks only, except the chosen one, which keeps
// its name: seven named tabs need ~39rem. Below 21.5rem — a phone, in the
// landing's tray — the chosen one is a mark too: seven marks and one name
// need ~21.5rem, and in less the name was cut to a letter or two. The
// raised key still says which one is chosen; the names stay for readers.
const items = computed(() => AGENT_PROVIDERS.map(provider => ({
  label: provider.agent,
  value: slug(provider.agent),
  icon: provider.icon,
  provider,
  ui: { label: provider.agent === agent.value ? '@max-[21.5rem]:sr-only' : '@max-2xl:sr-only' },
})))
</script>

<template>
  <div class="@container my-4">
    <div class="mb-2.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <span class="stamp concave-text text-toned">open in your agent</span>
      <span class="stamp text-muted">prompt typed in · you press send</span>
    </div>
    <!-- The track is cut in and the chosen agent is the one raised key in
         it, sliding over when another is picked. 12px track, 4px in, so the
         key is 8px — the keys below are the same part. -->
    <UTabs
      :model-value="slug(agent)"
      :items="items"
      color="neutral"
      size="sm"
      :ui="{
        root: 'gap-3',
        list: 'concave rounded-(--radius-well)',
        indicator: 'convex bevel rounded-lg',
        trigger: 'rounded-lg text-[0.8125rem] data-[state=active]:text-highlighted',
        leadingIcon: 'convex-icon',
      }"
      @update:model-value="choose"
    >
      <template #content="{ item }">
        <ul class="m-0 flex list-none flex-wrap gap-2 p-0">
          <li
            v-for="link in item.provider.links"
            :key="link.href"
            class="m-0 p-0"
          >
            <a
              :href="link.href"
              :aria-label="`Open the prompt in ${item.provider.agent}, ${link.app}`"
              class="group flex h-9 items-center gap-2 rounded-lg px-3 no-underline convex bevel transition-[box-shadow] hover:convex-2 active:concave active:translate-y-[0.5px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <UIcon
                :name="link.icon"
                class="size-4 shrink-0 convex-icon text-toned transition-colors group-hover:text-highlighted"
              />
              <span class="text-[0.8125rem] font-medium whitespace-nowrap text-highlighted">{{ link.app }}</span>
            </a>
          </li>
        </ul>
      </template>
    </UTabs>
  </div>
</template>
