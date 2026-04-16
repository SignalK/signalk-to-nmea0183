const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

// VHW encodes true heading, magnetic heading (derived from true heading minus
// magneticVariation), and speed through water.
//
// Per the Signal K spec, magneticVariation "must be added to the magnetic
// heading to derive the true heading":
//   headingTrue = headingMagnetic + magneticVariation
// Therefore:
//   headingMagnetic = headingTrue - magneticVariation
describe('VHW', function () {
  it('computes magnetic heading by subtracting variation from true heading', (done) => {
    // headingTrue = pi rad = 180 deg
    // magneticVariation = 10 deg easterly (positive per spec)
    // Expected: headingMagnetic = 180 - 10 = 170 deg
    // speedThroughWater = 10 knots = 10 * 1852/3600 m/s
    const onEmit = (event, value) => {
      assert.match(
        value,
        /^\$IIVHW,180\.0,T,170\.0,M,10\.00,N,18\.52,K\*[0-9A-F]{2}$/
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VHW')
    const headingTrue = Math.PI
    const magneticVariation = (10 * Math.PI) / 180
    const speedThroughWater = (10 * 1852) / 3600
    app.streambundle.getSelfStream('navigation.headingTrue').push(headingTrue)
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push(magneticVariation)
    app.streambundle
      .getSelfStream('navigation.speedThroughWater')
      .push(speedThroughWater)
  })

  it('wraps magnetic heading into [0, 360) when variation pushes it negative', (done) => {
    // headingTrue = 5 deg, variation = 10 deg easterly
    // headingMagnetic = 5 - 10 = -5 deg -> wraps to 355 deg
    const onEmit = (event, value) => {
      assert.match(value, /^\$IIVHW,5\.0,T,355\.0,M/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VHW')
    app.streambundle
      .getSelfStream('navigation.headingTrue')
      .push((5 * Math.PI) / 180)
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push((10 * Math.PI) / 180)
    app.streambundle
      .getSelfStream('navigation.speedThroughWater')
      .push((10 * 1852) / 3600)
  })

  it('wraps magnetic heading into [0, 360) when variation pushes it above 360', (done) => {
    // headingTrue = 355 deg, variation = -10 deg (westerly)
    // headingMagnetic = 355 - (-10) = 365 deg -> wraps to 5 deg
    const onEmit = (event, value) => {
      assert.match(value, /^\$IIVHW,355\.0,T,5\.0,M/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VHW')
    app.streambundle
      .getSelfStream('navigation.headingTrue')
      .push((355 * Math.PI) / 180)
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push((-10 * Math.PI) / 180)
    app.streambundle
      .getSelfStream('navigation.speedThroughWater')
      .push((10 * 1852) / 3600)
  })
})
