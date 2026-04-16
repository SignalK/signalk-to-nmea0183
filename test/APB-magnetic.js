const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

describe('APB-magnetic', function () {
  // bearingTrackTrue = 2.1503 rad (123 deg)
  // bearingTrue = 2.1962 rad (126 deg)
  // magneticVariation = -0.16 rad (-9.17 deg, westerly)
  // magnetic = true - variation = true - (-0.16) = true + 0.16
  // bearingTrackMag = 123 + 9 = 132 deg
  // bearingMag = 126 + 9 = 135 deg
  const realXte = -39.84
  const realBearingTrackTrue = 2.1503
  const realBearingTrue = 2.1962
  const realVariation = -0.16

  function pushStreams(app) {
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push(realVariation)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.crossTrackError')
      .push(realXte)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.bearingTrackTrue')
      .push(realBearingTrackTrue)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.bearingTrue')
      .push(realBearingTrue)
  }

  function parseApb(sentence) {
    const body = sentence.split('*')[0]
    const parts = body.split(',')
    return {
      talker: parts[0],
      bearingOriginToDest: parts[8],
      bearingOriginToDestRef: parts[9],
      waypointId: parts[10],
      bearingPosToDest: parts[11],
      bearingPosToDestRef: parts[12],
      headingToSteer: parts[13],
      headingToSteerRef: parts[14]
    }
  }

  it('uses Magnetic reference for all three bearing pairs', (done) => {
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.bearingOriginToDestRef, 'M', 'field 9')
      assert.equal(fields.bearingPosToDestRef, 'M', 'field 12')
      assert.equal(fields.headingToSteerRef, 'M', 'field 14')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-magnetic')
    pushStreams(app)
  })

  it('computes magnetic bearings from true bearings and variation', (done) => {
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.bearingOriginToDest, '132')
      assert.equal(fields.bearingPosToDest, '135')
      assert.equal(fields.headingToSteer, '135')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-magnetic')
    pushStreams(app)
  })

  it('wraps magnetic bearing when near 360', (done) => {
    // bearingTrue = 355 deg (6.196 rad), variation = -10 deg (-0.175 rad)
    // magnetic = 355 - (-10) = 365 -> wraps to 5 deg
    const onEmit = (event, value) => {
      const fields = parseApb(value)
      assert.equal(fields.headingToSteer, '5')
      assert.equal(fields.headingToSteerRef, 'M')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'APB-magnetic')
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push((-10 * Math.PI) / 180)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.crossTrackError')
      .push(realXte)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.bearingTrackTrue')
      .push((350 * Math.PI) / 180)
    app.streambundle
      .getSelfStream('navigation.course.calcValues.bearingTrue')
      .push((355 * Math.PI) / 180)
  })
})
