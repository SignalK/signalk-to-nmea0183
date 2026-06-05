import * as assert from 'assert'
import { createAppWithPlugin } from './testutil'

describe('Performance and Motion', function () {
  it('ROT: converts rads/sec to deg/min', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // 0.01 rad/s * (180/pi) * 60 = 34.38 deg/min
      assert.equal(value, '$IIROT,34.38,A*1A')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'ROT')
    app.streambundle.getSelfStream('navigation.rateOfTurn').push(0.01)
  })

  it('RSA: converts radians to signed degrees', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // -0.1 rad = -5.73 deg (Port)
      assert.equal(value, '$IIRSA,-5.73,A,,*4B')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RSA')
    app.streambundle.getSelfStream('steering.rudderAngle').push(-0.1)
  })

  it('VPW: emits VMG in knots and m/s', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIVPW,3.89,N,2.00,M*4E')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VPW')
    app.streambundle.getSelfStream('performance.velocityMadeGood').push(2.0)
  })

  it('VLW: converts total and trip log to nautical miles', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      // 100,000 m = 54.00 NM
      assert.equal(value, '$IIVLW,54.00,N,5.40,N*5D')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VLW')
    app.streambundle.getSelfStream('navigation.log').push(100000)
    app.streambundle.getSelfStream('navigation.trip.log').push(10000)
  })

  it('VLW: handles null trip log by emitting empty field', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIVLW,54.00,N,,N*0D')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'VLW')
    app.streambundle.getSelfStream('navigation.log').push(100000)
    app.streambundle.getSelfStream('navigation.trip.log').push(null)
  })

  it('XDRNA: emits pitch and roll in degrees', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIXDR,A,5.7,D,PTCH,A,-11.5,D,ROLL*67')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'XDRNA')
    app.streambundle.getSelfStream('navigation.attitude').push({ pitch: 0.1, roll: -0.2 })
  })

  it('RSA: Guard Clause ignores NaN rudder', (done) => {
    let emitted = false
    const app = createAppWithPlugin(() => { emitted = true }, 'RSA')
    app.streambundle.getSelfStream('steering.rudderAngle').push(NaN)
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })
})