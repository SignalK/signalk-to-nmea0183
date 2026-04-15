const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

// Multi-input sentence with mixed defaults: navigation.headingMagnetic has
// no default, navigation.magneticVariation defaults to ''. This exercises
// combineStreamsWith with one Property (toProperty(default)) plus one
// non-defaulted Bus that we then push to.
describe('HDG', function () {
  it('emits heading magnetic when only headingMagnetic is pushed', (done) => {
    const onEmit = (event, value) => {
      // 0.5 rad ≈ 28.65°, magneticVariation default is empty string,
      // so the magneticVariationDir branch stays empty: $IIHDG,28.65,,,,*<cs>
      assert.match(value, /^\$IIHDG,28\.65,,,,\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDG')
    app.streambundle.getSelfStream('navigation.headingMagnetic').push(0.5)
  })

  it('uses pushed magneticVariation when both inputs have values', (done) => {
    const onEmit = (event, value) => {
      // headingMagnetic = 0.5 rad, magneticVariation = 0.1 rad ≈ 5.73°E.
      // Push magneticVariation BEFORE headingMagnetic so that the very
      // first combineWith emission already sees the non-default value.
      // (debounceImmediate(20) would swallow a second emission if we
      // pushed headingMagnetic first then magneticVariation.)
      assert.match(value, /^\$IIHDG,28\.65,5\.73,E,,\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDG')
    app.streambundle.getSelfStream('navigation.magneticVariation').push(0.1)
    app.streambundle.getSelfStream('navigation.headingMagnetic').push(0.5)
  })
})
