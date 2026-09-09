// Compare the committed rulesets against the ones GitHub is actually running.
//
// `.github/rulesets/*.json` is declared the source of truth for what protects
// `main`, but declaring it does not make it so: rules are edited in a settings
// page, and GitHub fills in defaults the committed file never mentioned. Both
// happened here — `require_extra_approval_for_unattributed_changes` appeared on
// its own. Scorecard notices that branch protection exists; it cannot notice
// that it stopped matching what was reviewed.
//
// Reports every difference and exits 1 on any. Read-only: it never writes to
// GitHub, so a drift is a conversation, not an automatic revert.
//
//   node scripts/check-rulesets.mjs            # needs `gh auth` or GH_TOKEN
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import process from 'node:process'

const dir = new URL('../.github/rulesets/', import.meta.url)
const repo = process.env.GITHUB_REPOSITORY ?? 'qruto/nuxt-convex-module'

const gh = args => JSON.parse(execFileSync('gh', ['api', ...args], { encoding: 'utf8' }))

const live = gh([`repos/${repo}/rulesets`])
const problems = []
const files = readdirSync(dir).filter(f => f.endsWith('.json'))
const committed = new Set()

// A ruleset nobody committed is the drift that matters most: rules can be added
// in the settings page, and one that exists only there was never reviewed.
for (const rule of live) {
  if (!files.some(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')).name === rule.name)) {
    problems.push(`${rule.name}: live but not committed — export it into .github/rulesets/`)
  }
}

for (const file of files) {
  const want = JSON.parse(readFileSync(new URL(file, dir), 'utf8'))
  const match = live.find(r => r.name === want.name)
  committed.add(want.name)

  if (!match) {
    problems.push(`${want.name}: committed but not applied — see .github/rulesets/README.md`)
    continue
  }

  const got = gh([`repos/${repo}/rulesets/${match.id}`])

  // Enforcement is ranked, not compared. Promotion is expected — the file can
  // sit at `evaluate` while the live rule is `active` — but a live rule WEAKER
  // than the file is the whole failure this check exists to catch: a gate
  // turned off is indistinguishable from one that was never on.
  const rank = { disabled: 0, evaluate: 1, active: 2 }
  if (rank[got.enforcement] < rank[want.enforcement]) {
    problems.push(`${want.name}: enforcement is "${got.enforcement}", weaker than the "${want.enforcement}" this file requires`)
  }
  else if (got.enforcement !== want.enforcement) {
    console.log(`  · ${want.name}: enforcement is "${got.enforcement}", file says "${want.enforcement}" — promote the file`)
  }

  // A ruleset can keep its name and its rules while pointing somewhere else.
  // Then every rule below still matches and `main` is no longer protected.
  if (got.target !== want.target) {
    problems.push(`${want.name}: target is "${got.target}", file says "${want.target}"`)
  }
  const refs = r => JSON.stringify({
    include: [...(r.conditions?.ref_name?.include ?? [])].sort(),
    exclude: [...(r.conditions?.ref_name?.exclude ?? [])].sort(),
  })
  if (refs(got) !== refs(want)) {
    problems.push(`${want.name}: applies to ${refs(got)}, file says ${refs(want)}`)
  }

  const rulesOf = r => Object.fromEntries(r.rules.map(rule => [rule.type, rule.parameters ?? {}]))
  const wantRules = rulesOf(want)
  const gotRules = rulesOf(got)

  for (const type of new Set([...Object.keys(wantRules), ...Object.keys(gotRules)])) {
    if (!(type in gotRules)) problems.push(`${want.name}: rule "${type}" is committed but not live`)
    else if (!(type in wantRules)) problems.push(`${want.name}: rule "${type}" is live but not committed`)
    else {
      // Only parameters the file states are compared. GitHub adds defaults of
      // its own, and failing on those would make the check unusable — but a
      // parameter the file DOES name must match exactly.
      for (const [key, value] of Object.entries(wantRules[type])) {
        const actual = JSON.stringify(gotRules[type][key])
        if (actual !== JSON.stringify(value)) {
          problems.push(`${want.name}: ${type}.${key} is ${actual}, file says ${JSON.stringify(value)}`)
        }
      }
    }
  }

  // GitHub omits `bypass_actors` entirely unless the caller can write the
  // ruleset, and the weekly job's token cannot. Treating an absent field as an
  // empty list would report a bypass difference on every run and train everyone
  // to ignore this check — so it is skipped, loudly, rather than guessed at.
  // Run it locally as an admin (`gh auth`) before promoting a ruleset, which is
  // when a stray bypass actor actually matters.
  if (!('bypass_actors' in got)) {
    console.log(`  · ${want.name}: bypass actors not visible to this token — run locally as an admin to compare them`)
  }
  else {
    const actors = r => (r.bypass_actors ?? []).map(a => `${a.actor_type}:${a.bypass_mode}`).sort().join(', ')
    if (actors(got) !== actors(want)) {
      problems.push(`${want.name}: bypass actors are [${actors(got)}], file says [${actors(want)}]`)
    }
  }
}

if (problems.length > 0) {
  console.error('\ncheck:rulesets — live rules differ from .github/rulesets/:\n')
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error('\nUpdate the file if the change was intended, or revert the change in GitHub.')
  process.exit(1)
}

console.log(`check:rulesets: ${committed.size} rulesets match what is committed`)
