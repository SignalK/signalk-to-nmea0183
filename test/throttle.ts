import * as assert from 'assert'
import { createAppWithPlugin } from './testutil'

// Exercise the `if (throttle)` branch in plugin.start that wraps the
// pipeline in `stream.throttle(ms)`. Without this test the throttle code
// path has no coverage at all.
describe('throttle', function () {
  it('rate-limits emissions when a throttle option is set', function (done) {
    this.timeout(2000)
    let count = 0
    const onEmit = () => {
      count++
    }
    const app = createAppWithPlugin(onEmit, {
      HDM: true,
      HDM_throttle: 200
    })
    const stream = app.streambundle.getSelfStream('navigation.headingMagnetic')
    // Push 10 values in quick succession. With a 200ms throttle we expect
    // at most 1 emission within the first ~250ms.
    for (let i = 0; i < 10; i++) stream.push(0.5 + i * 0.01)
    setTimeout(() => {
      try {
        assert.ok(
          count <= 1,
          'expected ≤1 emission with 200ms throttle, got ' + count
        )
        // And at least one emission should arrive eventually.
        assert.ok(count >= 1, 'expected ≥1 emission, got ' + count)
        done()
      } catch (e) {
        done(e as Error)
      }
    }, 250)
  })
})
