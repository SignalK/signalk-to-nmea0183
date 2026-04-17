import * as assert from 'assert'

import { createAppWithPlugin } from './testutil'

// A second single-key sentence (alongside DBT) to exercise the same
// combineStreamsWith single-input → .toProperty → .changes path with a
// different encoder shape.
describe('HDM', function () {
  it('emits heading magnetic in degrees', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // 0.5 rad ≈ 28.6 deg → $IIHDM,28.6,M*<cs>
      assert.match(value as string, /^\$IIHDM,28\.6,M\*[0-9A-F]{2}$/)
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDM')
    app.streambundle.getSelfStream('navigation.headingMagnetic').push(0.5)
  })
})
