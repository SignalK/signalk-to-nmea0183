/*
 * Live-snapshot probe.
 *
 * Loads a captured Signal K deltastream snapshot from JSON, wires every
 * sentence encoder up to mocked streams, pushes the snapshot values, and
 * reports per-encoder: emitted NMEA sentences and silent paths.
 *
 * Push ordering matters because of `.debounceImmediate(20)` in index.ts:
 * the combined stream fires once and ignores subsequent values for 20 ms.
 * So we push "context" paths (those that have a default in the encoder)
 * BEFORE "trigger" paths (those without a default), so the first fire
 * already has the real context values.
 *
 * Run: npx tsx scripts/probe-snapshot.ts <snapshot.json>
 */
import * as fs from 'fs'
import * as path from 'path'
import * as Bacon from 'baconjs'

interface Snapshot {
  scenario: string
  paths: Record<string, unknown>
}

const snapshotFile = process.argv[2]
if (!snapshotFile) {
  console.error('Usage: probe-snapshot.ts <snapshot.json>')
  process.exit(2)
}
const snapshot = JSON.parse(
  fs.readFileSync(path.resolve(snapshotFile), 'utf8')
) as Snapshot

console.log('\n=== Probing snapshot: ' + snapshot.scenario + ' ===')
console.log('Captured paths: ' + Object.keys(snapshot.paths).length + '\n')

// eslint-disable-next-line @typescript-eslint/no-var-requires
const factory = require('../src/index')

interface MockApp {
  streambundle: { getSelfStream: (p: string) => Bacon.Bus<unknown> }
  emit: (n: string, v: unknown) => void
  debug: (m: unknown) => void
  reportOutputMessages?: (n: number) => void
}

interface PerEncoder {
  name: string
  subscribed: string[]
  emitted: string[]
  silentPaths: string[]
  errors: string[]
}

function probeEncoder(name: string): Promise<PerEncoder> {
  const streams: Record<string, Bacon.Bus<unknown>> = {}
  const emitted: string[] = []
  const errors: string[] = []
  const app: MockApp = {
    streambundle: {
      getSelfStream: (p: string): Bacon.Bus<unknown> => {
        if (!streams[p]) streams[p] = new Bacon.Bus<unknown>()
        return streams[p]!
      }
    },
    emit: (n: string, v: unknown): void => {
      if (n === 'nmea0183out') emitted.push(String(v))
    },
    debug: (m: unknown): void => {
      const s = String(m)
      if (s.includes('not converting') || s.includes('skip')) errors.push(s)
    }
  }
  const plugin = factory(app)
  if (!plugin.sentences[name]) {
    return Promise.resolve({
      name,
      subscribed: [],
      emitted: [],
      silentPaths: [],
      errors: ['encoder not loaded']
    })
  }
  const encoder = plugin.sentences[name]
  plugin.start({ [name]: true })

  // Order pushes so context paths (those with a default) go first; the
  // last push (a trigger path with no default) fires the combined stream
  // with all context already populated.
  const keys = encoder.keys as string[]
  const defaults = (encoder.defaults || []) as unknown[]
  const contextPaths = keys.filter(
    (_k: string, i: number) => defaults[i] !== undefined
  )
  const triggerPaths = keys.filter(
    (_k: string, i: number) => defaults[i] === undefined
  )
  const pushOrder = [...contextPaths, ...triggerPaths]

  const subscribed = Object.keys(streams)
  const silentPaths: string[] = []
  for (const p of pushOrder) {
    if (p in snapshot.paths) {
      streams[p]!.push(snapshot.paths[p])
    } else if (defaults[keys.indexOf(p)] === undefined) {
      // Trigger path missing - encoder cannot fire
      silentPaths.push(p)
    }
  }
  return new Promise<PerEncoder>((resolve) => {
    setTimeout(() => {
      try {
        plugin.stop()
      } catch {}
      resolve({ name, subscribed, emitted, silentPaths, errors })
    }, 100)
  })
}

async function main(): Promise<void> {
  const tmpApp: MockApp = {
    streambundle: { getSelfStream: () => new Bacon.Bus<unknown>() },
    emit: () => {},
    debug: () => {}
  }
  const tmpPlugin = factory(tmpApp)
  const encoderNames = Object.keys(tmpPlugin.sentences).sort()

  const results: PerEncoder[] = []
  for (const name of encoderNames) {
    // eslint-disable-next-line no-await-in-loop
    const r = await probeEncoder(name)
    results.push(r)
  }

  console.log('=== Per-encoder result ===')
  for (const r of results) {
    if (r.emitted.length > 0) {
      console.log(
        '  OK  ' + r.name.padEnd(12) + ' -> ' + r.emitted[r.emitted.length - 1]
      )
    } else {
      const reason =
        r.silentPaths.length > 0
          ? 'silent paths: ' + r.silentPaths.join(', ')
          : r.errors.length > 0
            ? 'errors: ' + r.errors.join('; ')
            : 'no emission'
      console.log(
        '  --  ' + r.name.padEnd(12) + ' -> DID NOT EMIT (' + reason + ')'
      )
    }
  }
}

main().then(() => process.exit(0))
