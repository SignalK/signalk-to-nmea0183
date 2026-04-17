import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

// Multi-input sentence with mixed defaults: navigation.headingMagnetic has
// no default, navigation.magneticVariation defaults to ''. This exercises
// combineStreamsWith with one Property (toProperty(default)) plus one
// non-defaulted Bus that we then push to.
//
// HDG field layout: $--HDG,heading,deviation,devDir,variation,varDir*cs
// Deviation fields (1-2) are always empty because Signal K's
// headingMagnetic already has deviation applied.
describe('HDG', function () {
  it('emits heading with empty deviation and variation when only headingMagnetic is pushed', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // 0.5 rad = 28.65 deg; no variation available
      // Expected: $IIHDG,28.65,,,,*cs
      assert.match(value as string, /^\$IIHDG,28\.65,,,,\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDG')
    app.streambundle.getSelfStream('navigation.headingMagnetic').push(0.5)
  })

  it('places easterly variation in fields 4-5', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // headingMagnetic = 0.5 rad = 28.65 deg
      // magneticVariation = 0.1 rad = 5.73 deg E
      // Expected: $IIHDG,28.65,,,5.73,E*cs
      // Push magneticVariation BEFORE headingMagnetic so the first
      // combineWith emission already sees the non-default value
      // (debounceImmediate(20) would swallow a second emission).
      assert.match(value as string, /^\$IIHDG,28\.65,,,5\.73,E\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDG')
    app.streambundle.getSelfStream('navigation.magneticVariation').push(0.1)
    app.streambundle.getSelfStream('navigation.headingMagnetic').push(0.5)
  })

  it('places westerly variation in fields 4-5 with W direction', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // magneticVariation = -0.1 rad (westerly, negative per Signal K spec)
      // Expected: direction = 'W', degrees = 5.73 (absolute value)
      // Expected: $IIHDG,28.65,,,5.73,W*cs
      assert.match(value as string, /^\$IIHDG,28\.65,,,5\.73,W\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDG')
    app.streambundle.getSelfStream('navigation.magneticVariation').push(-0.1)
    app.streambundle.getSelfStream('navigation.headingMagnetic').push(0.5)
  })

  it('handles heading near 360 degrees', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // 6.0 rad = 343.77 deg
      assert.match(value as string, /^\$IIHDG,343\.77,,,,\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDG')
    app.streambundle.getSelfStream('navigation.headingMagnetic').push(6.0)
  })

  it('handles zero variation as easterly', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // magneticVariation = 0 rad; 0 !== '' is true, 0 < 0 is false => 'E'
      // Expected: $IIHDG,28.65,,,0.00,E*cs
      assert.match(value as string, /^\$IIHDG,28\.65,,,0\.00,E\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDG')
    app.streambundle.getSelfStream('navigation.magneticVariation').push(0)
    app.streambundle.getSelfStream('navigation.headingMagnetic').push(0.5)
  })
})
