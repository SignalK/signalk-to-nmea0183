import * as assert from 'assert'
import { createAppWithPlugin } from './testutil'

describe('Environment Sentences', function () {
  it('MTA: converts Kelvin to Celsius (Air)', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIMTA,20.00,C*02')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MTA')
    app.streambundle
      .getSelfStream('environment.outside.temperature')
      .push(293.15)
  })

  it('MTW: converts Kelvin to Celsius (Water)', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIMTW,20.0,C*1D')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MTW')
    app.streambundle.getSelfStream('environment.water.temperature').push(293.15)
  })

  it('MMB: converts Pascals to inHg and Bar', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIMMB,29.8253,I,1.0100,B*63')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MMB')
    app.streambundle.getSelfStream('environment.outside.pressure').push(101000)
  })

  it('XDRBaro: emits atmospheric pressure in Bar', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIXDR,P,1.0100,B,Barometer*12')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'XDRBaro')
    app.streambundle.getSelfStream('environment.outside.pressure').push(101000)
  })

  it('XDRTemp: emits air temperature in Celsius', (done) => {
    const onEmit = (_event: string, value: unknown): void => {
      assert.equal(value, '$IIXDR,C,20.00,C,TempAir*1C')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'XDRTemp')
    app.streambundle
      .getSelfStream('environment.outside.temperature')
      .push(293.15)
  })

  it('Guard Clause: XDRBaro ignores null pressure', (done) => {
    let emitted = false
    const onEmit = () => {
      emitted = true
    }
    const app = createAppWithPlugin(onEmit, 'XDRBaro')
    app.streambundle.getSelfStream('environment.outside.pressure').push(null)
    setTimeout(() => {
      assert.equal(emitted, false)
      done()
    }, 50)
  })
})
