import * as assert from 'assert'

import * as Bacon from 'baconjs'
import type { Conversion } from '../src/types/plugin'

type OnEmit = (name: string, value: unknown) => void

interface EmittedEvent {
  name: string
  value: unknown
}

interface TestApp {
  streambundle: {
    getSelfStream: (path: string) => Bacon.Bus<unknown>
  }
  emit: (name: string, value: unknown) => void
  debug: (msg: unknown) => void
  getSelfPath: (path: string) => { value: unknown } | null
  emittedEvents: EmittedEvent[]
}

/**
 * Build a stub Signal K `app` and start the plugin against it.
 *
 * `enabledConversion` accepts three forms so test files can stay terse:
 *   - string: shorthand for a single conversion `[{ sentence: string }]`
 *   - array:  new-format `conversions` array
 *   - object: full options (legacy flat-boolean form or `{ conversions }`)
 */
export function createAppWithPlugin(
  onEmit: OnEmit,
  enabledConversion: string | Conversion[] | Record<string, unknown>
): TestApp {
  const streams: Record<string, Bacon.Bus<unknown>> = {}
  const app: TestApp = {
    streambundle: {
      getSelfStream: (p: string): Bacon.Bus<unknown> => {
        const existing = streams[p]
        if (existing) return existing
        const bus = new Bacon.Bus<unknown>()
        streams[p] = bus
        return bus
      }
    },
    emittedEvents: [],
    emit: (name: string, value: unknown): void => {
      app.emittedEvents.push({ name, value })
      if (name === 'nmea0183out') {
        onEmit(name, value)
      }
    },
    debug: (msg: unknown): void => {
      console.log(msg)
    },
    getSelfPath: () => null
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const plugin = require('../src/index')(app)

  let options: Record<string, unknown>
  if (typeof enabledConversion === 'string') {
    options = { conversions: [{ sentence: enabledConversion }] }
  } else if (Array.isArray(enabledConversion)) {
    options = { conversions: enabledConversion }
  } else {
    options = enabledConversion
  }
  plugin.start(options)
  return app
}

/**
 * Push Signal K values one per event-loop tick (30 ms apart) and assert
 * the last emitted NMEA sentence after a final 30 ms settle delay.
 *
 * Background
 * ----------
 * When a sentence encoder carries `defaults` on all keys, the BaconJS
 * combined stream fires the moment the first path emits.
 * `debounceImmediate(20)` in index.ts fires immediately on that first
 * event and suppresses further events within the 20 ms window.
 *
 * Consequence: synchronous multi-path pushes are coalesced into only the
 * FIRST emission; subsequent values are swallowed by the debounce window.
 *
 * Solution: push each path after the previous debounce window has expired
 * (30 ms gap > 20 ms window).  The helper calls `done` after one extra
 * settle period so the final push is always captured.
 *
 * @param sentence  - encoder key used with `createAppWithPlugin`
 * @param pushes    - ordered list of { path, value } to push sequentially
 * @param expected  - exact NMEA sentence string expected as the last emission
 * @param done      - Mocha done callback
 */
export function testSequential(
  sentence: string,
  pushes: Array<{ path: string; value: number }>,
  expected: string,
  done: Mocha.Done
): void {
  let last: string | undefined
  const onEmit = (_event: string, value: unknown): void => {
    last = value as string
  }
  const app = createAppWithPlugin(onEmit, sentence)

  let i = 0
  function step(): void {
    if (i < pushes.length) {
      const { path, value } = pushes[i++]!
      app.streambundle.getSelfStream(path).push(value)
      setTimeout(step, 30)
    } else {
      setTimeout(() => {
        assert.strictEqual(last, expected)
        done()
      }, 30)
    }
  }
  step()
}

/**
 * Assert that a sentence encoder emits nothing after a given set of pushes.
 *
 * Useful for testing suppression guards: pushes are made synchronously
 * (no inter-push delay needed — if even the first push were to trigger
 * emission we want to detect that), then we wait 60 ms for any deferred
 * emission to materialise before asserting silence.
 */
export function testSuppressed(
  sentence: string,
  pushes: Array<{ path: string; value: number }>,
  done: Mocha.Done
): void {
  let emitted = false
  const onEmit = (): void => {
    emitted = true
  }
  const app = createAppWithPlugin(onEmit, sentence)
  for (const { path, value } of pushes) {
    app.streambundle.getSelfStream(path).push(value)
  }
  setTimeout(() => {
    assert.strictEqual(emitted, false)
    done()
  }, 60)
}
