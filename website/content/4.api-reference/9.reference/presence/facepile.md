---
navigation: false
description: "A Vue port of @convex-dev/presence/facepile: FacePile — generated TypeScript API reference for nuxt-convex-module/presence/facepile."
seo:
  title: "API reference: presence/facepile"
---

# presence/facepile

A Vue port of `@convex-dev/presence/facepile`: [FacePile](#facepile).

## Variables

### FacePile

```ts
const FacePile: DefineComponent<ExtractPropTypes<{
  presenceState: {
     type: PropType<PresenceState[]>;
     required: true;
  };
}>, () => VNode<RendererNode, RendererElement, {
[key: string]: any;
}>, {
}, {
}, {
}, ComponentOptionsMixin, ComponentOptionsMixin, {
}, string, PublicProps, ToResolvedProps<ExtractPropTypes<{
  presenceState: {
     type: PropType<PresenceState[]>;
     required: true;
  };
}>, {
}>, {
}, {
}, {
}, {
}, string, ComponentProvideOptions, true, {
}, any>;
```

Defined in: [src/runtime/presence/vue/facepile.ts:25](https://github.com/qruto/nuxt-convex-module/blob/main/src/runtime/presence/vue/facepile.ts#L25)

Avatars of the first five users in a room, and a drop-down with the rest.
The styles are the package's own `@convex-dev/presence/facepile.css`.

#### Example

```vue
<FacePile :presence-state="presenceState ?? []" />
```

## References

### default

Renames and re-exports [FacePile](#facepile)
