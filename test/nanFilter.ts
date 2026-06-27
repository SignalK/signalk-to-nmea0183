import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

/**
 * Safety net in src/index.ts: a sentence whose body still contains a literal
 * "NaN" field must never be emitted, even if an individual encoder forgets to
 * guard a non-finite input.  Encoders are expected to render absent values as
 * empty fields, but this is the last line of defence before the wire.
 *
 * MTW is used because it has a single key and applies no non-finite guard of
 * its own (temperature - 273.15 = NaN), so pushing NaN exercises the filter
 * in index.ts rather than a guard in the encoder.
 */
describe('NaN safety-net filter', function () {
  this.timeout(300)

  it('drops a sentence that would contain a literal NaN field', (done) => {
    let emitted = false
    const onEmit = (): void => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'MTW')
    app.streambundle.getSelfStream('environment.water.temperature').push(NaN)
    setTimeout(() => {
      assert.strictEqual(emitted, false)
      done()
    }, 60)
  })

  it('still emits a valid sentence for finite input', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.strictEqual(value, '$IIMTW,40.0,C*17')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MTW')
    // 313.15 K = 40.0 °C
    app.streambundle.getSelfStream('environment.water.temperature').push(313.15)
  })
})
