import type { H3Event } from 'h3'
import { queryCollection } from '@nuxt/content/server'

// The docs card (app/components/OgImage/Docs.takumi.vue) gets its text
// through the image URL, and Docus squeezes the description to fit it:
// commas dropped, cut to a budget shared with the title, and a non-ASCII
// character anywhere — this site's em dashes — switches the encoding to
// base64, which swells past nuxt-og-image's 200-character segment and is
// truncated to something that no longer decodes. Most docs cards would
// render without a description. So the card reads the page's own
// description off the collection instead.
//
// The page is found by its card title, not its path: at build time the
// card URL is a hash of the card's options, the page path is not carried
// on it reliably, but the title is — and it is exactly what Docus derives
// from the page (`seo.title` or `title`, cut to 60 characters), so the
// same derivation here matches it back.
const TITLE_LIMIT = 60

interface DocsPage { title?: string, description?: string, seo?: { title?: string, description?: string } }

let pages: Promise<DocsPage[]> | undefined

function loadPages(e: H3Event) {
  pages ??= queryCollection(e, 'docs')
    .select('title', 'description', 'seo')
    .all()
    .catch(() => [] as DocsPage[])
  return pages
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('nuxt-og-image:context', async (ctx) => {
    // The component name has been resolved to the registered PascalName.
    if (ctx.options.component !== 'OgImageDocsTakumi') return
    const title = ctx.options.props?.title
    if (typeof title !== 'string') return
    const page = (await loadPages(ctx.e)).find(page => (page.seo?.title || page.title)?.slice(0, TITLE_LIMIT) === title)
    const description = page?.seo?.description || page?.description
    if (description) {
      ctx.options.props = { ...ctx.options.props, description }
    }
  })
})
