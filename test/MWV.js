const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

describe('MWV relative', function () {
  it('works with positive angle', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$IIMWV,180.00,R,2.00,M,A*35')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MWVR')
    app.streambundle
      .getSelfStream('environment.wind.angleApparent')
      .push(Math.PI)
    app.streambundle.getSelfStream('environment.wind.speedApparent').push(2)
  })

  it('works with negative angle', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$IIMWV,270.00,R,2.00,M,A*39')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'MWVR')
    app.streambundle
      .getSelfStream('environment.wind.angleApparent')
      .push(-Math.PI / 2)
    app.streambundle.getSelfStream('environment.wind.speedApparent').push(2)
  })
})

describe('MWV true', function () {
  it('works with positive angle', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$IIMWV,180.00,T,2.00,M,A*33')
      done()
    }

    const app = createAppWithPlugin(onEmit, 'MWVT')
    app.streambundle
      .getSelfStream('environment.wind.angleTrueWater')
      .push(Math.PI)
    app.streambundle.getSelfStream('environment.wind.speedTrue').push(2)
  })

  it('works with negative angle', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$IIMWV,270.00,T,2.00,M,A*3F')
      done()
    }

    const app = createAppWithPlugin(onEmit, 'MWVT')
    app.streambundle
      .getSelfStream('environment.wind.angleTrueWater')
      .push(-Math.PI / 2)
    app.streambundle.getSelfStream('environment.wind.speedTrue').push(2)
  })
})
