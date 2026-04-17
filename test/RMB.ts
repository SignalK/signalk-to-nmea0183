import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

interface PointArg {
  name?: string
  position?: { latitude: number; longitude: number }
  type?: string
}

interface RmbOverrides {
  nextPoint?: PointArg
  previousPoint?: PointArg
  crossTrackError?: number
  distance?: number
  bearingTrue?: number
  vmg?: number
}

describe('RMB', function () {
  // Real navigation data: route near Zurich, Switzerland.
  //   crossTrackError = 185.2 m (right of track, steer left)
  //   nextPoint position = 48.1173 N, 11.5167 E
  //   distance = 4639.26 m
  //   bearingTrue = 5.832 rad (334 deg)
  //   vmg = 2.675 m/s (5.2 kn)
  const realXte = 185.2
  const realNextPoint: PointArg = {
    position: { latitude: 48.1173, longitude: 11.5167 }
  }
  const realDistance = 4639.26
  const realBearingTrue = 5.832
  const realVmg = 2.675

  function pushRmbStreams(app: AnyApp, overrides: RmbOverrides): void {
    // Push point objects before calcValues so they are already present when
    // the combined stream fires. The point keys have defaults of {}, so
    // pushing calcValues alone would emit immediately with those defaults.
    if ('nextPoint' in overrides) {
      app.streambundle
        .getSelfStream('navigation.course.nextPoint')
        .push(overrides.nextPoint)
    }
    if ('previousPoint' in overrides) {
      app.streambundle
        .getSelfStream('navigation.course.previousPoint')
        .push(overrides.previousPoint)
    }
    const calcValues: Record<string, unknown> = {
      'navigation.course.calcValues.crossTrackError':
        overrides.crossTrackError ?? realXte,
      'navigation.course.nextPoint': overrides.nextPoint ?? realNextPoint,
      'navigation.course.calcValues.distance':
        overrides.distance ?? realDistance,
      'navigation.course.calcValues.bearingTrue':
        overrides.bearingTrue ?? realBearingTrue,
      'navigation.course.calcValues.velocityMadeGood': overrides.vmg ?? realVmg
    }
    for (const [p, value] of Object.entries(calcValues)) {
      app.streambundle.getSelfStream(p).push(value)
    }
  }

  // The toNmeaDegrees* helpers embed a comma (e.g. "4807.0380,N"), so the
  // final sentence has more comma-separated fields than array elements.
  // Parse by splitting on comma and mapping to NMEA field numbers.
  function parseRmb(sentence: string): Record<string, string | undefined> {
    const body = sentence.split('*')[0]!
    const parts = body.split(',')
    return {
      talker: parts[0],
      status: parts[1],
      xteMagnitude: parts[2],
      steerDirection: parts[3],
      destinationId: parts[4],
      originId: parts[5],
      latitude: parts[6] + ',' + parts[7],
      longitude: parts[8] + ',' + parts[9],
      range: parts[10],
      bearing: parts[11],
      vmg: parts[12],
      arrivalStatus: parts[13],
      faaMode: parts[14]
    }
  }

  it('emits a valid RMB sentence with real navigation data', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseRmb(value as string)
      assert.equal(fields.talker, '$IIRMB')
      assert.equal(fields.status, 'A')
      assert.equal(fields.faaMode, 'A')
      assert.equal(fields.bearing, '334')
      assert.equal(fields.vmg, '5.20')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMB')
    pushRmbStreams(app, {})
  })

  it('uses waypoint names in fields 4 and 5 when available', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseRmb(value as string)
      assert.equal(
        fields.destinationId,
        'DEST',
        'field 4 should contain the destination waypoint name'
      )
      assert.equal(
        fields.originId,
        'START',
        'field 5 should contain the origin waypoint name'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMB')
    pushRmbStreams(app, {
      nextPoint: {
        position: { latitude: 48.1173, longitude: 11.5167 },
        type: 'Waypoint',
        name: 'DEST'
      },
      previousPoint: {
        position: { latitude: 47.3769, longitude: 8.5417 },
        type: 'Waypoint',
        name: 'START'
      }
    })
  })

  it('uses empty fields when waypoint objects have no name', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseRmb(value as string)
      assert.equal(
        fields.destinationId,
        '',
        'field 4 should be empty when no waypoint name is available'
      )
      assert.equal(
        fields.originId,
        '',
        'field 5 should be empty when no waypoint name is available'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMB')
    pushRmbStreams(app, {
      nextPoint: {
        position: { latitude: 48.1173, longitude: 11.5167 },
        type: 'RoutePoint'
      },
      previousPoint: {
        position: { latitude: 47.3769, longitude: 8.5417 },
        type: 'RoutePoint'
      }
    })
  })

  it('computes correct XTE and steer direction', (done) => {
    // XTE = 185.2 m positive means vessel is right of track, steer Left.
    // Magnitude in NM: 185.2 * 0.000539957 = 0.100 NM
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseRmb(value as string)
      assert.equal(fields.steerDirection, 'L', 'positive XTE = steer left')
      assert.equal(fields.xteMagnitude, '0.100')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMB')
    pushRmbStreams(app, {})
  })

  it('computes range in nautical miles', (done) => {
    // distance = 4639.26 m, mToNm = v * 0.000539957
    // 4639.26 * 0.000539957 = 2.505 -> toFixed(2) = "2.51"
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseRmb(value as string)
      assert.equal(fields.range, '2.51')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMB')
    pushRmbStreams(app, {})
  })

  it('does not emit when nextPoint has no position', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'RMB')
    // Push nextPoint without position (default is {}, which also has no position)
    pushRmbStreams(app, {
      nextPoint: { name: 'DEST' }
    })
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })

  it('subscribes to previousPoint for origin waypoint metadata', () => {
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const rmb = require('../src/sentences/RMB').default(stubApp)
    assert.ok(
      rmb.keys.includes('navigation.course.previousPoint'),
      'RMB keys should include navigation.course.previousPoint, got: ' +
        JSON.stringify(rmb.keys)
    )
    assert.ok(
      rmb.keys.includes('navigation.course.nextPoint'),
      'RMB keys should include navigation.course.nextPoint, got: ' +
        JSON.stringify(rmb.keys)
    )
  })
})
