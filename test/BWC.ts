import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

/**
 * Real navigation snapshots captured from the live deltastream of a running
 * signalk-server (openplotter sailing near Marsh Harbour, Bahamas, 9° west
 * magnetic variation, route active with a Location-type destination).
 *
 * Kept verbatim so the test fixture documents the exact wire shape the
 * encoder must accept; do not "tidy" the long decimals.
 */
const LIVE_SNAPSHOT_1 = {
  datetime: '2026-05-08T16:38:51.000Z',
  position: { latitude: 26.547522602871112, longitude: -77.0623540878296 },
  bearingTrue: 5.003988233815001, // 286.71° true
  bearingMagnetic: 4.843169020404653, // 277.49° magnetic
  distance: 331.7225852823217, // 0.179 NM
  expectedSentence:
    '$IIBWC,163851.00,2632.8514,N,07703.7412,W,286.7,T,277.5,M,0.18,N,*1B'
} as const

const LIVE_SNAPSHOT_2 = {
  datetime: '2026-05-08T16:40:00.000Z',
  position: { latitude: 26.547522602871112, longitude: -77.0623540878296 },
  bearingTrue: 5.0093362657001945, // 287.01° true
  bearingMagnetic: 4.848517052289846, // 277.80° magnetic
  distance: 330.35359211264006, // 0.178 NM
  expectedSentence:
    '$IIBWC,164000.00,2632.8514,N,07703.7412,W,287.0,T,277.8,M,0.18,N,*1B'
} as const

interface BwcOverrides {
  datetime?: string
  position?: { latitude: number; longitude: number } | null
  bearingTrue?: number | undefined
  bearingMagnetic?: number | undefined | null
  distance?: number | undefined
}

function pushBwcStreams(app: AnyApp, overrides: BwcOverrides): void {
  app.streambundle
    .getSelfStream('navigation.datetime')
    .push(overrides.datetime ?? LIVE_SNAPSHOT_1.datetime)
  app.streambundle
    .getSelfStream('navigation.courseGreatCircle.nextPoint.position')
    .push(
      'position' in overrides ? overrides.position : LIVE_SNAPSHOT_1.position
    )
  app.streambundle
    .getSelfStream('navigation.course.calcValues.bearingTrue')
    .push(
      'bearingTrue' in overrides
        ? overrides.bearingTrue
        : LIVE_SNAPSHOT_1.bearingTrue
    )
  if ('bearingMagnetic' in overrides) {
    app.streambundle
      .getSelfStream('navigation.course.calcValues.bearingMagnetic')
      .push(overrides.bearingMagnetic)
  } else {
    app.streambundle
      .getSelfStream('navigation.course.calcValues.bearingMagnetic')
      .push(LIVE_SNAPSHOT_1.bearingMagnetic)
  }
  app.streambundle
    .getSelfStream('navigation.course.calcValues.distance')
    .push(
      'distance' in overrides ? overrides.distance : LIVE_SNAPSHOT_1.distance
    )
}

// Splits BWC into its 13 comma-separated parts. toNmeaDegrees* embeds a
// comma inside the lat/lon formatting (e.g. "4807.0380,N"), so the parsed
// field count exceeds the encoder's input array length by 2.
function parseBwc(sentence: string): {
  fields: Record<string, string | undefined>
  body: string
  checksum: string
  fieldCount: number
} {
  const [body, checksum] = sentence.split('*')
  const parts = body!.split(',')
  return {
    fields: {
      talker: parts[0],
      time: parts[1],
      latitude: parts[2] + ',' + parts[3],
      longitude: parts[4] + ',' + parts[5],
      bearingTrue: parts[6],
      bearingTrueIndicator: parts[7],
      bearingMagnetic: parts[8],
      bearingMagneticIndicator: parts[9],
      distance: parts[10],
      distanceUnit: parts[11],
      waypointId: parts[12]
    },
    body: body!,
    checksum: checksum!,
    fieldCount: parts.length
  }
}

function xorChecksum(body: string): string {
  let computed = 0
  for (let i = 1; i < body.length; i++) {
    computed ^= body.charCodeAt(i)
  }
  return ('0' + computed.toString(16).toUpperCase()).slice(-2)
}

describe('BWC', function () {
  describe('real-world snapshots from openplotter', function () {
    it('reproduces the exact sentence from live snapshot 1', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(value, LIVE_SNAPSHOT_1.expectedSentence)
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('reproduces the exact sentence from live snapshot 2 (vessel moved)', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(value, LIVE_SNAPSHOT_2.expectedSentence)
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {
        datetime: LIVE_SNAPSHOT_2.datetime,
        position: LIVE_SNAPSHOT_2.position,
        bearingTrue: LIVE_SNAPSHOT_2.bearingTrue,
        bearingMagnetic: LIVE_SNAPSHOT_2.bearingMagnetic,
        distance: LIVE_SNAPSHOT_2.distance
      })
    })

    it('emits a structurally complete sentence: 13 fields and valid checksum', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        const { body, checksum, fieldCount } = parseBwc(value as string)
        assert.equal(fieldCount, 13, 'BWC has 13 comma-separated fields')
        assert.equal(checksum, xorChecksum(body), 'XOR checksum is correct')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })
  })

  describe('field formatting from live data', function () {
    it('formats UTC time as HHMMSS.ss', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.time, '163851.00')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('formats latitude as DDMM.MMMM with N/S indicator', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        // 26.547522602871112° → 26°32.8514' N
        assert.equal(parseBwc(value as string).fields.latitude, '2632.8514,N')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('formats longitude as DDDMM.MMMM with E/W indicator', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        // -77.0623540878296° → 077°03.7412' W
        assert.equal(parseBwc(value as string).fields.longitude, '07703.7412,W')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('formats bearing as degrees with one decimal', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        const { fields } = parseBwc(value as string)
        // 5.003988233815001 rad = 286.7074° → "286.7"
        assert.equal(fields.bearingTrue, '286.7')
        assert.equal(fields.bearingTrueIndicator, 'T')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('uses server-provided bearingMagnetic verbatim, not derived from variation', (done) => {
      // openplotter publishes bearingMagnetic at 277.49°. variation is
      // -9.21° (W). Naive `mag = true - var` would produce 295.92°,
      // which is wrong. The encoder must consume bearingMagnetic directly.
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.bearingMagnetic, '277.5')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('converts distance from meters to nautical miles with two decimals', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        // 331.7225852823217 m × 0.000539957 = 0.1791 NM → "0.18"
        assert.equal(parseBwc(value as string).fields.distance, '0.18')
        assert.equal(parseBwc(value as string).fields.distanceUnit, 'N')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('emits an empty waypoint ID (no live delta source for the name today)', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.waypointId, '')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })
  })

  describe('bearingMagnetic handling (optional field)', function () {
    it('emits empty fields 8 and 9 when bearingMagnetic is null (server seeded default)', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        const { fields } = parseBwc(value as string)
        assert.equal(
          fields.bearingMagnetic,
          '',
          'field 8 must be empty when magnetic is unknown'
        )
        assert.equal(
          fields.bearingMagneticIndicator,
          '',
          'field 9 must be empty when field 8 is empty'
        )
        // True bearing must still be present
        assert.equal(fields.bearingTrue, '286.7')
        assert.equal(fields.bearingTrueIndicator, 'T')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, { bearingMagnetic: null })
    })

    it('emits empty fields 8 and 9 when bearingMagnetic is undefined', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        const { fields } = parseBwc(value as string)
        assert.equal(fields.bearingMagnetic, '')
        assert.equal(fields.bearingMagneticIndicator, '')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, { bearingMagnetic: undefined })
    })

    it('emits a valid checksum when magnetic fields are blank', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        const { body, checksum } = parseBwc(value as string)
        assert.equal(checksum, xorChecksum(body))
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, { bearingMagnetic: null })
    })
  })

  describe('boundary and equivalence classes', function () {
    function expectEmits(
      desc: string,
      overrides: BwcOverrides,
      check: (s: string) => void
    ): void {
      it(desc, (done) => {
        const onEmit = (_event: string, value: unknown): void => {
          check(value as string)
          done()
        }
        const app = createAppWithPlugin(onEmit, 'BWC')
        pushBwcStreams(app, overrides)
      })
    }

    function expectNoEmit(desc: string, overrides: BwcOverrides): void {
      it(desc, (done) => {
        let emitted = false
        const onEmit = (): void => {
          emitted = true
        }
        const app = createAppWithPlugin(onEmit, 'BWC')
        pushBwcStreams(app, overrides)
        setTimeout(() => {
          assert.equal(emitted, false)
          done()
        }, 50)
      })
    }

    // -- bearing equivalence classes --
    expectEmits('bearing 0 rad emits "0.0"', { bearingTrue: 0 }, (s) =>
      assert.equal(parseBwc(s).fields.bearingTrue, '0.0')
    )
    expectEmits(
      'bearing 2π emits in [0, 360), wrapping to 0.0',
      { bearingTrue: 2 * Math.PI },
      (s) => assert.equal(parseBwc(s).fields.bearingTrue, '0.0')
    )
    expectEmits(
      'bearing -π/2 maps to positive 270.0',
      { bearingTrue: -Math.PI / 2 },
      (s) => assert.equal(parseBwc(s).fields.bearingTrue, '270.0')
    )

    // -- distance equivalence classes --
    expectEmits('distance 0 m emits "0.00"', { distance: 0 }, (s) =>
      assert.equal(parseBwc(s).fields.distance, '0.00')
    )
    expectEmits(
      'distance 1852 m (1 NM exactly) emits "1.00"',
      { distance: 1852 },
      (s) => assert.equal(parseBwc(s).fields.distance, '1.00')
    )
    expectEmits(
      'large distance 100000 m emits "54.00" (53.9957 NM rounded)',
      { distance: 100000 },
      (s) => assert.equal(parseBwc(s).fields.distance, '54.00')
    )

    // -- latitude equivalence classes --
    expectEmits(
      'latitude exactly +90 (north pole, boundary inclusive)',
      { position: { latitude: 90, longitude: 0 } },
      (s) => assert.equal(parseBwc(s).fields.latitude, '9000.0000,N')
    )
    expectEmits(
      'latitude exactly -90 (south pole, boundary inclusive)',
      { position: { latitude: -90, longitude: 0 } },
      (s) => assert.equal(parseBwc(s).fields.latitude, '9000.0000,S')
    )
    expectEmits(
      'latitude 0 (equator)',
      { position: { latitude: 0, longitude: 0 } },
      (s) => assert.equal(parseBwc(s).fields.latitude, '0000.0000,N')
    )

    // -- longitude equivalence classes --
    expectEmits(
      'longitude exactly +180 (antimeridian, accepted by codebase convention)',
      { position: { latitude: 0, longitude: 180 } },
      (s) => assert.equal(parseBwc(s).fields.longitude, '18000.0000,E')
    )
    expectEmits(
      'longitude -179.9999 (just inside western antimeridian)',
      { position: { latitude: 0, longitude: -179.9999 } },
      (s) => assert.match(parseBwc(s).fields.longitude!, /^17959\.\d{4},W$/)
    )
    expectNoEmit(
      'rejects longitude exactly -180 (codebase treats antimeridian as +180 only)',
      { position: { latitude: 0, longitude: -180 } }
    )

    // -- rejection paths --
    expectNoEmit('rejects latitude > 90', {
      position: { latitude: 91, longitude: 0 }
    })
    expectNoEmit('rejects latitude < -90', {
      position: { latitude: -91, longitude: 0 }
    })
    expectNoEmit('rejects longitude > 180', {
      position: { latitude: 0, longitude: 181 }
    })
    expectNoEmit('rejects longitude < -180', {
      position: { latitude: 0, longitude: -181 }
    })
    expectNoEmit('rejects NaN bearingTrue', { bearingTrue: NaN })
    expectNoEmit('rejects Infinity bearingTrue', { bearingTrue: Infinity })
    expectNoEmit('rejects NaN distance', { distance: NaN })
    expectNoEmit('rejects Infinity distance', { distance: Infinity })
    expectNoEmit('rejects negative distance', { distance: -10 })
    expectNoEmit('rejects undefined bearingTrue', { bearingTrue: undefined })
    expectNoEmit('rejects undefined distance', { distance: undefined })
    expectNoEmit('rejects null position', { position: null })
    expectNoEmit('rejects empty datetime', { datetime: '' })
    expectNoEmit('rejects unparseable datetime', { datetime: 'not-a-date' })
  })

  describe('datetime handling', function () {
    it('converts ISO datetime with timezone offset to UTC', (done) => {
      // 18:38:51 +02:00 -> 16:38:51 UTC, matches LIVE_SNAPSHOT_1
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.time, '163851.00')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, { datetime: '2026-05-08T18:38:51+02:00' })
    })

    it('preserves fractional seconds as centiseconds', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.time, '163851.78')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, { datetime: '2026-05-08T16:38:51.789Z' })
    })
  })

  describe('Signal K subscription metadata', function () {
    it('subscribes to the five required Signal K paths in order', () => {
      const stubApp = {
        streambundle: {
          getSelfStream: (): unknown => ({ toProperty: () => ({}) })
        },
        emit: (): void => {},
        debug: (): void => {}
      }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bwc = require('../src/sentences/BWC').default(stubApp)
      assert.deepStrictEqual(bwc.keys, [
        'navigation.datetime',
        'navigation.courseGreatCircle.nextPoint.position',
        'navigation.course.calcValues.bearingTrue',
        'navigation.course.calcValues.bearingMagnetic',
        'navigation.course.calcValues.distance'
      ])
    })

    it('seeds bearingMagnetic with null so the combined stream fires without it', () => {
      const stubApp = {
        streambundle: {
          getSelfStream: (): unknown => ({ toProperty: () => ({}) })
        },
        emit: (): void => {},
        debug: (): void => {}
      }
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const bwc = require('../src/sentences/BWC').default(stubApp)
      assert.deepStrictEqual(bwc.defaults, [
        '',
        undefined,
        undefined,
        null,
        undefined
      ])
    })
  })
})
