const assert = require('assert')

const {createAppWithPlugin} = require ('./testutil')

describe('RMB', function () {


    it('it works with api V1', done => {
      const onEmit = (event, value) => {
        assert.equal(value, '$IIRMB,A,0.05,R,,,0600.0000,N,00500.0000,E,1.08,180,9.72,,A*10')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'RMB','1.0')
      app.streambundle
      .getSelfStream('navigation.courseGreatCircle.nextPoint.position')
      .push({ longitude: 5, latitude: 6 })
      app.streambundle.getSelfStream('navigation.courseGreatCircle.crossTrackError').push(-100)
      app.streambundle.getSelfStream('navigation.courseGreatCircle.nextPoint.distance').push(2000)
      app.streambundle.getSelfStream('navigation.courseGreatCircle.nextPoint.bearingTrue').push(Math.PI)
      app.streambundle.getSelfStream('navigation.courseGreatCircle.nextPoint.velocityMadeGood').push(5)
    })

    it('it works with api V2', done => {
      const onEmit = (event, value) => {
        assert.equal(value, '$IIRMB,A,0.05,R,,,0600.0000,N,00500.0000,E,1.08,180,9.72,,A*10')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'RMB','2.0')
      app.streambundle
      .getSelfStream('navigation.course.nextPoint.position')
      .push({ longitude: 5, latitude: 6 })
      app.streambundle.getSelfStream('navigation.course.calcValues.crossTrackError').push(-100)
      app.streambundle.getSelfStream('navigation.course.calcValues.distance').push(2000)
      app.streambundle.getSelfStream('navigation.course.calcValues.bearingTrue').push(Math.PI)
      app.streambundle.getSelfStream('navigation.course.calcValues.velocityMadeGood').push(5)
    })
})
