---
seo:
  title: Convex for Vue & Nuxt
  description: The Convex client for Vue and Nuxt — reactive live queries, mutations, actions, pagination, file storage and SSR, auto-imported and typed against your deployment, with opt-in Better Auth and Polar.
---

::u-page-hero
---
orientation: horizontal
class: "landing-hero-ground border-b border-default"
headline: "NUXT MODULE · CONVEX CLIENT LIBRARY"
ui:
  header: "motion-safe:animate-fade-up"
links:
  - label: get started
    to: /getting-started/introduction
    trailingIcon: i-lucide-arrow-right
    color: primary
  - label: github
    to: https://github.com/qruto/nuxt-convex-module
    target: _blank
    icon: i-simple-icons-github
    color: neutral
    variant: ghost
  - label: see it run
    to: "#operation"
    trailingIcon: i-lucide-arrow-down
    color: neutral
    variant: link
---
:landing-hero-panel

#title
Convex for Vue & Nuxt, [machined to match upstream.]{.landing-hero-accent}

#description
The Convex client for Vue and Nuxt — reactive live queries, mutations,
actions, cursor pagination, file storage and SSR, auto-imported and typed
against your deployment. Better Auth and Polar wire themselves up when
installed.

[NUXT ≥ 4.1 · CONVEX 1.42]{.font-mono .etched .text-toned .text-xs .font-semibold .tracking-widest}
::

::u-page-section
---
id: operation
class: "landing-reveal border-b border-default scroll-mt-(--ui-header-height)"
headline: "01 · LIVE OPERATION"
title: One table, every client
---
#description
Nothing below is mocked. Each pane is its own component opening its own
`useQuery` against a real Convex deployment — no props between them, no
refetch, no cache keys. Send from either side and both lists move on the
same tick. Open this page in a second tab and it moves there too.

#body
:landing-demo
::

::u-page-section
---
class: "landing-reveal border-b border-default"
headline: "02 · PARITY"
title: The API you already know
---
#description
Same names, same arguments, same return shapes as Convex's official
clients — so Convex's own docs and examples translate line for line, and
the data layer reads identically in either framework.

#body
:landing-parity
::

::u-page-section
---
class: "landing-reveal border-b border-default"
headline: "03 · LOADOUT"
title: The whole kit, demonstrated
---
#description
Every surface of the client with a working readout. The readouts here are
simulated in-page — the [playground](/playground) runs them against a real
deployment.

#body
:landing-loadout
::

::u-page-section
---
class: "landing-reveal"
headline: "04 · DEPLOYMENT"
title: In your pocket in three moves
links:
  - label: Install the kit
    to: /getting-started/installation
    trailingIcon: i-lucide-arrow-right
    color: primary
  - label: Try the live playground
    to: /playground
    color: neutral
    variant: outline
---
#body
:landing-deploy
::
