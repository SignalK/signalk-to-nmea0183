import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

// Regression test for the single-key-sentence pipeline.
//
// DBT is one of ~13 sentence encoders that take a single input key with no
// defaults. The plugin's stream-combining helper has to produce a Property
// even in the single-input case so that the downstream .changes() call keeps
// working — this used to crash with "filter(...).changes is not a function"
// when the helper's seed was a plain EventStream instead of a Property.
describe('DBT', function () {
  it('emits depth in feet, metres, and fathoms', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // 10 m -> 32.8 ft, 10.00 m, 5.5 fa, then the NMEA checksum
      assert.equal(value, '$IIDBT,32.8,f,10.00,M,5.5,F*29')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'DBT')
    app.streambundle.getSelfStream('environment.depth.belowTransducer').push(10)
  })

  it('emits on every subsequent push', (done) => {
    let count = 0
    const onEmit = (): void => {
      count++
      if (count >= 2) done()
    }
    const app = createAppWithPlugin(onEmit, 'DBT')
    const stream = app.streambundle.getSelfStream(
      'environment.depth.belowTransducer'
    )
    stream.push(10)
    // Plugin's pipeline has a 20ms debounceImmediate, so wait it out before
    // the second push so both events make it through.
    setTimeout(() => stream.push(15), 50)
  })
})
