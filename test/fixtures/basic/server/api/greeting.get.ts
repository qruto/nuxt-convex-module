// `fetchQuery` is a Nitro auto-import registered by the module.
export default defineEventHandler(async () => {
  const value = await fetchQuery('greetings:get' as never, {})
  return { value }
})
