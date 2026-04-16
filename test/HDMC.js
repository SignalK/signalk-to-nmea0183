const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

// HDMC generates HDM (magnetic heading) from headingTrue and magneticVariation.
// Per the Signal K spec: headingTrue = headingMagnetic + magneticVariation,
// therefore: headingMagnetic = headingTrue - magneticVariation.
describe('HDMC', function () {
  it('computes magnetic heading by subtracting variation from true heading', (done) => {
    // headingTrue = pi rad = 180 deg, variation = 10 deg easterly
    // Expected: headingMagnetic = 180 - 10 = 170 deg
    const onEmit = (event, value) => {
      assert.match(value, /^\$IIHDM,170\.0,M\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDMC')
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push((10 * Math.PI) / 180)
    app.streambundle.getSelfStream('navigation.headingTrue').push(Math.PI)
  })
})
