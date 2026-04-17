/**
 * Signal K server plugin entry point.
 *
 * Combines Signal K streams into inputs for the encoders in
 * src/sentences/, then emits the resulting NMEA0183 sentences on the
 * host's event bus.
 */
import { sentenceFactories } from './sentences'
import type * as PluginTypes from './types/plugin'
import type { Property } from 'baconjs'

type AnyStream<T = unknown> = PluginTypes.AnyStream<T>
type SentenceEncoder = PluginTypes.SentenceEncoder
type SignalKApp = PluginTypes.SignalKApp
type SignalKPlugin = PluginTypes.SignalKPlugin

// Combine N streams into a single Property whose values are fn(v1, v2, ...vN),
// using only the instance-method .combine(other, fn) that exists on both
// baconjs 1.x and 3.x. Avoids require('baconjs') in the plugin so that
// the plugin never carries its own Bacon copy: all stream operations run on
// the Bacon instance the host signalk-server created the streams with.
//
// The seed of the reduce calls .toProperty() so the result is always a
// Property even when there is only one input stream (no .combine call to
// implicitly lift it). Downstream callers depend on .changes(), which is a
// Property-only method.
function combineStreamsWith(
  streams: AnyStream[],
  fn: (...args: unknown[]) => unknown
): Property<unknown> {
  // Seed the reduce with streams[0] lifted to a Property<unknown[]> so
  // the running accumulator never holds null. Iterate streams.slice(1)
  // and keep extending the tuple. The explicit `.reduce<...>` type
  // parameter pins the accumulator for baconjs's
  // EventStream|Property-union combine return; with it inferred to
  // `Property<unknown[]>`, no cast is needed in the reducer body.
  const first = streams[0]!.toProperty().map((v): unknown[] => [v])
  return streams
    .slice(1)
    .reduce<Property<unknown[]>>(
      (acc, stream) => acc.combine(stream, (arr, v) => arr.concat([v])),
      first
    )
    .map((args) => fn.apply(null, args))
}

const createPlugin = function (app: SignalKApp): SignalKPlugin {
  const plugin: SignalKPlugin = {
    id: 'sk-to-nmea0183',
    name: 'Convert Signal K to NMEA0183',
    description: 'Plugin to convert Signal K to NMEA0183',
    schema: {
      type: 'object',
      title: 'Conversions to NMEA0183',
      description:
        'If there is SK data for the conversion generate the following NMEA0183 sentences from Signal K data. For converting NMEA2000 AIS to NMEA 0183 use the signalk-n2kais-to-nmea0183 plugin.',
      properties: {}
    },
    unsubscribes: [],
    sentences: {},
    start: function (options: Record<string, unknown>): void {
      function mapToNmea(encoder: SentenceEncoder, throttle?: unknown): void {
        const selfStreams = encoder.keys.map((key, index) => {
          let stream: AnyStream = app.streambundle.getSelfStream(key)
          if (
            encoder.defaults &&
            typeof encoder.defaults[index] !== 'undefined'
          ) {
            stream = stream.toProperty(encoder.defaults[index]) as AnyStream
          }
          return stream
        })
        const sentenceEvent = encoder.sentence
          ? `g${encoder.sentence}`
          : undefined

        let stream = (
          combineStreamsWith(
            selfStreams,
            function (this: unknown, ...args: unknown[]) {
              try {
                return encoder.f.apply(this, args)
              } catch (e) {
                console.error((e as Error).message)
                return undefined
              }
            }
          ) as Property<unknown>
        )
          .filter((v) => typeof v !== 'undefined')
          .changes()
          .debounceImmediate(20)

        if (typeof throttle === 'number' && throttle > 0) {
          stream = stream.throttle(throttle)
        }

        plugin.unsubscribes.push(
          stream.onValue((nmeaString) => {
            if (app.reportOutputMessages) {
              app.reportOutputMessages(1)
            }
            app.emit('nmea0183out', nmeaString)
            if (sentenceEvent) {
              app.emit(sentenceEvent, nmeaString)
            }
            app.debug(nmeaString)
          })
        )
      }

      Object.keys(plugin.sentences).forEach((name) => {
        if (options[name]) {
          mapToNmea(plugin.sentences[name]!, options[getThrottlePropname(name)])
        }
      })
    },
    stop: function (): void {
      plugin.unsubscribes.forEach((f) => f())
    }
  }

  plugin.sentences = loadSentences(app, plugin)
  buildSchemaFromSentences(plugin)
  return plugin
}

// `export = createPlugin` emits `module.exports = createPlugin` so the
// signalk-server plugin loader (plain CJS `require(...)`) continues to
// receive the factory directly. The `export =` form (vs the older
// `module.exports = ...` assignment) gives tsc a concrete symbol to
// emit into the `.d.ts`, so consumers importing the plugin see the
// real `(app: SignalKApp) => SignalKPlugin` signature instead of the
// opaque `export {}` the older pattern produced.
//
// A namespace merge on the same identifier re-exports the companion
// types from the package root. `export =` forbids named exports, so
// this is the canonical way to make
//   import type { SignalKPlugin } from '@signalk/signalk-to-nmea0183'
// work without forcing consumers into brittle subpath imports.
// eslint-disable-next-line @typescript-eslint/no-namespace
namespace createPlugin {
  export type SignalKApp = PluginTypes.SignalKApp
  export type SignalKPlugin = PluginTypes.SignalKPlugin
  export type SentenceEncoder<
    A extends readonly unknown[] = readonly any[] // eslint-disable-line @typescript-eslint/no-explicit-any
  > = PluginTypes.SentenceEncoder<A>
  export type StreamBundle = PluginTypes.StreamBundle
  export type SignalKPluginSchema = PluginTypes.SignalKPluginSchema
  export type SignalKPluginSchemaProperty =
    PluginTypes.SignalKPluginSchemaProperty
}

export = createPlugin

function buildSchemaFromSentences(plugin: SignalKPlugin): void {
  Object.keys(plugin.sentences).forEach((key) => {
    const sentence = plugin.sentences[key]!
    const throttlePropname = getThrottlePropname(key)
    plugin.schema.properties[key] = {
      title: sentence.title,
      type: 'boolean',
      default: false
    }
    plugin.schema.properties[throttlePropname] = {
      title: `${key} throttle ms`,
      type: 'number',
      default: 0
    }
  })
}

function loadSentences(
  app: SignalKApp,
  plugin: SignalKPlugin
): Record<string, SentenceEncoder> {
  // Static barrel import (`./sentences/index.ts`) replaces the previous
  // runtime `readdirSync + require` scan. tsc proves at compile time
  // that every entry matches `SentenceEncoderFactory`, and the plugin
  // boots without any filesystem I/O — noticeable on Cerbo-class hosts.
  const acc: Record<string, SentenceEncoder> = {}
  for (const name of Object.keys(sentenceFactories)) {
    acc[name] = sentenceFactories[name]!(app, plugin)
  }
  return acc
}

const getThrottlePropname = (key: string): string => `${key}_throttle`
