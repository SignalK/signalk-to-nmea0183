const Bacon = require('baconjs')
const assert = require('assert')    

describe('RMC', function () {
  it('works without datetime & magneticVariation', done => {
    const streams = {
        'navigation.speedOverGround': new Bacon.Bus(),
        'navigation.courseOverGroundTrue': new Bacon.Bus(),
        'navigation.datetime': new Bacon.Bus(),
        'navigation.position': new Bacon.Bus(),
        'navigation.magneticVariation': new Bacon.Bus()
    }
    const app = {
      streambundle: { getSelfStream: path => streams[path] },
      emit: (event, value) => {
          assert.equal(value, '$SKRMC,,A,0600.0000,N,00500.0000,E,1.9,114.6,,,E*5E')
          done()
      }
    }
    const plugin = require('../')(app)
    const options = {
      RMC: true
    }
    plugin.start(options)
    app.streambundle.getSelfStream('navigation.speedOverGround').push('1')
    app.streambundle.getSelfStream('navigation.courseOverGroundTrue').push('2')
    app.streambundle.getSelfStream('navigation.position').push({longitude: 5, latitude: 6})
  })
  it('works with large longitude', done => {
    const streams = {
        'navigation.speedOverGround': new Bacon.Bus(),
        'navigation.courseOverGroundTrue': new Bacon.Bus(),
        'navigation.datetime': new Bacon.Bus(),
        'navigation.position': new Bacon.Bus(),
        'navigation.magneticVariation': new Bacon.Bus()
    }
    const app = {
      streambundle: { getSelfStream: path => streams[path] },
      emit: (event, value) => {
          assert.equal(value, '$SKRMC,,A,3749.6038,N,12225.2480,W,1.9,114.6,,,E*43')
          done()
      }
    }
    const plugin = require('../')(app)
    const options = {
      RMC: true
    }
    plugin.start(options)
    app.streambundle.getSelfStream('navigation.speedOverGround').push('1')
    app.streambundle.getSelfStream('navigation.courseOverGroundTrue').push('2')
    app.streambundle.getSelfStream('navigation.position').push({longitude: -122.4208, latitude: 37.82673})
  })
})
