// StackBlitz runs this instead of `npm run dev` (see .stackblitzrc). It asks
// for a Convex development deploy key and starts `npm run dev` with it, so the
// sandbox reaches your own cloud deployment without logging in to your
// account. The key lives only in this process's environment; nothing is
// written to disk.
import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { Writable } from 'node:stream'

// Readline echoes what it reads. Drop that echo while the key is typed, so the
// key never shows in the terminal.
let hidden = false
const output = new Writable({
  write(chunk, encoding, done) {
    if (!hidden) process.stdout.write(chunk, encoding)
    done()
  },
})
const prompt = createInterface({ input: process.stdin, output, terminal: true })
console.log('\nConnect this playground to a Convex deployment of yours: paste a')
console.log('development deploy key from dashboard.convex.dev → your project →')
console.log('Settings → Deploy keys → Generate a deploy key.\n')

let key = ''
for (;;) {
  process.stdout.write('Development deploy key (hidden): ')
  hidden = true
  key = (await prompt.question('')).trim()
  hidden = false
  process.stdout.write('\n')
  // A production key would push this app's functions over a live deployment.
  if (key.startsWith('dev:')) break
  console.log('A development deploy key starts with `dev:`.')
}
prompt.close()

spawn('npm run dev', { stdio: 'inherit', shell: true, env: { ...process.env, CONVEX_DEPLOY_KEY: key } })
  .on('exit', (code) => {
    if (code) console.log('\nRun `node .stackblitz/start.mjs` to try another key.')
    process.exit(code ?? 0)
  })
