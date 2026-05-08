import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

/**
 * Real navigation snapshots captured from the live deltastream of a running
 * signalk-server (openplotter sailing near Marsh Harbour, Bahamas, 9° west
 * magnetic variation, 3-point route active "TO DELETE").
 *
 * Kept verbatim so the test fixture documents the exact wire shape the
 * encoder must accept; do not "tidy" the long decimals.
 */
const LIVE_SNAPSHOT_1 = {
  datetime: '2026-05-08T19:32:22.000Z',
  // navigation.course.nextPoint is published as a composite delta:
  nextPoint: {
    type: 'RoutePoint',
    position: {
      latitude: 26.547617287650734,
      longitude: -77.05992185300417
    }
  },
  // navigation.course.activeRoute is published as a composite delta:
  activeRoute: {
    href: '/resources/routes/d12f9af7-8556-440c-984a-a9795693fc8d',
    name: 'TO DELETE',
    reverse: false,
    pointIndex: 0,
    pointTotal: 3
  },
  bearingTrue: 5.890679316509219, // 337.5° true
  bearingMagnetic: 5.729787364152641, // 328.3° magnetic
  distance: 127.040711001917, // 0.07 NM
  expectedSentence:
    '$IIBWC,193222.00,2632.8570,N,07703.5953,W,337.5,T,328.3,M,0.07,N,TO DELETE/1*24'
} as const

interface NextPointArg {
  type?: string
  position?: { latitude: number; longitude: number }
  name?: string
}

interface ActiveRouteArg {
  href?: string | null
  name?: string | null
  pointIndex?: number | null
  pointTotal?: number | null
}

interface BwcOverrides {
  datetime?: string
  nextPoint?: NextPointArg | null
  activeRoute?: ActiveRouteArg
  bearingTrue?: number | undefined
  bearingMagnetic?: number | undefined | null
  distance?: number | undefined
}

function pushBwcStreams(app: AnyApp, overrides: BwcOverrides): void {
  app.streambundle
    .getSelfStream('navigation.datetime')
    .push(overrides.datetime ?? LIVE_SNAPSHOT_1.datetime)
  app.streambundle
    .getSelfStream('navigation.course.nextPoint')
    .push(
      'nextPoint' in overrides ? overrides.nextPoint : LIVE_SNAPSHOT_1.nextPoint
    )
  if ('activeRoute' in overrides) {
    app.streambundle
      .getSelfStream('navigation.course.activeRoute')
      .push(overrides.activeRoute)
  } else {
    app.streambundle
      .getSelfStream('navigation.course.activeRoute')
      .push(LIVE_SNAPSHOT_1.activeRoute)
  }
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
  describe('real-world snapshot from openplotter', function () {
    it('reproduces the exact sentence captured from a live 3-point route', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(value, LIVE_SNAPSHOT_1.expectedSentence)
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
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
        assert.equal(parseBwc(value as string).fields.time, '193222.00')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('formats latitude as DDMM.MMMM with N/S indicator', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.latitude, '2632.8570,N')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('formats longitude as DDDMM.MMMM with E/W indicator', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.longitude, '07703.5953,W')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('formats bearing as degrees with one decimal', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        const { fields } = parseBwc(value as string)
        assert.equal(fields.bearingTrue, '337.5')
        assert.equal(fields.bearingTrueIndicator, 'T')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('uses server-provided bearingMagnetic verbatim, not derived from variation', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.bearingMagnetic, '328.3')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('converts distance from meters to nautical miles with two decimals', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        // 127.04 m × 0.000539957 = 0.0686 NM → "0.07"
        assert.equal(parseBwc(value as string).fields.distance, '0.07')
        assert.equal(parseBwc(value as string).fields.distanceUnit, 'N')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })
  })

  describe('waypoint ID derivation (field 12)', function () {
    it('uses route name + /pointIndex+1 for multi-point routes', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        // pointIndex=0 of pointTotal=3 → "TO DELETE/1"
        assert.equal(parseBwc(value as string).fields.waypointId, 'TO DELETE/1')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {})
    })

    it('uses route name alone for single-point routes', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.waypointId, 'SOLO')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {
        activeRoute: { name: 'SOLO', pointIndex: 0, pointTotal: 1 }
      })
    })

    it('prefers nextPoint.name when present (forward-compat with SignalK#2595)', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.waypointId, 'WP-A')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {
        nextPoint: {
          type: 'RoutePoint',
          position: LIVE_SNAPSHOT_1.nextPoint.position,
          name: 'WP-A'
        }
      })
    })

    it('emits empty waypoint ID for a Location-type destination with no route', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.waypointId, '')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {
        nextPoint: {
          type: 'Location',
          position: LIVE_SNAPSHOT_1.nextPoint.position
        },
        activeRoute: { href: null, name: null }
      })
    })

    it('emits empty waypoint ID when activeRoute stream is the {} default', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.waypointId, '')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {
        nextPoint: {
          type: 'Location',
          position: LIVE_SNAPSHOT_1.nextPoint.position
        },
        activeRoute: {}
      })
    })

    it('truncates a name longer than 20 characters', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        const id = parseBwc(value as string).fields.waypointId!
        assert.equal(id.length, 20)
        assert.equal(id, 'A'.repeat(20))
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {
        nextPoint: {
          type: 'RoutePoint',
          position: LIVE_SNAPSHOT_1.nextPoint.position,
          name: 'A'.repeat(25)
        }
      })
    })

    it('strips NMEA-reserved characters from the name', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        const { fields, body, fieldCount, checksum } = parseBwc(value as string)
        assert.equal(fields.waypointId, 'BADWPNAME')
        assert.equal(fieldCount, 13, 'no extra fields injected')
        assert.equal(checksum, xorChecksum(body), 'checksum still valid')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, {
        nextPoint: {
          type: 'RoutePoint',
          position: LIVE_SNAPSHOT_1.nextPoint.position,
          name: 'BAD,WP*$NA\rM\nE'
        }
      })
    })
  })

  describe('bearingMagnetic handling (optional field)', function () {
    it('emits empty fields 8 and 9 when bearingMagnetic is null (server seeded default)', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        const { fields } = parseBwc(value as string)
        assert.equal(fields.bearingMagnetic, '')
        assert.equal(fields.bearingMagneticIndicator, '')
        // True bearing must still be present
        assert.equal(fields.bearingTrue, '337.5')
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
      {
        nextPoint: {
          type: 'Location',
          position: { latitude: 90, longitude: 0 }
        }
      },
      (s) => assert.equal(parseBwc(s).fields.latitude, '9000.0000,N')
    )
    expectEmits(
      'latitude exactly -90 (south pole, boundary inclusive)',
      {
        nextPoint: {
          type: 'Location',
          position: { latitude: -90, longitude: 0 }
        }
      },
      (s) => assert.equal(parseBwc(s).fields.latitude, '9000.0000,S')
    )

    // -- longitude equivalence classes --
    expectEmits(
      'longitude exactly +180 (antimeridian, accepted by codebase convention)',
      {
        nextPoint: {
          type: 'Location',
          position: { latitude: 0, longitude: 180 }
        }
      },
      (s) => assert.equal(parseBwc(s).fields.longitude, '18000.0000,E')
    )
    expectEmits(
      'longitude -179.9999 (just inside western antimeridian)',
      {
        nextPoint: {
          type: 'Location',
          position: { latitude: 0, longitude: -179.9999 }
        }
      },
      (s) => assert.match(parseBwc(s).fields.longitude!, /^17959\.\d{4},W$/)
    )
    expectNoEmit(
      'rejects longitude exactly -180 (codebase treats antimeridian as +180 only)',
      {
        nextPoint: {
          type: 'Location',
          position: { latitude: 0, longitude: -180 }
        }
      }
    )

    // -- rejection paths --
    expectNoEmit('rejects latitude > 90', {
      nextPoint: {
        type: 'Location',
        position: { latitude: 91, longitude: 0 }
      }
    })
    expectNoEmit('rejects latitude < -90', {
      nextPoint: {
        type: 'Location',
        position: { latitude: -91, longitude: 0 }
      }
    })
    expectNoEmit('rejects longitude > 180', {
      nextPoint: {
        type: 'Location',
        position: { latitude: 0, longitude: 181 }
      }
    })
    expectNoEmit('rejects NaN bearingTrue', { bearingTrue: NaN })
    expectNoEmit('rejects Infinity bearingTrue', { bearingTrue: Infinity })
    expectNoEmit('rejects NaN distance', { distance: NaN })
    expectNoEmit('rejects Infinity distance', { distance: Infinity })
    expectNoEmit('rejects negative distance', { distance: -10 })
    expectNoEmit('rejects undefined bearingTrue', { bearingTrue: undefined })
    expectNoEmit('rejects undefined distance', { distance: undefined })
    expectNoEmit('rejects null nextPoint', { nextPoint: null })
    expectNoEmit('rejects nextPoint with no position', {
      nextPoint: { type: 'Location' }
    })
    expectNoEmit('rejects empty datetime', { datetime: '' })
    expectNoEmit('rejects unparseable datetime', { datetime: 'not-a-date' })
  })

  describe('datetime handling', function () {
    it('converts ISO datetime with timezone offset to UTC', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        // 21:32:22 +02:00 -> 19:32:22 UTC, matches LIVE_SNAPSHOT_1
        assert.equal(parseBwc(value as string).fields.time, '193222.00')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, { datetime: '2026-05-08T21:32:22+02:00' })
    })

    it('preserves fractional seconds as centiseconds', (done) => {
      const onEmit = (_event: string, value: unknown): void => {
        assert.equal(parseBwc(value as string).fields.time, '193222.78')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'BWC')
      pushBwcStreams(app, { datetime: '2026-05-08T19:32:22.789Z' })
    })
  })

  describe('Signal K subscription metadata', function () {
    it('subscribes to the six required Signal K paths in order', () => {
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
        'navigation.course.nextPoint',
        'navigation.course.activeRoute',
        'navigation.course.calcValues.bearingTrue',
        'navigation.course.calcValues.bearingMagnetic',
        'navigation.course.calcValues.distance'
      ])
    })

    it('seeds activeRoute with {} and bearingMagnetic with null so the combined stream fires', () => {
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
        {},
        undefined,
        null,
        undefined
      ])
    })
  })
})
