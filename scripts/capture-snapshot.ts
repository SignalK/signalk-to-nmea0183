/*
 * Capture a Signal K deltastream snapshot.
 *
 * Connects to a running signalk-server, subscribes to the full delta
 * stream for `vessels.self`, accumulates the latest value seen on every
 * navigation/environment/steering path, and writes the result to a JSON
 * file consumable by `scripts/probe-snapshot.ts` and the integration
 * tests under `test/snapshots/`.
 *
 * Usage:
 *   npx tsx scripts/capture-snapshot.ts <ws-url> <out.json> [scenario-name]
 *
 * Example:
 *   npx tsx scripts/capture-snapshot.ts \
 *     wss://10.10.10.143/signalk/v1/stream \
 *     test/snapshots/route.json \
 *     "navigate-with-active-route"
 */
import * as fs from 'fs'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const WebSocket = require('ws')

const url = process.argv[2]
const outFile = process.argv[3]
const scenarioName = process.argv[4] ?? 'unnamed-scenario'
const captureSeconds = 9

if (!url || !outFile) {
  console.error(
    'Usage: capture-snapshot.ts <ws-url> <out.json> [scenario-name]'
  )
  process.exit(2)
}

function shouldInclude(p: string): boolean {
  return (
    p.startsWith('navigation.') ||
    p.startsWith('environment.') ||
    p.startsWith('steering.')
  )
}

interface SignalKDelta {
  updates?: Array<{
    values?: Array<{ path: string; value: unknown }>
  }>
}

const seen: Record<string, unknown> = {}
const ws = new WebSocket(url + '?subscribe=none', { rejectUnauthorized: false })

ws.on('open', () => {
  ws.send(
    JSON.stringify({
      context: 'vessels.self',
      subscribe: [{ path: '*' }]
    })
  )
  setTimeout(() => ws.close(), captureSeconds * 1000)
})

ws.on('message', (data: Buffer) => {
  let parsed: SignalKDelta
  try {
    parsed = JSON.parse(data.toString())
  } catch {
    return
  }
  for (const u of parsed.updates ?? []) {
    for (const v of u.values ?? []) {
      if (v.path && shouldInclude(v.path) && !(v.path in seen)) {
        seen[v.path] = v.value
      }
    }
  }
})

ws.on('close', () => {
  fs.writeFileSync(
    outFile,
    JSON.stringify(
      {
        scenario: scenarioName,
        capturedAt: new Date().toISOString(),
        paths: seen
      },
      null,
      2
    )
  )
  console.log('saved ' + Object.keys(seen).length + ' paths to ' + outFile)
  process.exit(0)
})

ws.on('error', (e: Error) => {
  console.error('ERR ' + e.message)
  process.exit(1)
})
