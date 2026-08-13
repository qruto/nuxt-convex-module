/**
 * Typewriter reveal over a fenced code block that ProsePre + shiki already
 * rendered. Re-highlighting per keystroke would need shiki in the browser;
 * instead the fully-highlighted DOM is snapshotted once and its text nodes
 * are sliced to a growing prefix — every revealed character keeps the exact
 * token color it will have when the line is complete.
 *
 * The pre's rendered height is pinned as min-height before the first reset
 * so blanking the code doesn't collapse the plate and re-typing doesn't
 * pump layout. The caret is a `demo-caret` class (app.css) on the token
 * span owning the last revealed character.
 */
export interface CodeReveal {
  /** Total characters, newlines included — the reveal driver's loop bound. */
  length: number
  /** The full text, for per-character pacing decisions (e.g. rest on '\n'). */
  text: string
  /** Blank the block (call before typing a pass). */
  reset: () => void
  /** Show the first n characters. */
  revealTo: (n: number) => void
  /** Show everything, caret off — reduced motion, takeover, pass end. */
  finish: () => void
  clearCaret: () => void
}

interface Chunk {
  node: Text
  text: string
  start: number
}

export function createCodeReveal(container: HTMLElement): CodeReveal | null {
  const code = container.querySelector('pre code')
  if (!code) return null

  const pre = code.closest('pre')
  if (pre) {
    const { height } = pre.getBoundingClientRect()
    if (height > 0) pre.style.minHeight = `${height}px`
  }

  const walker = document.createTreeWalker(code, NodeFilter.SHOW_TEXT)
  const chunks: Chunk[] = []
  let length = 0
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const text = n.nodeValue ?? ''
    chunks.push({ node: n as Text, text, start: length })
    length += text.length
  }
  const text = chunks.map(c => c.text).join('')

  let caretHost: HTMLElement | null = null
  function setCaret(el: HTMLElement | null) {
    if (caretHost === el) return
    caretHost?.classList.remove('demo-caret')
    el?.classList.add('demo-caret')
    caretHost = el
  }

  function revealTo(n: number) {
    // The caret rides the deepest element owning the last visible character;
    // newline nodes live directly under <code>, where a caret would render at
    // the block's end, so they never host it.
    let host: HTMLElement | null = null
    for (const chunk of chunks) {
      const visible = Math.max(0, Math.min(chunk.text.length, n - chunk.start))
      chunk.node.nodeValue = chunk.text.slice(0, visible)
      if (visible > 0 && chunk.text.trim() !== '') host = chunk.node.parentElement
    }
    setCaret(n >= length ? null : host)
  }

  return {
    length,
    text,
    reset: () => revealTo(0),
    revealTo,
    finish: () => revealTo(length),
    clearCaret: () => setCaret(null),
  }
}

/**
 * Drive a reveal with a demo script's `wait` tool, paced like a person at an
 * editor rather than a metronome: keystrokes land in loose bursts, symbol
 * reaches ({, ', =) cost a beat more than word characters, a breath falls on
 * the occasional word boundary, and a line break rests before newline and
 * auto-indent land together — leading whitespace is never typed out, exactly
 * as no editor makes you. Cancellation unwinds through `wait` (the engine's
 * generation check), leaving the block wherever the takeover caught it.
 */
export async function typeCode(
  wait: (ms: number) => Promise<void>,
  reveal: CodeReveal,
  opts: { cps?: number, lineRest?: number } = {},
): Promise<void> {
  const base = 1000 / (opts.cps ?? 40)
  const lineRest = opts.lineRest ?? 340
  const symbol = /[{}()[\]<>='"`.,:;#$&|*+\\/-]/
  const { text, length } = reveal
  let i = 0
  while (i < length) {
    const ch = text[i]!
    if (ch === '\n') {
      let next = i + 1
      while (next < length && (text[next] === ' ' || text[next] === '\t')) next++
      // A trailing newline ends the pass; resting on it would read as a hang.
      if (next < length) await wait(lineRest * (0.8 + Math.random() * 0.9))
      i = next
    }
    else {
      let delay = base * (0.5 + Math.random() * 1.1)
      if (symbol.test(ch)) delay += base * (0.7 + Math.random() * 1.1)
      if (ch === ' ' && Math.random() < 0.2) delay += 90 + Math.random() * 240
      else if (Math.random() < 0.02) delay += 130 + Math.random() * 280
      await wait(delay)
      i++
    }
    reveal.revealTo(i)
  }
  reveal.clearCaret()
}
