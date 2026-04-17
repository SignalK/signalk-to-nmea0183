import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

type AnyApp = ReturnType<typeof createAppWithPlugin>

interface NextPointArg {
  name?: string
  position?: { latitude: number; longitude: number }
  type?: string
}

interface Overrides {
  nextPoint?: NextPointArg
  crossTrackError?: number
  bearingTrackTrue?: number
  bearingTrue?: number
}

describe('APB-true', function () {
  // Real navigation data: route near Nassau, Bahamas.
  //   crossTrackError = -39.84 m (left of track)
  //   bearingTrackTrue = 2.1503 rad (123 deg)
  //   bearingTrue = 2.1962 rad (126 deg)
  const realXte = -39.84
  const realBearingTrackTrue = 2.1503
  const realBearingTrue = 2.1962

  function pushApbStreams(app: AnyApp, overrides: Overrides): void {
    // Push nextPoint before calcValues so it is already present when the
    // combined stream fires. The nextPoint key has a default of {}, so
    // pushing calcValues alone would emit immediately with that default
    // and debounce the subsequent nextPoint update.
    if ('nextPoint' in overrides) {
      app.streambundle
        .getSelfStream('navigation.course.nextPoint')
        .push(overrides.nextPoint)
    }
    const calcValues: Record<string, number> = {
      'navigation.course.calcValues.crossTrackError':
        overrides.crossTrackError ?? realXte,
      'navigation.course.calcValues.bearingTrackTrue':
        overrides.bearingTrackTrue ?? realBearingTrackTrue,
      'navigation.course.calcValues.bearingTrue':
        overrides.bearingTrue ?? realBearingTrue
    }
    for (const [p, value] of Object.entries(calcValues)) {
      app.streambundle.getSelfStream(p).push(value)
    }
  }

  function parseApb(sentence: string): Record<string, string | undefined> {
    const body = sentence.split('*')[0]!
    const parts = body.split(',')
    return {
      talker: parts[0], // $IIAPB
      status1: parts[1],
      status2: parts[2],
      xteMagnitude: parts[3],
      steerDirection: parts[4],
      xteUnits: parts[5],
      arrivalCircle: parts[6],
      perpendicularPassed: parts[7],
      bearingOriginToDest: parts[8],
      bearingOriginToDestRef: parts[9],
      waypointId: parts[10],
      bearingPosToDest: parts[11],
      bearingPosToDestRef: parts[12],
      headingToSteer: parts[13],
      headingToSteerRef: parts[14]
    }
  }

  it('emits a valid APB sentence with real navigation data', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.status1, 'A')
      assert.equal(fields.status2, 'A')
      assert.equal(fields.xteUnits, 'N')
      assert.equal(fields.bearingOriginToDestRef, 'T')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-true')
    pushApbStreams(app, {})
  })

  it('subscribes to navigation.course.nextPoint for waypoint metadata', () => {
    // The APB generator must subscribe to the nextPoint path so that it can
    // read the destination waypoint name and populate NMEA field 10 (Waypoint
    // ID). Without this subscription, there is no source for the waypoint
    // identifier and field 10 has to be hardcoded.
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const apb = require('../src/sentences/APB-true').default(stubApp)
    assert.ok(
      apb.keys.includes('navigation.course.nextPoint'),
      'APB keys should include navigation.course.nextPoint, got: ' +
        JSON.stringify(apb.keys)
    )
  })

  it('uses waypoint name in field 10 when nextPoint has a name', (done) => {
    // When Signal K provides a named waypoint (e.g. user navigated to a saved
    // waypoint via the Course API), the name should appear in APB field 10
    // (Destination Waypoint ID) so the autopilot can display it.
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(
        fields.waypointId,
        'NASSAU',
        'field 10 should contain the waypoint name from nextPoint'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-true')
    pushApbStreams(app, {
      nextPoint: {
        position: { latitude: 25.04133, longitude: -77.24333 },
        type: 'Waypoint',
        name: 'NASSAU'
      }
    })
  })

  it('uses empty field 10 when nextPoint has no name', (done) => {
    // Route points typically have no name (just type: "RoutePoint" and a
    // position). NMEA allows empty fields, so field 10 should be empty rather
    // than a meaningless placeholder like "00".
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(
        fields.waypointId,
        '',
        'field 10 should be empty when no waypoint name is available'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-true')
    pushApbStreams(app, {
      nextPoint: {
        position: { latitude: 25.04133, longitude: -77.24333 },
        type: 'RoutePoint'
      }
    })
  })

  it('computes correct XTE and steer direction from real data', (done) => {
    // XTE = -39.84 m means vessel is left of track, steer Right.
    // Magnitude in NM: 39.84 * 0.000539957 = 0.022 NM
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.steerDirection, 'R', 'negative XTE = steer right')
      assert.equal(fields.xteMagnitude, '0.022')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-true')
    pushApbStreams(app, {})
  })

  it('computes bearings in degrees from radians', (done) => {
    // bearingTrackTrue = 2.1503 rad = 123 deg
    // bearingTrue = 2.1962 rad = 126 deg
    // All three bearing pairs use True (fields 9, 12, 14 = 'T').
    // Heading to steer (field 13) equals bearingTrue, not bearingMagnetic.
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.bearingOriginToDest, '123')
      assert.equal(fields.bearingPosToDest, '126')
      assert.equal(fields.headingToSteer, '126')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-true')
    pushApbStreams(app, {})
  })

  it('uses True reference for all three bearing pairs', (done) => {
    // NMEA APB carries three bearing pairs (fields 8-9, 11-12, 13-14).
    // All must use the same reference system. This plugin uses True for all
    // three, which is correct for autopilots with a true heading source and
    // matches the convention used by RMB in this repo.
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.bearingOriginToDestRef, 'T', 'field 9')
      assert.equal(fields.bearingPosToDestRef, 'T', 'field 12')
      assert.equal(fields.headingToSteerRef, 'T', 'field 14')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-true')
    pushApbStreams(app, {})
  })

  it('steers Left when XTE is positive (vessel right of track)', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      const fields = parseApb(value as string)
      assert.equal(fields.steerDirection, 'L', 'positive XTE = steer left')
      assert.equal(fields.xteMagnitude, '0.054')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-true')
    pushApbStreams(app, { crossTrackError: 100 })
  })

  it('does not subscribe to bearingMagnetic', () => {
    const stubApp = {
      streambundle: {
        getSelfStream: (): unknown => ({ toProperty: () => ({}) })
      },
      emit: (): void => {},
      debug: (): void => {}
    }
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const apb = require('../src/sentences/APB-true').default(stubApp)
    assert.ok(
      !apb.keys.includes('navigation.course.calcValues.bearingMagnetic'),
      'APB should not subscribe to bearingMagnetic, got: ' +
        JSON.stringify(apb.keys)
    )
  })
})
