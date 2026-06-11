import * as assert from 'assert'
import { createAppWithPlugin } from './testutil'

describe('Cross-Track Error (XTE)', function () {
  it('XTE: emits cross-track error with steer direction R for negative XTE', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // -185.2m = 0.100 NM to the Left (Steer Right)
      assert.equal(value, '$IIXTE,A,A,0.100,R,N*19')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'XTE')
    app.streambundle
      .getSelfStream('navigation.course.calcValues.crossTrackError')
      .push(-185.2)
  })

  it('XTE-GC: emits identical output for same path', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIXTE,A,A,0.100,L,N*03')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'XTE-GC')
    app.streambundle
      .getSelfStream('navigation.course.calcValues.crossTrackError')
      .push(185.2)
  })

  it('XTE: Guard Clause ignores null values', (done) => {
    let emitted = false
    const app = createAppWithPlugin(() => {
      emitted = true
    }, 'XTE')
    app.streambundle
      .getSelfStream('navigation.course.calcValues.crossTrackError')
      .push(null)
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })
})
