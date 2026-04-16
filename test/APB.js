const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

describe('APB', function () {
  // Real navigation data: route near Nassau, Bahamas.
  //   crossTrackError = -39.84 m (left of track)
  //   bearingTrackTrue = 2.1503 rad (123 deg)
  //   bearingTrue = 2.1962 rad (126 deg)
  //   magneticVariation = -0.16 rad (-9.17 deg, westerly)
  const realXte = -39.84
  const realBearingTrackTrue = 2.1503
  const realBearingTrue = 2.1962
  const realVariation = -0.16

  function pushApbStreams(app, overrides) {
    if ('nextPoint' in overrides) {
      app.streambundle
        .getSelfStream('navigation.course.nextPoint')
        .push(overrides.nextPoint)
    }
    if ('magneticVariation' in overrides) {
      app.streambundle
        .getSelfStream('navigation.magneticVariation')
        .push(overrides.magneticVariation)
    }
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

  it('defaults to True bearings for all three pairs', (done) => {
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.bearingOriginToDestRef, 'T', 'field 9')
      assert.equal(fields.bearingPosToDestRef, 'T', 'field 12')
      assert.equal(fields.headingToSteerRef, 'T', 'field 14')
      assert.equal(fields.bearingOriginToDest, '123')
      assert.equal(fields.bearingPosToDest, '126')
      assert.equal(fields.headingToSteer, '126')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB')
    pushApbStreams(app, {})
  })

  it('uses magnetic bearings when APB_magneticBearings is enabled', (done) => {
    // variation = -0.16 rad = -9.17 deg (westerly)
    // magnetic = true - variation = true - (-0.16) = true + 0.16
    // bearingTrackTrue 123 deg -> magnetic 132 deg
    // bearingTrue 126 deg -> magnetic 135 deg
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.bearingOriginToDestRef, 'M', 'field 9')
      assert.equal(fields.bearingPosToDestRef, 'M', 'field 12')
      assert.equal(fields.headingToSteerRef, 'M', 'field 14')
      assert.equal(fields.bearingOriginToDest, '132')
      assert.equal(fields.bearingPosToDest, '135')
      assert.equal(fields.headingToSteer, '135')
      done()
    }
    const app = createAppWithPlugin(onEmit, {
      APB: true,
      APB_magneticBearings: true
    })
    pushApbStreams(app, { magneticVariation: realVariation })
  })

  it('falls back to True when magnetic is enabled but variation is unavailable', (done) => {
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.bearingOriginToDestRef, 'T', 'field 9')
      assert.equal(fields.bearingPosToDestRef, 'T', 'field 12')
      assert.equal(fields.headingToSteerRef, 'T', 'field 14')
      done()
    }
    const app = createAppWithPlugin(onEmit, {
      APB: true,
      APB_magneticBearings: true
    })
    // magneticVariation defaults to null, never pushed
    pushApbStreams(app, {})
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
      nextPoint: { position: { latitude: 25.04, longitude: -77.24 } }
    })
  })

  it('never mixes T and M within a single sentence', (done) => {
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(
        fields.bearingOriginToDestRef,
        fields.bearingPosToDestRef,
        'fields 9 and 12 must match'
      )
      assert.equal(
        fields.bearingPosToDestRef,
        fields.headingToSteerRef,
        'fields 12 and 14 must match'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, {
      APB: true,
      APB_magneticBearings: true
    })
    pushApbStreams(app, { magneticVariation: realVariation })
  })
})
