---
seo:
  title: Use Convex backend in a Nuxt application
  description: One install wires Convex into Nuxt — live queries, mutations, actions, cursor pagination, file storage and SSR, auto-imported and typed against your deployment. The same client runs standalone in any Vue app.
---

:::u-page-hero
---
orientation: horizontal
class: "landing-hero-ground landing-panel"
ui:
  # THE PAIR, past 1280. The theme's `lg:grid-cols-2` splits the container
  # down the middle, and the plate is capped at 32rem — so everything the
  # half-track had spare piled up as dead air between the copy and the
  # instrument (~200px at 1366, on top of the 64px gutter). The panel track
  # is now the plate's own width and the copy takes the rest, which turns
  # that slack into an 80px gutter and hands the difference to the copy.
  #
  # Deliberately xl and not lg: at 1024 the two tracks are 448px each, the
  # billet is already wrapping to four lines, and the code well is already
  # at its 12px floor. There is no slack to redistribute down there — 880px
  # cannot hold a 448px copy AND a 512px plate — so the split would come
  # straight out of the headline. Below 1280 the theme's halves stand.
  container: "xl:grid-cols-[minmax(0,1fr)_32rem] xl:gap-x-20"
  header: "motion-safe:animate-fade-up"
  title: "landing-billet"
  # The relief headline is a physical object on the plate, not a line of
  # type: it needs a margin the way a stamped part needs clearance, or the
  # sentence under it reads as a caption stuck to its foot.
  #
  # Two points off the theme's own scale (lg/xl -> base/lg): at 20px the
  # copy was reading as a second headline rather than as the sentence
  # under one, and the hero already carries three competing voices —
  # the relief billet, the spec board and the primary call. The line
  # height comes down with it so the three beats stay one block.
  #
  # `text-pretty`: the closer is two claims on two lines at desktop width,
  # and on a phone each of them wraps again — left to the greedy breaker
  # the second one dropped "Vue app." alone on a fourth line. Pretty
  # balances the last two lines instead of orphaning the final words.
  description: "mt-12 text-base text-pretty sm:text-lg/7"
  # The spec stamp sits in #body, between the copy and the calls to
  # action, at the theme's own distance from the text (mt-10, 40px). The
  # footer then closes up UNDER that: the stamp is the line directly
  # above the buttons, and it belongs to them — a nameplate over the
  # controls — not to the sentence it has just left behind.
  #
  # 32px, not the 24px it opened on. At 24 the board's bottom lip and
  # the button's top edge were reading as one stacked part rather than
  # as a readout with its controls under it — the two are the same
  # width to within a few pixels, which is exactly the coincidence that
  # makes a tight gap look like a seam. It stays short of the 40px
  # above the board, so the stamp still belongs downward.
  footer: "mt-8"
links:
  - label: get started
    to: /getting-started/introduction
    # The destination is the docs, not a next step in a flow — an open book
    # names it, and a noun LEADS the way the github mark does (arrows stay
    # trailing, where they mean direction).
    icon: i-nc-book-open
    color: primary
    # A KEY, cut to a fixed 160x44 rather than grown out of its padding —
    # the page's one primary control, and the only accent part above the
    # fold, so it is sized like a switch you reach for rather than like a
    # link. Both figures are set, not inferred: a part whose outline moves
    # with its label is a link with a background, and this one has to hold
    # the same rectangle whatever the string in it. `justify-center` is
    # what a fixed width needs — the theme's base is `inline-flex
    # items-center` with no main-axis rule, so contents would otherwise
    # pack to the leading edge inside the extra room.
    #
    # px-3, down from the px-7 that used to BE the width. It is a floor
    # now, not a measurement: 160 - 24 leaves 136px of key face against
    # ~119px of icon + gap + label at 18px, so the label clears its
    # `truncate` with room to spare and the two never fight. It came
    # down a step when the label went 16 -> 18px: the padding is the
    # only thing standing between a wider string and an ellipsis.
    #
    # The cast goes HARD with it (`hard-cast`, depth.css): with nothing
    # else standing on this stretch of plate, the soft bloom under the
    # part had no neighbour to be read against and came out as a glow
    # around the button instead of as its contact with the ground. That
    # utility now hardens the label's cut to match — see THE CRISP CAST.
    class: h-11 w-40 justify-center px-3 text-lg hard-cast
    ui:
      # size xl ships a 24px icon — oversized next to an 18px label.
      leadingIcon: size-4.5
      # THE LABEL IS CENTRED ON ITS LETTERS, not on its em box. `items-
      # center` centres the line box, which carries the font's full
      # ascent and descent — space reserved for accents and capitals
      # this page never sets, and unevenly, since ascent runs deeper
      # than descent. Trimming both edges back to cap-height and the
      # baseline hands the flexbox the block the reader actually sees,
      # and the 44px key then centres THAT.
      #
      # `overflow-visible!` is the price: trimming to the baseline puts
      # the descender of the g outside the content box, and the theme's
      # own `truncate` on this slot would clip it off. Important, not
      # merely later — both classes survive the merge (tailwind-merge
      # does not read them as one axis) and their order in the sheet is
      # not ours to fix. The ellipsis and the nowrap from `truncate`
      # stay; only the clipping goes, and at a fixed 160px with 18px of
      # slack there is nothing here left to clip.
      label: "[text-box:trim-both_cap_alphabetic] overflow-visible!"
  - label: github
    to: https://github.com/qruto/nuxt-convex-module
    target: _blank
    icon: i-simple-icons-github
    color: neutral
    variant: ghost
    # 18px to match the key. The two are one control group — a pair of
    # calls sitting on one line, at one height — and a half-step of type
    # between them would read as a mistake rather than as hierarchy.
    # Weight, colour and the plate under the key carry that instead.
    class: text-lg
    ui:
      # Trimmed on the same metric as the key beside it — the two labels
      # are centred in boxes of the same height (the links row stretches
      # this one to the key's 44px), so if only one were trimmed they
      # would sit on two different baselines a pixel or so apart, which
      # on a pair this close reads as a misprint.
      label: "[text-box:trim-both_cap_alphabetic] overflow-visible!"
---
::landing-hero-panel
```ts
const { data } = await useAsyncQuery(
  api.messages.list,
)
```

```ts
const send =
  useMutation(api.messages.send)

await send({ body: 'hi, realtime' })
```

```ts
const { results, loadMore } =
  usePaginatedQuery(api.messages.list,
    {}, { initialNumItems: 3 })
```

```ts
const { upload, progress } =
  useUpload(api.files.generateUploadUrl)

const id = await upload(file)
```

```ts
import { api } from '#convex/api'
const { data } = await useAsyncQuery(api.messages.list)
const send = useMutation(api.messages.send)
```
::

#title
::hero-billet
Use :brand-convex backend\
in a :brand-nuxt application
::

#description
<!-- Three beats, and the middle one is no longer a sentence. The six
     capabilities used to run as a comma list inside the second line, where
     a reader had to parse them out of the prose; they now stand as a part
     legend (LandingCapabilities.vue) — mark, name, and the composable that
     is that feature — which the instrument panel beside the copy lights
     entry by entry as it demonstrates each one.

     Hierarchy is held by material, not size. The billet and the primary key
     stay first: the lead is the one bold line and the only headline-ink
     text in the copy, the legend sits in body ink with cut mono stamps, and
     the closer runs plain and muted. The `.text-primary` span the closer
     used to carry is gone — the legend's lamp is the copy's accent now, and
     a second one would have the two argue with the key. -->
**One install wires Convex into Nuxt.**

:landing-capabilities

<!-- The closer is one aside on two lines: a hard break, so the two claims
     land one per line at every width rather than splitting wherever the
     column happens to run out. -->
Auto-imported and typed against your deployment.\
The same client runs standalone in any Vue app.

#body
<!-- The spec board — version, the peer ranges, and the upstream Convex
     release the port matches — set as a scoreboard: one recessed readout,
     a cell per figure, directly above the calls to action. In #body rather
     than the description because it is a nameplate, not a sentence. The
     peer ranges are this page's copy and travel as props; the version and
     the Convex figure the component reads for itself. -->
:landing-version-chip{nuxt="≥ 4.1" vue="≥ 3.5"}

#bottom
:landing-services
:::

::u-page-section
---
id: spec
# pb-5: the one plate that overflows the screen ends on its last row of
# cards, and they sat 20px too close to the scribed edge for a sheet
# that is read to its foot.
class: "landing-mill-grid landing-panel landing-reveal pb-5 border-b border-default"
---
#title
:concave-text[Everything the module ships]

<!-- No description. The one that stood here narrated the plate — numbered
     figures, colour bands, engraved stages, cards that link — which is a
     caption for a layout, not a claim about the package. The nine cards
     below each make their own claim; a paragraph restating that they are
     nine cards adds nothing a reader cannot see. -->

#body
:landing-spec-sheet
::

:::u-page-section
---
id: operation
class: "landing-mill-rings landing-panel landing-reveal border-b border-default"
---
#title
:concave-text[One table, live in every client]

#description
<!-- Two short sentences, one device. The build before this one named the
     composables and set two bold spans and two code spans across three
     lines — every device the page has, spent on a claim the stage under it
     demonstrates anyway. The panes are labelled CLIENT A and CLIENT B and
     stamp SIMULATED · ZERO NETWORK on their own foot; the sentence only has
     to say what the reader is about to watch happen.

     A HARD BREAK, not a wrap: the two sentences are the setup and the
     payoff, and left to reflow they landed the split wherever the viewport
     happened to put it. Broken here each sentence gets its own line at
     every width. The setup carries the accent — it is the premise the
     stage is about to be tested against — and the payoff runs plain
     underneath it, which is the same order the hero sets. -->
[Two isolated clients, no shared props.]{.text-primary}\
A write from either side shows up in both on the same commit.

#body
::landing-operation
```ts
const { data } =
  useQuery(api.messages.list)
```

```ts
const send =
  useMutation(api.messages.send)

await send({
  author: 'client-a',
  body: 'hello from A',
})
```

```ts
await send({
  author: 'client-b',
  body: 'hello back from B',
})
```
::
:::

:::u-page-section
---
id: bench
class: "landing-mill-hatch landing-panel landing-reveal border-b border-default"
---
#title
:concave-text[Optimistic writes, pagination and uploads]

#description
<!-- Down to the one thing the plate does not already say. The three cards
     below name their own composable and state what it does — a paragraph
     above them restating all three in the same words is the spec sheet's
     mistake repeated. What is left is the caveat, and it has to stay:
     unlike the sync loop above, this stage carries no SIMULATED stamp of
     its own, so the sentence is the only place a reader is told these
     three run dry. -->
Staged here with no network — the guide's [live demos](/guide/pagination)
run all three against a real deployment.

#body
::landing-bench
```ts
const send = useMutation(api.messages.send)
  .withOptimisticUpdate((store, { body }) => {
    // render the write before the commit
  })
```

```ts
const { results, status, loadMore } =
  usePaginatedQuery(api.messages.list, {},
    { initialNumItems: 3 })
```

```ts
const { upload, progress } =
  useUpload(api.files.generateUploadUrl)
const storageId = await upload(file)
```
::
:::

:::u-page-section
---
id: deploy
class: "landing-mill-knurl landing-panel landing-reveal"
links:
  - label: Install the kit
    to: /getting-started/installation
    trailingIcon: i-nc-arrow-right
    color: primary
    ui:
      # size xl ships a 24px icon — oversized next to its 16px label.
      trailingIcon: size-4.5
  - label: See it running live
    to: /guide/queries
    color: neutral
    variant: outline
---
#title
:convex-text[Up and running in three moves]

#body
::landing-deploy
```bash
npx nuxi module add nuxt-convex-module
```

```bash
NUXT_PUBLIC_CONVEX_URL=https://…
```

```bash
npx convex dev
```
::
:::
