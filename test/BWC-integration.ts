/**
 * Integration test for BWC encoder with the full plugin system.
 * Validates registration, factory wiring, and end-to-end sentence
 * generation against a snapshot captured from a live signalk-server.
 */
import * as assert from 'assert'
import pluginFactory from '../src/index'
import type { SignalKPlugin } from '../src/types/plugin'

// Live snapshot from openplotter (vessel sailing near Marsh Harbour,
// Bahamas, 9° W magnetic variation, route active with a Location-type
// destination so the waypoint name has no published delta source).
const LIVE_SNAPSHOT = {
  datetime: '2026-05-08T16:38:51.000Z',
  position: { latitude: 26.547522602871112, longitude: -77.0623540878296 },
  bearingTrue: 5.003988233815001,
  bearingMagnetic: 4.843169020404653,
  distance: 331.7225852823217,
  expectedSentence:
    '$IIBWC,163851.00,2632.8514,N,07703.7412,W,286.7,T,277.5,M,0.18,N,*1B'
} as const

describe('BWC Integration', function () {
  function makeStubApp() {
    return {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }
  }

  it('is registered in the plugin sentence registry', () => {
    const plugin = pluginFactory(
      makeStubApp() as unknown as Parameters<typeof pluginFactory>[0]
    ) as SignalKPlugin
    assert.ok(plugin.sentences.BWC, 'BWC encoder should be registered')
    assert.equal(
      plugin.sentences.BWC.title,
      'BWC - Bearing and distance to waypoint'
    )
    assert.equal(plugin.sentences.BWC.sentence, 'BWC')
  })

  it('is discoverable via the sentence factory registry', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sentenceFactories } = require('../src/sentences/index')
    assert.ok(sentenceFactories.BWC, 'BWC should be in the factory registry')
    assert.equal(typeof sentenceFactories.BWC, 'function')
  })

  it('reproduces the exact sentence captured from live signalk-server', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(makeStubApp())

    const sentence = encoder.f(
      LIVE_SNAPSHOT.datetime,
      LIVE_SNAPSHOT.position,
      LIVE_SNAPSHOT.bearingTrue,
      LIVE_SNAPSHOT.bearingMagnetic,
      LIVE_SNAPSHOT.distance
    )

    assert.equal(sentence, LIVE_SNAPSHOT.expectedSentence)
  })

  it('produces a structurally valid NMEA0183 sentence on live data', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(makeStubApp())

    const sentence = encoder.f(
      LIVE_SNAPSHOT.datetime,
      LIVE_SNAPSHOT.position,
      LIVE_SNAPSHOT.bearingTrue,
      LIVE_SNAPSHOT.bearingMagnetic,
      LIVE_SNAPSHOT.distance
    )

    assert.ok(sentence)
    assert.match(sentence!, /^\$IIBWC,/)
    assert.match(sentence!, /\*[0-9A-F]{2}$/)

    const fields = sentence!.split('*')[0]!.split(',')
    assert.equal(fields.length, 13)
    assert.equal(fields[0], '$IIBWC')
    assert.match(fields[1]!, /^\d{6}\.\d{2}$/, 'UTC time HHMMSS.ss')
    assert.match(fields[2]!, /^\d{4}\.\d{4}$/, 'latitude DDMM.MMMM')
    assert.equal(fields[3], 'N')
    assert.match(fields[4]!, /^\d{5}\.\d{4}$/, 'longitude DDDMM.MMMM')
    assert.equal(fields[5], 'W')
    assert.match(fields[6]!, /^\d+\.\d$/, 'true bearing in degrees')
    assert.equal(fields[7], 'T')
    assert.match(fields[8]!, /^\d+\.\d$/, 'magnetic bearing in degrees')
    assert.equal(fields[9], 'M')
    assert.match(fields[10]!, /^\d+\.\d{2}$/, 'distance in NM')
    assert.equal(fields[11], 'N')
    assert.equal(fields[12], '')
  })

  it('omits magnetic bearing fields when server does not publish it', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(makeStubApp())

    const sentence = encoder.f(
      LIVE_SNAPSHOT.datetime,
      LIVE_SNAPSHOT.position,
      LIVE_SNAPSHOT.bearingTrue,
      null,
      LIVE_SNAPSHOT.distance
    )

    const fields = sentence!.split('*')[0]!.split(',')
    assert.equal(fields[8], '', 'field 8 (magnetic bearing) must be empty')
    assert.equal(fields[9], '', 'field 9 (M indicator) must be empty')
  })

  it('checksum is XOR of all characters between $ and *', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(makeStubApp())

    const sentence = encoder.f(
      LIVE_SNAPSHOT.datetime,
      LIVE_SNAPSHOT.position,
      LIVE_SNAPSHOT.bearingTrue,
      LIVE_SNAPSHOT.bearingMagnetic,
      LIVE_SNAPSHOT.distance
    )

    const [body, checksum] = sentence!.split('*')
    let computed = 0
    for (let i = 1; i < body!.length; i++) {
      computed ^= body!.charCodeAt(i)
    }
    const expected = ('0' + computed.toString(16).toUpperCase()).slice(-2)
    assert.equal(checksum, expected)
  })
})
