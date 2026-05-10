/**
 * Integration test for BWC encoder with the full plugin system.
 * Validates registration, factory wiring, and end-to-end sentence
 * generation against a snapshot captured from a live signalk-server.
 */
import * as assert from 'assert'
import pluginFactory from '../src/index'
import type { SignalKPlugin } from '../src/types/plugin'

// Live snapshot captured from signalk-server's deltastream (vessel sailing
// near Marsh Harbour, Bahamas, 9° W magnetic variation, 3-point route
// "TO DELETE" active, currently heading to point 1 of 3).
const LIVE_SNAPSHOT = {
  datetime: '2026-05-08T19:32:22.000Z',
  nextPoint: {
    type: 'RoutePoint',
    position: {
      latitude: 26.547617287650734,
      longitude: -77.05992185300417
    }
  },
  activeRoute: {
    href: '/resources/routes/d12f9af7-8556-440c-984a-a9795693fc8d',
    name: 'TO DELETE',
    reverse: false,
    pointIndex: 0,
    pointTotal: 3
  },
  bearingTrue: 5.890679316509219,
  bearingMagnetic: 5.729787364152641,
  distance: 127.040711001917,
  expectedSentence:
    '$IIBWC,193222.00,2632.8570,N,07703.5953,W,337.5,T,328.3,M,0.07,N,WP1*2E'
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
      LIVE_SNAPSHOT.nextPoint,
      LIVE_SNAPSHOT.activeRoute,
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
      LIVE_SNAPSHOT.nextPoint,
      LIVE_SNAPSHOT.activeRoute,
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
    assert.equal(
      fields[12],
      'WP1',
      'waypoint ID synthesized as "WP <pointIndex+1>"'
    )
  })

  it('omits magnetic bearing fields when server does not publish it', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(makeStubApp())

    const sentence = encoder.f(
      LIVE_SNAPSHOT.datetime,
      LIVE_SNAPSHOT.nextPoint,
      LIVE_SNAPSHOT.activeRoute,
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
      LIVE_SNAPSHOT.nextPoint,
      LIVE_SNAPSHOT.activeRoute,
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
