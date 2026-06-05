import * as assert from 'assert'
import { createAppWithPlugin } from './testutil'

describe('Heading True and VWR', function () {
  it('HDT: emits true heading', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIHDT,180.0,T*21')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDT')
    app.streambundle.getSelfStream('navigation.headingTrue').push(Math.PI)
  })

  it('HDTC: calculates true from magnetic + variation', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // 170 Mag + 10 Var = 180 True
      assert.equal(value, '$IIHDT,180.0,T*21')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'HDTC')
    app.streambundle.getSelfStream('navigation.headingMagnetic').push((170 * Math.PI) / 180)
    app.streambundle.getSelfStream('navigation.magneticVariation').push((10 * Math.PI) / 180)
  })

  it('VWR: emits apparent wind angle and speed with L/R indicator', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // -0.523 rad = 30 deg Port (L)
      assert.equal(value, '$IIVWR,30.00,L,3.89,N,2.00,M,7.20,K*7F')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VWR')
    app.streambundle.getSelfStream('environment.wind.angleApparent').push(-0.52359877559)
    app.streambundle.getSelfStream('environment.wind.speedApparent').push(2.0)
  })

  it('HDTC: Guard Clause ignores null magnetic heading', (done) => {
    let emitted = false
    const app = createAppWithPlugin(() => { emitted = true }, 'HDTC')
    app.streambundle.getSelfStream('navigation.headingMagnetic').push(null)
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })
})