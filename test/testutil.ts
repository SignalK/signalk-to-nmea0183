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
