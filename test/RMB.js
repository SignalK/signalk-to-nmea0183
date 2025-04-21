const assert = require('assert')

const {createAppWithPlugin} = require ('./testutil')

describe('RMB', function () {
  const apiVersion = app.config.version ? parseInt(app.config.version.split('.')[0]) : 1

  if(apiVersion>1)
  {
    it('it works with positive XTE (L), api V2', done => {
      const onEmit = (event, value) => {
        assert.equal(value, '$IIRMB,A,0.05,L,,,0600.0000,N,00500.0000,E,1.08,180,9.72,,A*0E')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'RMB')
      app.streambundle
      .getSelfStream('navigation.course.nextPoint')
      .push({ longitude: 5, latitude: 6 })
      app.streambundle.getSelfStream('navigation.course.calcValues.crossTrackError').push(100)
      app.streambundle.getSelfStream('navigation.course.calcValues.distance').push(2000)
      app.streambundle.getSelfStream('navigation.course.calcValues.bearingTrue').push(Math.PI)
      app.streambundle.getSelfStream('navigation.course.calcValues.velocityMadeGood').push(5)
    })
  
    it('it works with negative XTE (R), api V2 ', done => {
      const onEmit = (event, value) => {
        assert.equal(value, '$IIRMB,A,0.05,R,,,0600.0000,N,00500.0000,E,1.08,180,9.72,,A*10')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'RMB')
      app.streambundle
      .getSelfStream('navigation.course.nextPoint')
      .push({ longitude: 5, latitude: 6 })
      app.streambundle.getSelfStream('navigation.course.calcValues.crossTrackError').push(-100)
      app.streambundle.getSelfStream('navigation.course.calcValues.distance').push(2000)
      app.streambundle.getSelfStream('navigation.course.calcValues.bearingTrue').push(Math.PI)
      app.streambundle.getSelfStream('navigation.course.calcValues.velocityMadeGood').push(5)
    })
  }
  else{
    it('it works with positive XTE (L), api V1 ', done => {
      const onEmit = (event, value) => {
        assert.equal(value, '$IIRMB,A,0.05,L,,,0600.0000,N,00500.0000,E,1.08,180,9.72,,A*0E')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'RMB')
      app.streambundle
      .getSelfStream('navigation.courseGreatCircle.nextPoint')
      .push({ longitude: 5, latitude: 6 })
      app.streambundle.getSelfStream('navigation.courseGreatCircle.crossTrackError').push(100)
      app.streambundle.getSelfStream('navigation.courseGreatCircle.distance').push(2000)
      app.streambundle.getSelfStream('navigation.courseGreatCircle.bearingTrue').push(Math.PI)
      app.streambundle.getSelfStream('navigation.courseGreatCircle.velocityMadeGood').push(5)
    })
  
    it('it works with negative XTE (R), api V1 ', done => {
      const onEmit = (event, value) => {
        assert.equal(value, '$IIRMB,A,0.05,R,,,0600.0000,N,00500.0000,E,1.08,180,9.72,,A*10')
        done()
      }
      const app = createAppWithPlugin(onEmit, 'RMB')
      app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 5, latitude: 6 })
      app.streambundle.getSelfStream('navigation.courseGreatCircle.crossTrackError').push(-100)
      app.streambundle.getSelfStream('navigation.courseGreatCircle.distance').push(2000)
      app.streambundle.getSelfStream('navigation.courseGreatCircle.bearingTrue').push(Math.PI)
      app.streambundle.getSelfStream('navigation.courseGreatCircle.velocityMadeGood').push(5)
    })
  }
})
