const Bacon = require('baconjs')
const assert = require('assert')

describe('RMC', function () {
  it('works without datetime & magneticVariation', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$SKRMC,,A,0600.0000,N,00500.0000,E,1.9,114.6,,,E*5E')
      done()
    }
    const app = createAppWithPlugin(onEmit)
    app.streambundle.getSelfStream('navigation.speedOverGround').push('1')
    app.streambundle.getSelfStream('navigation.courseOverGroundTrue').push('2')
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 5, latitude: 6 })
  })

  it('works with large longitude', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$SKRMC,,A,3749.6038,N,12225.2480,W,1.9,114.6,,,E*43')
      done()
    }
    const app = createAppWithPlugin(onEmit)
    app.streambundle.getSelfStream('navigation.speedOverGround').push('1')
    app.streambundle.getSelfStream('navigation.courseOverGroundTrue').push('2')
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: -122.4208, latitude: 37.82673 })
  })

  it('ignores a too large longitude', done => {
    const onEmit = (event, value) => {
      assert.equal(value, '$SKRMC,,A,3749.6038,N,12225.2480,W,1.9,114.6,,,E*43')
      done()
    }
    const app = createAppWithPlugin(onEmit)
    app.streambundle.getSelfStream('navigation.speedOverGround').push('1')
    app.streambundle.getSelfStream('navigation.courseOverGroundTrue').push('2')
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: -222.4208, latitude: 37.82673 })
    //output is debounce(20), so wait a little our output makes it through
    setTimeout(() => {
      app.streambundle
        .getSelfStream('navigation.position')
        .push({ longitude: -122.4208, latitude: 37.82673 })
    }, 50)
  })
})

function createAppWithPlugin (onEmit) {
  const streams = {
    'navigation.speedOverGround': new Bacon.Bus(),
    'navigation.courseOverGroundTrue': new Bacon.Bus(),
    'navigation.datetime': new Bacon.Bus(),
    'navigation.position': new Bacon.Bus(),
    'navigation.magneticVariation': new Bacon.Bus()
  }
  const app = {
    streambundle: { getSelfStream: path => streams[path] },
    emit: onEmit
  }
  const plugin = require('../')(app)
  const options = {
    RMC: true
  }
  plugin.start(options)
  return app
}
