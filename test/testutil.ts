import * as Bacon from 'baconjs'

type OnEmit = (name: string, value: unknown) => void

interface TestApp {
  streambundle: {
    getSelfStream: (path: string) => Bacon.Bus<unknown>
  }
  emit: (name: string, value: unknown) => void
  debug: (msg: unknown) => void
}

export function createAppWithPlugin(
  onEmit: OnEmit,
  enabledConversion: string | Record<string, unknown>
): TestApp {
  const streams: Record<string, Bacon.Bus<unknown>> = {}
  const app: TestApp = {
    streambundle: {
      getSelfStream: (p: string): Bacon.Bus<unknown> => {
        const existing = streams[p]
        if (existing) {
          return existing
        }
        const bus = new Bacon.Bus<unknown>()
        streams[p] = bus
        return bus
      }
    },
    emit: (name: string, value: unknown): void => {
      if (name === 'nmea0183out') {
        onEmit(name, value)
      }
    },
    debug: (msg: unknown): void => {
      console.log(msg)
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const plugin = require('../src/index')(app)
  // enabledConversion can be a sentence-name string (legacy form) or a
  // full options object so callers can also set throttle keys etc.
  const options: Record<string, unknown> =
    typeof enabledConversion === 'string'
      ? { [enabledConversion]: true }
      : enabledConversion
  plugin.start(options)
  return app
}
