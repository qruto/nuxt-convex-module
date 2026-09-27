// PARITY: A-09
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { combinedDevScript, setupDevScript } from '../../src/dev-script'

let rootDir: string
afterEach(() => rmSync(rootDir, { recursive: true, force: true }))

function app(manifest: Record<string, unknown> | string): string {
  rootDir = mkdtempSync(join(tmpdir(), 'convex-dev-script-'))
  writeFileSync(join(rootDir, 'package.json'), typeof manifest === 'string' ? manifest : JSON.stringify(manifest, null, 2) + '\n')
  return rootDir
}

const read = () => readFileSync(join(rootDir, 'package.json'), 'utf8')
const withConvex = { dependencies: { convex: '^1.40.0', nuxt: '^4.1.0' } }

describe('setupDevScript', () => {
  it('rewrites the plain `nuxt dev` script to run Convex beside it', () => {
    app({ ...withConvex, scripts: { dev: 'nuxt dev', build: 'nuxt build' } })

    expect(setupDevScript(rootDir)).toEqual({ changed: true, from: 'nuxt dev', to: 'convex dev --start "nuxt dev"' })
    const manifest = JSON.parse(read()) as { scripts: Record<string, string> }
    expect(manifest.scripts).toEqual({ dev: 'convex dev --start "nuxt dev"', build: 'nuxt build' })
  })

  it('keeps the Nuxt flags and accepts `nuxi dev`', () => {
    app({ ...withConvex, scripts: { dev: 'nuxi dev --host --port 4000' } })
    expect(setupDevScript(rootDir).to).toBe(combinedDevScript('nuxi dev --host --port 4000'))
  })

  it('preserves the file\'s indentation and trailing newline', () => {
    app('{\n\t"scripts": {\n\t\t"dev": "nuxt dev"\n\t},\n\t"dependencies": { "convex": "^1.40.0" }\n}')
    setupDevScript(rootDir)
    expect(read()).toBe('{\n\t"scripts": {\n\t\t"dev": "convex dev --start \\"nuxt dev\\""\n\t},\n\t"dependencies": {\n\t\t"convex": "^1.40.0"\n\t}\n}')
  })

  it.each([
    ['a script the app already shaped', { ...withConvex, scripts: { dev: 'nuxt dev && echo done' } }],
    ['a script that already runs Convex', { ...withConvex, scripts: { 'dev': 'nuxt dev', 'dev:convex': 'convex dev' } }],
    ['a combined script it wrote before', { ...withConvex, scripts: { dev: 'convex dev --start "nuxt dev"' } }],
    ['a script with quotes in it', { ...withConvex, scripts: { dev: 'nuxt dev --dotenv ".env.dev"' } }],
    ['an app without `convex` as a dependency', { dependencies: { nuxt: '^4.1.0' }, scripts: { dev: 'nuxt dev' } }],
    ['no dev script', { ...withConvex, scripts: { build: 'nuxt build' } }],
    ['no scripts at all', withConvex],
  ])('leaves %s alone', (_case, manifest) => {
    app(manifest)
    const before = read()
    expect(setupDevScript(rootDir)).toEqual({ changed: false })
    expect(read()).toBe(before)
  })

  it('is a no-op on a missing or malformed manifest', () => {
    app('{ not json')
    expect(setupDevScript(rootDir)).toEqual({ changed: false })
    expect(setupDevScript(join(rootDir, 'nowhere'))).toEqual({ changed: false })
  })
})
