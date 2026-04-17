import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

// HDMC generates HDM (magnetic heading) from headingTrue and magneticVariation.
// Per the Signal K spec: headingTrue = headingMagnetic + magneticVariation,
// therefore: headingMagnetic = headingTrue - magneticVariation.
describe('HDMC', function () {
  it('computes magnetic heading by subtracting variation from true heading', (done) => {
    // headingTrue = pi rad = 180 deg, variation = 10 deg easterly
    // Expected: headingMagnetic = 180 - 10 = 170 deg
    const onEmit = (_event: string, value: unknown): void => {
      assert.match(value as string, /^\$IIHDM,170\.0,M\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDMC')
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push((10 * Math.PI) / 180)
    app.streambundle.getSelfStream('navigation.headingTrue').push(Math.PI)
  })

  it('wraps into [0, 360) when variation exceeds true heading', (done) => {
    // headingTrue = 5 deg, variation = 10 deg easterly
    // headingMagnetic = 5 - 10 = -5 deg -> must wrap to 355 deg
    const onEmit = (_event: string, value: unknown): void => {
      assert.match(value as string, /^\$IIHDM,355\.0,M\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDMC')
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push((10 * Math.PI) / 180)
    app.streambundle
      .getSelfStream('navigation.headingTrue')
      .push((5 * Math.PI) / 180)
  })

  it('wraps into [0, 360) when westerly variation pushes heading above 360', (done) => {
    // headingTrue = 355 deg, variation = -10 deg (westerly)
    // headingMagnetic = 355 - (-10) = 365 deg -> must wrap to 5 deg
    const onEmit = (_event: string, value: unknown): void => {
      assert.match(value as string, /^\$IIHDM,5\.0,M\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDMC')
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push((-10 * Math.PI) / 180)
    app.streambundle
      .getSelfStream('navigation.headingTrue')
      .push((355 * Math.PI) / 180)
  })
})
