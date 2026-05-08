import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

interface NextPointArg {
  name?: string
  position?: { latitude: number; longitude: number }
  bearing?: number
  distance?: number
}

interface BwcOverrides {
  datetime?: string
  nextPoint?: NextPointArg
  bearing?: number
  distance?: number
  magneticVariation?: number
}

describe('BWC', function () {
  // Real navigation data: waypoint near Zurich, Switzerland.
  //   datetime = 2025-04-27T14:34:56Z
  //   nextPoint position = 48.1173 N, 11.5167 E
  //   bearing = 5.832 rad (334 deg)
  //   distance = 4639.26 m
  //   magneticVariation = 0.114 rad (6.5 deg)
  const realDatetime = '2025-04-27T14:34:56Z'
  const realNextPoint: NextPointArg = {
    position: { latitude: 48.1173, longitude: 11.5167 },
    bearing: 5.832,
    distance: 4639.26
  }
  const realMagneticVariation = 0.114

  function pushBwcStreams(app: AnyApp, overrides: BwcOverrides): void {
    // Push datetime
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push(overrides.datetime ?? realDatetime)

    // Push nextPoint
    app.streambundle
      .getSelfStream('navigation.courseGreatCircle.nextPoint')
      .push(overrides.nextPoint ?? realNextPoint)

    // Push magneticVariation
    if (overrides.magneticVariation !== undefined) {
      app.streambundle
        .getSelfStream('navigation.magneticVariation')
        .push(overrides.magneticVariation)
    } else {
      app.streambundle
        .getSelfStream('navigation.magneticVariation')
        .push(realMagneticVariation)
    }
  }

  function parseBwc(sentence: string): Record<string, string | undefined> {
    const body = sentence.split('*')[0]!
    const parts = body.split(',')
    return {
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
    }
  }

  it('emits a valid BWC sentence with real navigation data', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseBwc(value as string)
      assert.equal(fields.talker, '$IIBWC')
      assert.equal(fields.time, '143456.00')
      assert.equal(fields.bearingTrueIndicator, 'T')
      assert.equal(fields.bearingMagneticIndicator, 'M')
      assert.equal(fields.distanceUnit, 'N')
      assert.equal(fields.bearingTrue, '334.1')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {})
  })

  it('uses waypoint name in field 12 when available', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseBwc(value as string)
      assert.equal(
        fields.waypointId,
        'ZURICH',
        'field 12 should contain the waypoint name'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: {
        position: { latitude: 48.1173, longitude: 11.5167 },
        bearing: 5.832,
        distance: 4639.26,
        name: 'ZURICH'
      }
    })
  })

  it('uses empty field for waypoint ID when not available', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseBwc(value as string)
      assert.equal(
        fields.waypointId,
        '',
        'field 12 should be empty when no waypoint name is available'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {})
  })

  it('calculates magnetic bearing from true bearing and magnetic variation', (done) => {
    // True bearing = 334.1 deg, Magnetic variation = 6.5 deg (east)
    // Magnetic bearing = 334.1 - 6.5 = 327.6 deg
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseBwc(value as string)
      assert.equal(fields.bearingTrue, '334.1')
      assert.equal(fields.bearingMagnetic, '327.6')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {})
  })

  it('handles negative magnetic variation (west)', (done) => {
    // True bearing = 334.1 deg, Magnetic variation = -10 deg (west)
    // Magnetic bearing = 334.1 - (-10) = 344.1 deg
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseBwc(value as string)
      assert.equal(fields.bearingMagnetic, '344.1')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      magneticVariation: -0.1745 // -10 degrees in radians
    })
  })

  it('wraps magnetic bearing to 0-360 range', (done) => {
    // True bearing = 10 deg, Magnetic variation = 20 deg (east)
    // Magnetic bearing = 10 - 20 = -10 -> +360 = 350 deg
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseBwc(value as string)
      const bearing = parseFloat(fields.bearingMagnetic || '0')
      assert.ok(bearing >= 0 && bearing < 360, 'bearing should be 0-360')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: {
        position: { latitude: 48.1173, longitude: 11.5167 },
        bearing: 0.1745, // 10 degrees in radians
        distance: 4639.26
      },
      magneticVariation: 0.3491 // 20 degrees in radians
    })
  })

  it('converts distance to nautical miles', (done) => {
    // distance = 4639.26 m, mToNm = v * 0.000539957
    // 4639.26 * 0.000539957 = 2.505 -> toFixed(2) = "2.51"
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseBwc(value as string)
      assert.equal(fields.distance, '2.51')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {})
  })

  it('does not emit when nextPoint has no position', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: {
        name: 'DEST',
        bearing: 5.832,
        distance: 4639.26
      }
    })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit when nextPoint has no bearing', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: {
        position: { latitude: 48.1173, longitude: 11.5167 },
        distance: 4639.26
      }
    })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('does not emit when nextPoint has no distance', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {
      nextPoint: {
        position: { latitude: 48.1173, longitude: 11.5167 },
        bearing: 5.832
      }
    })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('formats latitude and longitude correctly', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseBwc(value as string)
      // Latitude should be in format DDMM.MMMM,N/S
      // 48.1173 = 48 degrees, 7.038 minutes = 4807.0380,N
      assert.match(fields.latitude || '', /^\d{4}\.\d{4},N$/)
      // Longitude should be in format DDDMM.MMMM,E/W
      // 11.5167 = 011 degrees, 31.002 minutes = 01131.0020,E
      assert.match(fields.longitude || '', /^\d{5}\.\d{4},E$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'BWC')
    pushBwcStreams(app, {})
  })

  it('subscribes to courseGreatCircle.nextPoint for waypoint data', () => {
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const bwc = require('../src/sentences/BWC').default(stubApp)
    assert.ok(
      bwc.keys.includes('navigation.courseGreatCircle.nextPoint'),
      'BWC keys should include navigation.courseGreatCircle.nextPoint'
    )
    assert.ok(
      bwc.keys.includes('navigation.datetime'),
      'BWC keys should include navigation.datetime'
    )
    assert.ok(
      bwc.keys.includes('navigation.magneticVariation'),
      'BWC keys should include navigation.magneticVariation'
    )
  })
})
