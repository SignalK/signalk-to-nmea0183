import * as assert from 'assert'
import { createAppWithPlugin } from './testutil'

describe('Proprietary Encoders', function () {
  it('PNKEP01: emits target polar speed', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$PNKEP,01,3.89,N,7.20,K*6B')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'PNKEP01')
    app.streambundle.getSelfStream('performance.polarSpeed').push(2.0)
  })

  it('PNKEP02: emits course on other tack', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$PNKEP,02,45.00*5B')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'PNKEP02')
    app.streambundle.getSelfStream('performance.tackMagnetic').push(Math.PI / 4)
  })

  it('PNKEP03: emits polar/VMG efficiencies', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$PNKEP,03,45.00,90.00,95.00*54')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'PNKEP03')
    app.streambundle.getSelfStream('performance.targetAngle').push(Math.PI / 4)
    app.streambundle
      .getSelfStream('performance.polarVelocityMadeGoodRatio')
      .push(0.9)
    app.streambundle.getSelfStream('performance.polarSpeedRatio').push(0.95)
  })

  it('PSILTBS: emits target boat speed in knots', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$PSILTBS,3.89,N,*2F')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'PSILTBS')
    app.streambundle.getSelfStream('performance.targetSpeed').push(2.0)
  })
})
