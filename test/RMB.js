const assert = require('assert')

const {createAppWithPlugin} = require ('./testutil')

describe('RMB', function () {
  it('it works with positive XTE (L) ', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$IIRMB,A,0.05,L,,,0600.0000,N,00500.0000,E,1.08,180,9.72,,A*0E')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMB')
    app.streambundle
    .getSelfStream('navigation.position')
    .push({ longitude: 5, latitude: 6 })
    app.streambundle.getSelfStream('navigation.course.calcValues.crossTrackError').push(100)
    app.streambundle.getSelfStream('navigation.course.calcValues.distance').push(2000)
    app.streambundle.getSelfStream('navigation.course.calcValues.bearingTrue').push(Math.PI)
    app.streambundle.getSelfStream('navigation.course.calcValues.velocityMadeGood').push(5)
  })

  it('it works with negative XTE (R) ', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$IIRMB,A,0.05,R,,,0600.0000,N,00500.0000,E,1.08,180,9.72,,A*10')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMB')
    app.streambundle
    .getSelfStream('navigation.position')
    .push({ longitude: 5, latitude: 6 })
    app.streambundle.getSelfStream('navigation.course.calcValues.crossTrackError').push(-100)
    app.streambundle.getSelfStream('navigation.course.calcValues.distance').push(2000)
    app.streambundle.getSelfStream('navigation.course.calcValues.bearingTrue').push(Math.PI)
    app.streambundle.getSelfStream('navigation.course.calcValues.velocityMadeGood').push(5)
  })
})
