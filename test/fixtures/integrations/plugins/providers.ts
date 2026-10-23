import { createAuth0 } from '@auth0/auth0-vue'
import { clerkPlugin } from '@clerk/vue'

// Placeholder credentials: no Clerk instance or Auth0 tenant behind them.
// Auth0's plugin checks the session as it installs, which reads `window`, so
// the server logs an unhandled `window is not defined` per request. The page
// renders regardless.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(clerkPlugin, {
    // `pk_test_` + base64('example.clerk.accounts.dev$'), the shape Clerk parses.
    publishableKey: 'pk_test_ZXhhbXBsZS5jbGVyay5hY2NvdW50cy5kZXYk',
  })
  nuxtApp.vueApp.use(createAuth0({ domain: 'example.auth0.com', clientId: 'placeholder' }))
})
