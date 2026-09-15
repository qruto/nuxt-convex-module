/**
 * The second window: the hero's instrument on its own page (/reactions —
 * and /canvas, where the canvas plate lives on), as a small named popup
 * centred over this page and on the same table — press a key in either and
 * the other prints it a round trip later. One name per instrument, so a
 * second press focuses the window that is already open instead of opening
 * another.
 */
export function openSecondWindow(path: '/reactions' | '/canvas') {
  // As wide as the hero plate itself (32rem plus the page's gutters), so
  // the two plates are the same size side by side and the rail's line
  // fits in both.
  const width = 560
  const height = 620
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2)
  // fallow-ignore-next-line security-sink -- the target is a union of two literal same-origin paths (the parameter's type), never input; verified 2026-09-15
  const popup = window.open(path, `nc-${path.slice(1)}`, `popup=yes,width=${width},height=${height},left=${left},top=${top}`)
  popup?.focus()
}
