<script setup lang="ts">
// <CheckoutLink> and <CustomerPortalLink> are the real globally registered
// components from @qruto/nuxt-convex (auto-registered because @convex-dev/polar
// is installed). They resolve their actions from the auto-provided `api.billing`
// namespace — on the playground those are demo stand-ins returning polar.sh
// sandbox URLs, so `:embed="false"` keeps the checkout a plain link.
</script>

<template>
  <PlaygroundDemo title="Billing — CheckoutLink + CustomerPortalLink">
    <div class="billing">
      <div class="billing-links">
        <CheckoutLink
          :product-ids="['demo-product']"
          :embed="false"
          class="billing-link billing-link-primary"
          target="_blank"
        >
          Buy demo product
        </CheckoutLink>
        <CustomerPortalLink
          return-url="/playground/billing"
          class="billing-link"
        >
          Manage subscription
        </CustomerPortalLink>
      </div>
      <p class="billing-note">
        Each link resolves its URL by calling a Convex action on mount and
        renders once the URL arrives — with the backend offline the portal link
        stays hidden. Here both point at polar.sh sandbox pages.
      </p>
    </div>
  </PlaygroundDemo>
</template>

<style scoped>
.billing-links {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.75rem;
}

.billing-link {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.875rem;
  border: 1px solid var(--ui-border);
  border-radius: 0.375rem;
  background: var(--ui-bg-elevated);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}

.billing-link-primary {
  background: var(--ui-bg-muted);
}

.billing-note {
  margin: 0;
  color: var(--ui-text-muted);
  font-size: 0.8125rem;
}
</style>
