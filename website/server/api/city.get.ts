// Where the visitor is, as the edge sees it — for the hero's reactions,
// whose `city` switch puts the sender's city on their lines. Read off
// Vercel's geo header, which is set per request at the edge and never
// reaches the client any other way; a local dev server has no such header
// and answers `null`, and the plate falls back to the browser's time zone.
// Never cached: it is a fact about the request, not about the page.
export default defineEventHandler((event) => {
  const raw = getRequestHeader(event, 'x-vercel-ip-city')
  if (!raw) return { city: null }
  try {
    return { city: decodeURIComponent(raw) }
  }
  catch {
    return { city: null }
  }
})
