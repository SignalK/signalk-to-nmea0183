const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

describe('MWV relative', function () {
  it('works with positive angle', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$INMWV,180.00,R,2.00,M,A*32')
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
      assert.equal(value, '$INMWV,270.00,R,2.00,M,A*3E')
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
      assert.equal(value, '$INMWV,180.00,T,2.00,M,A*34')
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
      assert.equal(value, '$INMWV,270.00,T,2.00,M,A*38')
      done()
    }

    const app = createAppWithPlugin(onEmit, 'MWVT')
    app.streambundle
      .getSelfStream('environment.wind.angleTrueWater')
      .push(-Math.PI / 2)
    app.streambundle.getSelfStream('environment.wind.speedTrue').push(2)
  })
})
