/**
 * Integration test for BWC encoder with the full plugin system.
 * Validates registration, factory wiring, and end-to-end sentence
 * structure when called with realistic Signal K values from a live
 * server snapshot.
 */
import * as assert from 'assert'
import pluginFactory from '../src/index'
import type { SignalKPlugin } from '../src/types/plugin'

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
    const plugin = pluginFactory(makeStubApp()) as SignalKPlugin
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

  it('encoder produces structurally valid NMEA0183 sentence with live data', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(makeStubApp())

    // Live values sampled from openplotter signalk-server while a route
    // was active near Marsh Harbour, Bahamas.
    const datetime = '2026-05-08T16:09:11Z'
    const nextPoint = {
      position: {
        latitude: 26.548128458856745,
        longitude: -77.05918908119203
      }
    }
    const bearingTrue = 4.823539078855837
    const bearingMagnetic = 4.662719865445489
    const distance = 361.05917210538576

    const sentence = encoder.f(
      datetime,
      nextPoint,
      bearingTrue,
      bearingMagnetic,
      distance
    )

    assert.ok(sentence, 'encoder should return a sentence')
    assert.match(sentence, /^\$IIBWC,/)
    assert.match(sentence, /\*[0-9A-F]{2}$/)

    const fields = sentence.split('*')[0]!.split(',')
    assert.equal(fields.length, 13, 'must have 13 comma-separated parts')
    assert.equal(fields[0], '$IIBWC')
    assert.match(fields[1]!, /^\d{6}\.\d{2}$/, 'UTC time HHMMSS.ss')
    assert.match(fields[2]!, /^\d{4}\.\d{4}$/, 'latitude DDMM.MMMM')
    assert.equal(fields[3], 'N')
    assert.match(fields[4]!, /^\d{5}\.\d{4}$/, 'longitude DDDMM.MMMM')
    assert.equal(fields[5], 'W')
    assert.match(fields[6]!, /^\d+\.\d$/, 'true bearing')
    assert.equal(fields[7], 'T')
    assert.match(fields[8]!, /^\d+\.\d$/, 'magnetic bearing')
    assert.equal(fields[9], 'M')
    assert.match(fields[10]!, /^\d+\.\d{2}$/, 'distance NM')
    assert.equal(fields[11], 'N')
    assert.equal(fields[12], '')
  })

  it('omits magnetic bearing fields when server does not publish it', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(makeStubApp())

    const sentence = encoder.f(
      '2026-05-08T16:09:11Z',
      { position: { latitude: 26.548128, longitude: -77.05918 } },
      4.823539078855837,
      undefined, // bearingMagnetic missing
      361.05917
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
      '2025-04-27T14:34:56Z',
      { position: { latitude: 40.7128, longitude: -74.006 } },
      0.5236,
      0.4189,
      1852.0
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
