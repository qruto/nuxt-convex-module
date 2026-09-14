import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve, sep } from 'node:path'
import ts from 'typescript'

const root = process.cwd()
export const at = (file: string) => resolve(root, file)
export const read = (file: string) => readFileSync(at(file), 'utf8')

/**
 * Every file under `dir` (relative to the repo root) with one of `exts`.
 * Paths come back `/`-separated on every platform — the tests match them with
 * `/` patterns, and Node's fs accepts that spelling on Windows too.
 */
export function walk(dir: string, exts: string[], skip: (path: string) => boolean = () => false): string[] {
  const out: string[] = []
  const visit = (d: string) => {
    for (const entry of readdirSync(d)) {
      const path = join(d, entry).split(sep).join('/')
      if (skip(path)) continue
      if (statSync(path).isDirectory()) visit(path)
      else if (exts.some(ext => path.endsWith(ext))) out.push(path)
    }
  }
  visit(at(dir))
  return out
}

/** Backticked tokens in a markdown string, in order. */
export const backticked = (markdown: string) => [...markdown.matchAll(/`([^`\n]+)`/g)].map(m => m[1]!)

/** The first-cell tokens of every row of the markdown table under `heading`. */
export function tableFirstCells(markdown: string, heading: string): string[] {
  const start = markdown.indexOf(heading)
  if (start === -1) return []
  const next = markdown.indexOf('\n## ', start + heading.length)
  const section = markdown.slice(start, next === -1 ? undefined : next)
  return [...section.matchAll(/^\| `([^`]+)`/gm)].map(m => m[1]!)
}

/** Property names of an exported interface in a TypeScript file. */
export function interfaceKeys(file: string, name: string): string[] {
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true)
  const keys: string[] = []
  const visit = (node: ts.Node) => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === name) {
      for (const member of node.members) if (ts.isPropertySignature(member) && member.name) keys.push(member.name.getText(source))
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return keys
}

/** The literal text a message-carrying expression produces; `…` for each interpolation. */
function literalText(node: ts.Expression): string[] {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text]
  if (ts.isTemplateExpression(node)) return [node.head.text + node.templateSpans.map(span => `…${span.literal.text}`).join('')]
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    // A non-literal side is an interpolation: `'prefix ' + error.message`.
    const side = (n: ts.Expression) => {
      const t = literalText(n)
      return t.length > 0 ? t : ['…']
    }
    const left = side(node.left)
    const right = side(node.right)
    return left.flatMap(l => right.map(r => l + r))
  }
  if (ts.isParenthesizedExpression(node)) return literalText(node.expression)
  if (ts.isConditionalExpression(node)) return [...literalText(node.whenTrue), ...literalText(node.whenFalse)]
  return []
}

const LOGGER_METHODS = ['warn', 'error', 'info', 'success']
const CONSOLE_METHODS = ['warn', 'error']

/** `logger.warn(x)`, `console.error(x)`, `errors.push(x)`, `warnings.push(x)` → its kind and message argument. */
function messageCall(node: ts.CallExpression, source: ts.SourceFile): { kind: string, argument: ts.Expression } | undefined {
  if (!ts.isPropertyAccessExpression(node.expression) || !node.arguments[0]) return undefined
  const object = node.expression.expression.getText(source)
  const method = node.expression.name.text
  const logs = (object === 'logger' && LOGGER_METHODS.includes(method)) || (object === 'console' && CONSOLE_METHODS.includes(method))
  const pushes = (object === 'errors' || object === 'warnings') && method === 'push'
  if (logs) return { kind: `${object}.${method}`, argument: node.arguments[0] }
  if (pushes) return { kind: object, argument: node.arguments[0] }
  return undefined
}

/** `new Error(x)` / `new TypeError(x)` → its kind and message argument. */
function thrownMessage(node: ts.NewExpression, source: ts.SourceFile): { kind: string, argument: ts.Expression } | undefined {
  const name = node.expression.getText(source)
  if (!['Error', 'TypeError'].includes(name) || !node.arguments?.[0]) return undefined
  return { kind: `throw ${name}`, argument: node.arguments[0] }
}

export interface SourceMessage { file: string, line: number, kind: string, text: string }

/** Every user-facing message a source file can emit: logger/console calls, thrown errors, diagnostic pushes. */
export function messagesIn(file: string): SourceMessage[] {
  const source = ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true)
  const found: SourceMessage[] = []
  const visit = (node: ts.Node) => {
    const message = ts.isCallExpression(node)
      ? messageCall(node, source)
      : ts.isNewExpression(node) ? thrownMessage(node, source) : undefined
    if (message) {
      const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
      for (const text of literalText(message.argument)) found.push({ file, line, kind: message.kind, text })
    }
    ts.forEachChild(node, visit)
  }
  visit(source)
  return found
}
