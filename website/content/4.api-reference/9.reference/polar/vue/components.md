---
navigation: true
---

# polar/vue/components

## Interfaces

### PolarComponentApi

Defined in: [src/runtime/polar/vue/components.ts:38](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L38)

The subset of the Polar component's action references these components need —
a Vue port mirror of `@convex-dev/polar`'s `PolarComponentApi`
(`Pick<…, 'generateCheckoutLink' | 'generateCustomerPortalUrl'>`). Supplied
via the auto-provided `api.billing` namespace, or passed through `:polar-api`.

#### Properties

| Property | Type | Defined in |
| ------ | ------ | ------ |
| <a id="generatecheckoutlink"></a> `generateCheckoutLink?` | [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"action"`, `"public"`, [`CheckoutArgs`](#checkoutargs), \{ `url`: `string`; \}\> | [src/runtime/polar/vue/components.ts:39](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L39) |
| <a id="generatecustomerportalurl"></a> `generateCustomerPortalUrl?` | [`FunctionReference`](/api-reference/reference/vue#functionreference)\<`"action"`, `"public"`, \{ `returnUrl?`: `string`; \}, \{ `url`: `string`; \}\> | [src/runtime/polar/vue/components.ts:40](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L40) |

## Type Aliases

### CheckoutArgs

```ts
type CheckoutArgs = {
  productIds: string[];
  origin: string;
  successUrl: string;
  subscriptionId?: string;
  metadata?: Record<string, string>;
  trialInterval?: string | null;
  trialIntervalCount?: number | null;
  locale?: string;
};
```

Defined in: [src/runtime/polar/vue/components.ts:12](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L12)

Args of the Polar-generated `generateCheckoutLink` action. Mirrors the
argument shape `@convex-dev/polar`'s component exposes.

#### Properties

| Property | Type | Description | Defined in |
| ------ | ------ | ------ | ------ |
| <a id="productids"></a> `productIds` | `string`[] | - | [src/runtime/polar/vue/components.ts:13](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L13) |
| <a id="origin"></a> `origin` | `string` | - | [src/runtime/polar/vue/components.ts:14](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L14) |
| <a id="successurl"></a> `successUrl` | `string` | - | [src/runtime/polar/vue/components.ts:15](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L15) |
| <a id="subscriptionid"></a> `subscriptionId?` | `string` | - | [src/runtime/polar/vue/components.ts:16](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L16) |
| <a id="metadata"></a> `metadata?` | `Record`\<`string`, `string`\> | - | [src/runtime/polar/vue/components.ts:17](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L17) |
| <a id="trialinterval"></a> `trialInterval?` | `string` \| `null` | `string | null` — not the literal-day/week/month/year union — because upstream's action arg is validator-derived (`v.union(v.string(), v.null())`), so the user's `_generated/api` reference types it that way; a narrower type here would reject their `:polar-api` binding. The component *prop* keeps the literal union, matching upstream's React prop declaration. | [src/runtime/polar/vue/components.ts:25](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L25) |
| <a id="trialintervalcount"></a> `trialIntervalCount?` | `number` \| `null` | - | [src/runtime/polar/vue/components.ts:26](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L26) |
| <a id="locale"></a> `locale?` | `string` | - | [src/runtime/polar/vue/components.ts:27](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L27) |

## Variables

### CustomerPortalLink

```ts
const CustomerPortalLink: DefineComponent<ExtractPropTypes<{
  polarApi: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
  returnUrl: {
     type: StringConstructor;
     default: undefined;
  };
}>, () => 
  | VNode<RendererNode, RendererElement, {
[key: string]: any;
}>
  | null, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  polarApi: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
  returnUrl: {
     type: StringConstructor;
     default: undefined;
  };
}>, {
}>, {
  polarApi: PolarComponentApi;
  returnUrl: string;
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/polar/vue/components.ts:49](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L49)

#### Example

```vue
<CustomerPortalLink>Manage subscription</CustomerPortalLink>
```

***

### CheckoutLink

```ts
const CheckoutLink: DefineComponent<ExtractPropTypes<{
  polarApi: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
  productIds: {
     type: PropType<string[]>;
     required: true;
  };
  subscriptionId: {
     type: StringConstructor;
     default: undefined;
  };
  metadata: {
     type: PropType<Record<string, string>>;
     default: undefined;
  };
  trialInterval: {
     type: PropType<"day" | "week" | "month" | "year" | null>;
     default: undefined;
  };
  trialIntervalCount: {
     type: PropType<number | null>;
     default: undefined;
  };
  locale: {
     type: StringConstructor;
     default: undefined;
  };
  theme: {
     type: PropType<"dark" | "light">;
     default: string;
  };
  embed: {
     type: BooleanConstructor;
     default: boolean;
  };
  lazy: {
     type: BooleanConstructor;
     default: boolean;
  };
}>, () => VNode<RendererNode, RendererElement, {
[key: string]: any;
}>, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  polarApi: {
     type: PropType<PolarComponentApi>;
     default: undefined;
  };
  productIds: {
     type: PropType<string[]>;
     required: true;
  };
  subscriptionId: {
     type: StringConstructor;
     default: undefined;
  };
  metadata: {
     type: PropType<Record<string, string>>;
     default: undefined;
  };
  trialInterval: {
     type: PropType<"day" | "week" | "month" | "year" | null>;
     default: undefined;
  };
  trialIntervalCount: {
     type: PropType<number | null>;
     default: undefined;
  };
  locale: {
     type: StringConstructor;
     default: undefined;
  };
  theme: {
     type: PropType<"dark" | "light">;
     default: string;
  };
  embed: {
     type: BooleanConstructor;
     default: boolean;
  };
  lazy: {
     type: BooleanConstructor;
     default: boolean;
  };
}>, {
}>, {
  polarApi: PolarComponentApi;
  subscriptionId: string;
  metadata: Record<string, string>;
  trialInterval: "day" | "week" | "month" | "year" | null;
  trialIntervalCount: number | null;
  locale: string;
  theme: "dark" | "light";
  embed: boolean;
  lazy: boolean;
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/polar/vue/components.ts:100](https://github.com/qruto/nuxt-convex-module/blob/5830febd6a44f7207bddcffd607be9384aa631b0/src/runtime/polar/vue/components.ts#L100)

Renders a checkout link. Supports embedded or redirect checkout, with optional lazy loading and trial configuration.

#### Example

```vue
<CheckoutLink :product-ids="[productId]" :trial-interval-count="7" trial-interval="day">
  Start free trial
</CheckoutLink>
```
