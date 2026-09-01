<script setup lang="ts">
// <CheckoutLink> and <CustomerPortalLink> are the real globally registered
// components from nuxt-convex-module (auto-registered because @convex-dev/polar
// is installed). They resolve their actions from the auto-provided `api.billing`
// namespace — on the playground those are demo stand-ins returning polar.sh
// sandbox URLs, so `:embed="false"` keeps the checkout a plain link.
//
// They render plain <a> elements and spread attrs onto them, so the depth
// treatment is applied as classes directly — wrapping them in UButton would
// hide the components the demo is about.
</script>

<template>
  <PlaygroundDemo title="Billing — CheckoutLink + CustomerPortalLink">
    <div class="mb-3 flex flex-wrap gap-2">
      <CheckoutLink
        :product-ids="['demo-product']"
        :embed="false"
        target="_blank"
        class="convex rounded-[10px] inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-primary-700 no-underline transition-[color,box-shadow] duration-150 ease-out hover:text-primary active:concave dark:text-primary-300"
      >
        Buy demo product
      </CheckoutLink>
      <CustomerPortalLink
        return-url="/components/polar"
        class="convex rounded-[10px] inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-1.5 text-sm font-semibold text-default no-underline transition-[color,box-shadow] duration-150 ease-out hover:text-primary active:concave"
      >
        Manage subscription
      </CustomerPortalLink>
    </div>
    <p class="m-0 text-xs text-muted">
      Each link resolves its URL by calling a Convex action on mount and
      renders once the URL arrives — with the deployment offline the portal link
      stays hidden. Here both point at polar.sh sandbox pages.
    </p>
  </PlaygroundDemo>
</template>
