const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

describe('APB', function () {
  // Real navigation data: route near Nassau, Bahamas.
  //   crossTrackError = -39.84 m (left of track)
  //   bearingTrackTrue = 2.1503 rad (123 deg)
  //   bearingTrue = 2.1962 rad (126 deg)
  //   magneticVariation = -0.16 rad (-9.17 deg, westerly)
  //   -> headingToSteerMag = bearingTrue - variation = 126 - (-9) = 135 deg
  const realXte = -39.84
  const realBearingTrackTrue = 2.1503
  const realBearingTrue = 2.1962
  const realVariation = -0.16

  function pushApbStreams(app, overrides) {
    // Push nextPoint and variation before calcValues so they are present
    // when the combined stream fires.
    if ('nextPoint' in overrides) {
      app.streambundle
        .getSelfStream('navigation.course.nextPoint')
        .push(overrides.nextPoint)
    }
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push(overrides.magneticVariation ?? realVariation)
    const calcValues = {
      'navigation.course.calcValues.crossTrackError':
        overrides.crossTrackError ?? realXte,
      'navigation.course.calcValues.bearingTrackTrue':
        overrides.bearingTrackTrue ?? realBearingTrackTrue,
      'navigation.course.calcValues.bearingTrue':
        overrides.bearingTrue ?? realBearingTrue
    }
    for (const [path, value] of Object.entries(calcValues)) {
      app.streambundle.getSelfStream(path).push(value)
    }
  }

  function parseApb(sentence) {
    const body = sentence.split('*')[0]
    const parts = body.split(',')
    return {
      talker: parts[0],
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

  it('subscribes to magneticVariation for heading to steer', () => {
    const app = {
      streambundle: { getSelfStream: () => ({ toProperty: () => ({}) }) },
      emit: () => {},
      debug: () => {}
    }
    const apb = require('../sentences/APB')(app)
    assert.ok(
      apb.keys.includes('navigation.magneticVariation'),
      'APB keys should include navigation.magneticVariation'
    )
    assert.ok(
      apb.keys.includes('navigation.course.nextPoint'),
      'APB keys should include navigation.course.nextPoint'
    )
  })

  it('uses waypoint name in field 10 when nextPoint has a name', (done) => {
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.waypointId, 'NASSAU')
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
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.waypointId, '')
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

  it('computes correct XTE and steer direction', (done) => {
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.steerDirection, 'R', 'negative XTE = steer right')
      assert.equal(fields.xteMagnitude, '0.022')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushApbStreams(app, {})
  })

  it('uses True for bearing fields 8-12 and Magnetic for heading to steer 13-14', (done) => {
    // bearingTrackTrue = 2.1503 rad = 123 deg
    // bearingTrue = 2.1962 rad = 126 deg
    // headingToSteerMag = fixAngle(bearingTrue - variation)
    //                   = fixAngle(2.1962 - (-0.16)) = fixAngle(2.3562) = 2.3562 - 2*PI
    //                   ... actually fixAngle(2.3562) = 2.3562 (< PI) so stays
    //                   radsToPositiveDeg(2.3562) = 135 deg
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.bearingOriginToDest, '123')
      assert.equal(fields.bearingOriginToDestRef, 'T')
      assert.equal(fields.bearingPosToDest, '126')
      assert.equal(fields.bearingPosToDestRef, 'T')
      assert.equal(fields.headingToSteer, '135')
      assert.equal(fields.headingToSteerRef, 'M')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushApbStreams(app, {})
  })

  it('steers Left when XTE is positive (vessel right of track)', (done) => {
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.steerDirection, 'L', 'positive XTE = steer left')
      assert.equal(fields.xteMagnitude, '0.054')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushApbStreams(app, { crossTrackError: 100 })
  })
})
