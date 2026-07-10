/**
 * Vue ports of `@convex-dev/polar/react`'s billing components —
 * {@link CheckoutLink} and {@link CustomerPortalLink}.
 *
 * @module polar/client
 */
import { defineComponent, h, mergeProps, type PropType, ref, watch } from 'vue'
import type { FunctionReference } from 'convex/server'
import { useAction } from '../../vue/composables/use-action'
import { useConvexNamespace } from '../../vue/provide'

/**
 * Args of the Polar-generated `generateCheckoutLink` action. Mirrors the
 * argument shape `@convex-dev/polar`'s component exposes.
 *
 * @public
 */
export type CheckoutArgs = {
  productIds: string[]
  origin: string
  successUrl: string
  subscriptionId?: string
  metadata?: Record<string, string>
  /**
   * `string | null` — not the literal-day/week/month/year union — because
   * upstream's action arg is validator-derived (`v.union(v.string(), v.null())`),
   * so the user's `_generated/api` reference types it that way; a narrower type
   * here would reject their `:polar-api` binding. The component *prop* keeps
   * the literal union, matching upstream's React prop declaration.
   */
  trialInterval?: string | null
  trialIntervalCount?: number | null
  locale?: string
}

/**
 * The subset of the Polar component's action references these components need —
 * a Vue port mirror of `@convex-dev/polar`'s `PolarComponentApi`
 * (`Pick<…, 'generateCheckoutLink' | 'generateCustomerPortalUrl'>`). Supplied
 * via the auto-provided `api.billing` namespace, or passed through `:polar-api`.
 *
 * @public
 */
export interface PolarComponentApi {
  generateCheckoutLink?: FunctionReference<'action', 'public', CheckoutArgs, { url: string }>
  generateCustomerPortalUrl?: FunctionReference<'action', 'public', { returnUrl?: string }, { url: string }>
}

/**
 * @example
 * ```vue
 * <CustomerPortalLink>Manage subscription</CustomerPortalLink>
 * ```
 */
export const CustomerPortalLink = defineComponent({
  name: 'CustomerPortalLink',
  inheritAttrs: false,
  props: {
    // Optional in the port: defaults to the auto-provided `api.billing` namespace.
    polarApi: { type: Object as PropType<PolarComponentApi>, default: undefined },
    returnUrl: { type: String, default: undefined },
  },
  setup(props, { slots, attrs }) {
    const polarApi = props.polarApi ?? useConvexNamespace<PolarComponentApi>('billing')
    // The action may be absent from the auto-provided namespace, hence the guard.
    const generateCustomerPortalUrl = polarApi?.generateCustomerPortalUrl
      ? useAction(polarApi.generateCustomerPortalUrl)
      : undefined
    const portalUrl = ref<string>()

    // useEffect never runs during SSR, so the effect is client-guarded.
    if (import.meta.client && generateCustomerPortalUrl) {
      watch(
        () => props.returnUrl,
        (returnUrl) => {
          void generateCustomerPortalUrl({ returnUrl }).then((result) => {
            if (result) {
              portalUrl.value = result.url
            }
          })
        },
        { immediate: true },
      )
    }

    return () => {
      if (!portalUrl.value) {
        return null
      }

      return h('a', { ...attrs, href: portalUrl.value, target: '_blank' }, slots.default?.())
    }
  },
})

/**
 * Renders a checkout link. Supports embedded or redirect checkout, with optional lazy loading and trial configuration.
 *
 * @example
 * ```vue
 * <CheckoutLink :product-ids="[productId]" :trial-interval-count="7" trial-interval="day">
 *   Start free trial
 * </CheckoutLink>
 * ```
 */
export const CheckoutLink = defineComponent({
  name: 'CheckoutLink',
  inheritAttrs: false,
  props: {
    // Optional in the port: defaults to the auto-provided `api.billing` namespace.
    polarApi: { type: Object as PropType<PolarComponentApi>, default: undefined },
    productIds: { type: Array as PropType<string[]>, required: true },
    subscriptionId: { type: String, default: undefined },
    metadata: { type: Object as PropType<Record<string, string>>, default: undefined },
    trialInterval: { type: String as PropType<'day' | 'week' | 'month' | 'year' | null>, default: undefined },
    trialIntervalCount: { type: Number as PropType<number | null>, default: undefined },
    locale: { type: String, default: undefined },
    theme: { type: String as PropType<'dark' | 'light'>, default: 'dark' },
    embed: { type: Boolean, default: true },
    lazy: { type: Boolean, default: false },
  },
  setup(props, { slots, attrs }) {
    const polarApi = props.polarApi ?? useConvexNamespace<PolarComponentApi>('billing')
    // The action may be absent from the auto-provided namespace, hence the guard.
    const generateCheckoutLink = polarApi?.generateCheckoutLink
      ? useAction(polarApi.generateCheckoutLink)
      : undefined
    const checkoutLink = ref<string>()
    const isLoading = ref(false)

    // useEffect never runs during SSR, so the effect is client-guarded.
    if (import.meta.client && generateCheckoutLink) {
      watch(
        () => [props.lazy, props.productIds, props.subscriptionId, props.metadata, props.embed, props.trialInterval, props.trialIntervalCount, props.locale],
        async () => {
          if (props.lazy) return
          if (props.embed) {
            // `@polar-sh/checkout` is an optional peer dependency, so it is imported lazily.
            const { PolarEmbedCheckout } = await import('@polar-sh/checkout/embed')
            PolarEmbedCheckout.init()
          }
          void generateCheckoutLink({
            productIds: props.productIds,
            subscriptionId: props.subscriptionId,
            metadata: props.metadata,
            origin: window.location.origin,
            successUrl: window.location.href,
            trialInterval: props.trialInterval,
            trialIntervalCount: props.trialIntervalCount,
            locale: props.locale,
          }).then(({ url }) => {
            checkoutLink.value = url
          })
        },
        { immediate: true },
      )
    }

    // `lazy` is reactive in Vue, so its gate moves to the render site (`onClick`
    // binds only while lazy); this guard covers the possibly-absent action.
    const handleClick = generateCheckoutLink
      ? async (e: MouseEvent) => {
        e.preventDefault()
        if (isLoading.value) return
        isLoading.value = true
        try {
          const { url } = await generateCheckoutLink({
            productIds: props.productIds,
            subscriptionId: props.subscriptionId,
            metadata: props.metadata,
            origin: window.location.origin,
            successUrl: window.location.href,
            trialInterval: props.trialInterval,
            trialIntervalCount: props.trialIntervalCount,
            locale: props.locale,
          })
          if (props.embed) {
            // `@polar-sh/checkout` is an optional peer dependency, so it is imported lazily.
            const { PolarEmbedCheckout } = await import('@polar-sh/checkout/embed')
            await PolarEmbedCheckout.create(url, { theme: props.theme })
          }
          else {
            window.open(url, '_blank')
          }
        }
        finally {
          isLoading.value = false
        }
      }
      : undefined

    // `mergeProps` concatenates event listeners, so a consumer's `@click`
    // (arriving via attrs — an additive convenience over upstream, which
    // accepts no onClick) fires alongside the lazy handler instead of being
    // silently replaced or dropped.
    return () => h('a', mergeProps(attrs, {
      'href': checkoutLink.value ?? (props.lazy ? '#' : undefined),
      'onClick': props.lazy ? handleClick : undefined,
      'data-polar-checkout-theme': props.theme,
      ...(!props.lazy && props.embed ? { 'data-polar-checkout': true } : {}),
    }), slots.default?.())
  },
})
