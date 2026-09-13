/**
 * The second window: the hero's canvas at /canvas, as a small named popup
 * centred over this page and on the same table — paint in either and the
 * other moves a round trip later. One name, so a second press focuses the
 * window that is already open instead of opening another.
 */
export function openCanvasWindow() {
  const width = 440
  const height = 560
  const left = Math.round(window.screenX + (window.outerWidth - width) / 2)
  const top = Math.round(window.screenY + (window.outerHeight - height) / 2)
  const popup = window.open('/canvas', 'nc-canvas', `popup=yes,width=${width},height=${height},left=${left},top=${top}`)
  popup?.focus()
}
