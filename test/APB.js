const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

describe('APB', function () {
  // Real Signal K data captured from openplotter.local (SK v2.24.0)
  // navigating a route near Nassau, Bahamas (April 2026).
  //
  //   navigation.course.calcValues.crossTrackError = -39.84 m (left of track)
  //   navigation.course.calcValues.bearingTrackTrue = 2.1503 rad (123 deg)
  //   navigation.course.calcValues.bearingTrue = 2.1962 rad (126 deg)
  //   navigation.course.calcValues.bearingMagnetic = 2.0400 rad (117 deg)
  //   navigation.course.nextPoint.position = { lat: 25.041, lon: -77.243 }
  const realXte = -39.84
  const realBearingTrackTrue = 2.1503
  const realBearingTrue = 2.1962
  const realBearingMagnetic = 2.04

  function pushApbStreams(app, overrides) {
    const data = {
      'navigation.course.calcValues.crossTrackError':
        overrides.crossTrackError ?? realXte,
      'navigation.course.calcValues.bearingTrackTrue':
        overrides.bearingTrackTrue ?? realBearingTrackTrue,
      'navigation.course.calcValues.bearingTrue':
        overrides.bearingTrue ?? realBearingTrue,
      'navigation.course.calcValues.bearingMagnetic':
        overrides.bearingMagnetic ?? realBearingMagnetic
    }
    if ('nextPoint' in overrides) {
      data['navigation.course.nextPoint'] = overrides.nextPoint
    }
    for (const [path, value] of Object.entries(data)) {
      app.streambundle.getSelfStream(path).push(value)
    }
  }

  function parseApb(sentence) {
    const body = sentence.split('*')[0]
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
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.status1, 'A')
      assert.equal(fields.status2, 'A')
      assert.equal(fields.xteUnits, 'N')
      assert.equal(fields.bearingOriginToDestRef, 'T')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushApbStreams(app, {})
  })

  it('subscribes to navigation.course.nextPoint for waypoint metadata', () => {
    // The APB generator must subscribe to the nextPoint path so that it can
    // read the destination waypoint name and populate NMEA field 10 (Waypoint
    // ID). Without this subscription, there is no source for the waypoint
    // identifier and field 10 has to be hardcoded.
    const app = {
      streambundle: { getSelfStream: () => ({ toProperty: () => ({}) }) },
      emit: () => {},
      debug: () => {}
    }
    const apb = require('../sentences/APB')(app)
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
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(
        fields.waypointId,
        'NASSAU',
        'field 10 should contain the waypoint name from nextPoint'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
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
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(
        fields.waypointId,
        '',
        'field 10 should be empty when no waypoint name is available'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
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
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.steerDirection, 'R', 'negative XTE = steer right')
      assert.equal(fields.xteMagnitude, '0.022')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushApbStreams(app, {})
  })

  it('computes bearings in degrees from radians', (done) => {
    // bearingTrackTrue = 2.1503 rad = 123 deg
    // bearingTrue = 2.1962 rad = 126 deg
    // bearingMagnetic = 2.0400 rad = 117 deg
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.bearingOriginToDest, '123')
      assert.equal(fields.bearingPosToDest, '126')
      assert.equal(fields.headingToSteer, '117')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushApbStreams(app, {})
  })
})
