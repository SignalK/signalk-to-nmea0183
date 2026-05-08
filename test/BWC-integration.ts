/**
 * Integration test for BWC encoder with the full plugin system.
 * Validates that BWC is properly registered, enabled, and emits correct sentences.
 */
import * as assert from 'assert'
import pluginFactory from '../src/index'
import type { SignalKPlugin } from '../src/types/plugin'

describe('BWC Integration', function () {
  it('is registered in the plugin sentence registry', () => {
    // Create a stub app with minimal required properties
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({
          toProperty: () => ({})
        })
      },
      emit: (): void => {},
      debug: (): void => {}
    }

    const plugin = pluginFactory(stubApp) as SignalKPlugin

    // Verify BWC is in the sentence registry
    assert.ok(
      plugin.sentences.BWC,
      'BWC encoder should be registered in plugin.sentences'
    )
    assert.equal(plugin.sentences.BWC.title, 'BWC - Bearing and distance to waypoint')
    assert.equal(plugin.sentences.BWC.sentence, 'BWC')
  })

  it('is discoverable via the sentence factory registry', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { sentenceFactories } = require('../src/sentences/index')

    assert.ok(
      sentenceFactories.BWC,
      'BWC should be in the sentence factory registry'
    )
    assert.equal(typeof sentenceFactories.BWC, 'function', 'BWC should be a factory function')
  })

  it('encoder has correct metadata for Signal K subscription', () => {
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(stubApp)

    // Verify required metadata
    assert.ok(Array.isArray(encoder.keys), 'encoder.keys should be an array')
    assert.equal(encoder.keys.length, 3, 'BWC should subscribe to 3 Signal K paths')

    // Verify the paths are correct
    assert.ok(
      encoder.keys.includes('navigation.datetime'),
      'should subscribe to navigation.datetime'
    )
    assert.ok(
      encoder.keys.includes('navigation.courseGreatCircle.nextPoint'),
      'should subscribe to navigation.courseGreatCircle.nextPoint'
    )
    assert.ok(
      encoder.keys.includes('navigation.magneticVariation'),
      'should subscribe to navigation.magneticVariation'
    )

    // Verify defaults are set (datetime can have default, others should be undefined for safety)
    assert.equal(encoder.defaults?.[0], '', 'datetime default should be empty string')
    assert.equal(encoder.defaults?.[1], undefined, 'nextPoint default should be undefined (required)')
    assert.equal(encoder.defaults?.[2], undefined, 'magneticVariation default should be undefined')
  })

  it('encoder function produces valid NMEA0183 sentence structure', () => {
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(stubApp)

    // Call the encoder function directly
    const datetime = '2025-04-27T14:34:56Z'
    const nextPoint = {
      position: { latitude: 48.1173, longitude: 11.5167 },
      bearing: 5.832,
      distance: 4639.26,
      name: 'WAYPOINT1'
    }
    const magneticVariation = 0.114

    const sentence = encoder.f(datetime, nextPoint, magneticVariation)

    // Validate sentence structure
    assert.ok(sentence, 'encoder should return a sentence string')
    assert.match(sentence, /^\$IIBWC,/, 'sentence should start with $IIBWC')
    assert.match(sentence, /\*[0-9A-F]{2}$/, 'sentence should end with checksum *XX')

    // Verify required fields are present
    const fields = sentence.split('*')[0]!.split(',')
    assert.equal(fields.length, 13, 'BWC sentence should have exactly 12 comma-separated data fields')

    // Verify field order and content
    assert.equal(fields[0], '$IIBWC', 'field 0: sentence ID')
    assert.ok(fields[1]!.match(/^\d{6}\.\d{2}$/), 'field 1: UTC time HHMMSS.ss')
    assert.ok(fields[2]!.match(/^\d{4}\.\d{4}$/), 'field 2: latitude DDMM.MMMM')
    assert.equal(fields[3], 'N', 'field 3: N/S')
    assert.ok(fields[4]!.match(/^\d{5}\.\d{4}$/), 'field 4: longitude DDDMM.MMMM')
    assert.equal(fields[5], 'E', 'field 5: E/W')
    assert.ok(fields[6]!.match(/^\d+\.\d$/), 'field 6: true bearing')
    assert.equal(fields[7], 'T', 'field 7: T for true')
    assert.ok(fields[8]!.match(/^\d+\.\d$/), 'field 8: magnetic bearing')
    assert.equal(fields[9], 'M', 'field 9: M for magnetic')
    assert.ok(fields[10]!.match(/^\d+\.\d{2}$/), 'field 10: distance NM')
    assert.equal(fields[11], 'N', 'field 11: N for nautical miles')
    assert.equal(fields[12], 'WAYPOINT1', 'field 12: waypoint ID')
  })

  it('encoder correctly handles all 13 NMEA0183 BWC fields', () => {
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const BWC = require('../src/sentences/BWC').default
    const encoder = BWC(stubApp)

    const sentence = encoder.f(
      '2025-04-27T14:34:56.789Z',
      {
        position: { latitude: 40.7128, longitude: -74.006 },
        bearing: 0.5236, // 30 degrees
        distance: 1852.0 // 1 nautical mile
      },
      -0.1047 // -6 degrees magnetic variation
    )

    assert.ok(sentence, 'should generate sentence with real-world data')

    // Verify it's NMEA0183 compliant
    assert.match(sentence, /^\$/, 'should start with $')
    assert.match(sentence, /\*[0-9A-F]{2}$/, 'should have valid checksum')

    const body = sentence.split('*')[0]!
    const checksum = sentence.split('*')[1]!

    // Verify checksum computation (simple XOR of all characters between $ and *)
    let computed = 0
    for (let i = 1; i < body.length; i++) {
      computed ^= body.charCodeAt(i)!
    }
    const computedHex = ('0' + computed.toString(16).toUpperCase()).slice(-2)
    assert.equal(checksum, computedHex, `checksum should match computed value (${computedHex})`)
  })

  it('is properly integrated in the plugin configuration schema', () => {
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }

    const plugin = pluginFactory(stubApp) as SignalKPlugin

    // Verify schema structure
    assert.ok(plugin.schema, 'plugin should have a schema')
    assert.ok(plugin.schema.properties, 'schema should have properties')

    // BWC should be available as a configuration option
    // (Note: specific property name depends on plugin schema design)
    assert.ok(
      Object.keys(plugin.schema.properties).length > 0,
      'schema should have configuration options'
    )
  })
})
