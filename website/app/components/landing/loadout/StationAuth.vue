<script setup lang="ts">
import LoadoutStation from './LoadoutStation.vue'

// Auth: the boundary components swap with the auth state.
const signedIn = ref(false)
</script>

<template>
  <LoadoutStation
    title="Auth, opt-in"
    readout-label="rendered by auth state"
  >
    <template #body>
      Core ships the boundary components; install
      <ProseCode>@convex-dev/better-auth</ProseCode> and
      <ProseCode>useAuth</ProseCode>, the <ProseCode>/api/auth</ProseCode>
      proxy, and route middleware wire themselves up.
    </template>
    <template #code>
      <pre
        data-tokens
        class="well m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.76rem] leading-[1.8] whitespace-pre text-highlighted"
      ><code><span class="tk-t">&lt;Authenticated&gt;</span>Welcome back<span class="tk-t">&lt;/Authenticated&gt;
</span><span class="tk-t">&lt;Unauthenticated&gt;
</span>  <span class="tk-t">&lt;a</span> href=<span class="tk-s">"/sign-in"</span><span class="tk-t">&gt;</span>Sign in<span class="tk-t">&lt;/a&gt;
</span><span class="tk-t">&lt;/Unauthenticated&gt;</span></code></pre>
    </template>
    <template #readout>
      <p
        class="m-0 text-sm text-default"
        aria-live="polite"
      >
        <template v-if="signedIn">
          Welcome back, <span class="font-mono text-[0.8em] text-primary-700 dark:text-primary-300">ada@convex.dev</span>
        </template>
        <template v-else>
          <span class="text-primary-700 underline underline-offset-3 dark:text-primary-300">Sign in</span>
        </template>
      </p>
      <UButton
        color="neutral"
        variant="outline"
        size="sm"
        @click="signedIn = !signedIn"
      >
        {{ signedIn ? 'signOut()' : 'signIn()' }}
      </UButton>
    </template>
  </LoadoutStation>
</template>
