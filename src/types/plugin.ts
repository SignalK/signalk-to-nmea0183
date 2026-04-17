/**
 * Core types for the signalk-to-nmea0183 plugin.
 *
 * `SignalKApp` is a minimal structural description of the `app` argument
 * the signalk-server host passes to the plugin factory. Only the members
 * the plugin actually uses are modelled. `unknown` is preferred over `any`
 * so that downstream calls go through explicit narrowing or a cast, which
 * keeps accidental misuse visible at the call site.
 *
 * `SentenceEncoder` is the shape every module in src/sentences/ returns.
 * Keys are Signal K paths; `f` is invoked with the latest value for each
 * path (in the same order as `keys`) and must return either an NMEA
 * sentence string or `undefined` to skip emission.
 *
 * `defaults[i]` is the seed used when the stream for `keys[i]` has not
 * emitted yet. Indexes without defaults remain non-property streams and
 * must emit at least once before the combined stream fires.
 */
import type { EventStream, Property } from 'baconjs'

/** @internal */
export type AnyStream<T = unknown> = EventStream<T> | Property<T>

// `StreamBundle` is exposed because `SignalKApp.streambundle` references
// it; stripping it via @internal would leave the public `.d.ts`
// referring to a symbol that no longer exists.
export interface StreamBundle {
  getSelfStream: (path: string) => AnyStream
}

/**
 * Minimal structural type for the `app` object the signalk-server host
 * passes to the plugin factory. Only the members this plugin actually
 * reaches for are modelled.
 */
export interface SignalKApp {
  streambundle: StreamBundle
  emit: (event: string, value: unknown) => void
  debug: (msg: unknown) => void
  error?: (msg: unknown) => void
  reportOutputMessages?: (n: number) => void
}

/**
 * A sentence encoder. Generic parameter `A` ties the arity of `f` to
 * the length of `keys` / `defaults` for encoders that opt in:
 *
 *   const enc: SentenceEncoder<[number, number, string]> = {
 *     keys: ['a', 'b', 'c'],
 *     f: (a, b, c) => ...
 *   }
 *
 * rejects a `keys` array of the wrong length or an `f` with a mismatched
 * signature at the type level. The default `readonly any[]` preserves
 * the loose shape the registry uses to iterate all encoders uniformly.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SentenceEncoder<
  A extends readonly unknown[] = readonly any[]
> {
  sentence?: string
  title: string
  keys: { readonly [I in keyof A]: string }
  defaults?: { readonly [I in keyof A]?: A[I] }
  optionKey?: string
  f: (...args: A) => string | undefined
}

/** @internal */
export type SentenceEncoderFactory = (
  app: SignalKApp,
  plugin?: SignalKPlugin
) => SentenceEncoder

// Exposed because `SignalKPlugin.schema` references these; they would
// otherwise be stripped by `stripInternal` and leave a broken .d.ts.
export interface SignalKPluginSchemaProperty {
  title: string
  type: string
  default?: unknown
}

export interface SignalKPluginSchema {
  type: string
  title: string
  description: string
  properties: Record<string, SignalKPluginSchemaProperty>
}

/**
 * Shape of the plugin object returned to the signalk-server host.
 * Consumers normally don't construct this directly — they call the
 * factory exported by the package entry.
 */
export interface SignalKPlugin {
  id: string
  name: string
  description: string
  schema: SignalKPluginSchema
  start: (options: Record<string, unknown>) => void
  stop: () => void
  sentences: Record<string, SentenceEncoder>
  unsubscribes: Array<() => void>
}
