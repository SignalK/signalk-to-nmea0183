const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

describe('RMC', function () {
  it('works without datetime & magneticVariation', (done) => {
    const onEmit = (event, value) => {
      assert.equal(value, '$GPRMC,,A,0600.0000,N,00500.0000,E,1.9,114.6,,,E*51')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMC')
    app.streambundle.getSelfStream('navigation.speedOverGround').push('1')
    app.streambundle.getSelfStream('navigation.courseOverGroundTrue').push('2')
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 5, latitude: 6 })
  })

  it('works with large longitude & magnetic variation', (done) => {
    const onEmit = (event, value) => {
      assert.equal(
        value,
        '$GPRMC,,A,3749.6038,N,12225.2480,W,1.9,114.6,,180.0,E*6B'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMC')
    app.streambundle.getSelfStream('navigation.speedOverGround').push('1')
    app.streambundle.getSelfStream('navigation.courseOverGroundTrue').push('2')
    app.streambundle.getSelfStream('navigation.magneticVariation').push(Math.PI)
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: -122.4208, latitude: 37.82673 })
  })

  it('ignores a too large longitude', (done) => {
    const onEmit = (event, value) => {
      assert.equal(value, '$GPRMC,,A,3749.6038,N,12225.2480,W,1.9,114.6,,,E*4C')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMC')
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

  it('populates UTC time and ddmmyy date from a valid datetime', (done) => {
    // Verifies the formatDatetime() output is threaded through RMC: time field
    // uses the hhmmss.ss format (with centiseconds) and date field is ddmmyy.
    const onEmit = (event, value) => {
      assert.equal(
        value,
        '$GPRMC,200152.00,A,5943.2980,N,02444.2043,E,13.0,194.3,051215,,E*46'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMC')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2015-12-05T20:01:52Z')
    app.streambundle.getSelfStream('navigation.speedOverGround').push(6.71)
    app.streambundle
      .getSelfStream('navigation.courseOverGroundTrue')
      .push(3.391964)
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 24.736738, latitude: 59.721633 })
  })

  it('converts timezone-offset datetime to UTC', (done) => {
    // 14:34:56+02:00 on 2025-04-27 = 12:34:56 UTC, same date.
    const onEmit = (event, value) => {
      assert.ok(
        value.startsWith('$GPRMC,123456.00,A,'),
        'expected UTC time 123456.00 in RMC sentence, got ' + value
      )
      assert.ok(
        value.includes(',270425,'),
        'expected date 270425 in RMC sentence, got ' + value
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMC')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-04-27T14:34:56+02:00')
    app.streambundle.getSelfStream('navigation.speedOverGround').push(1)
    app.streambundle.getSelfStream('navigation.courseOverGroundTrue').push(2)
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 5, latitude: 6 })
  })

  // Regression: SignalK/signalk-to-nmea0183#87
  // Some GPS units omit COG when stationary (SOG=0). The RMC sentence must
  // still be emitted with an empty COG field so downstream consumers receive
  // position and time data.
  it('emits RMC with empty COG when COG is unavailable and SOG=0', (done) => {
    const onEmit = (event, value) => {
      assert.equal(value, '$GPRMC,,A,0600.0000,N,00500.0000,E,0.0,,,,E*75')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMC')
    app.streambundle.getSelfStream('navigation.speedOverGround').push(0)
    // navigation.courseOverGroundTrue is never pushed
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 5, latitude: 6 })
  })

  it('emits RMC with empty COG when COG is unavailable and SOG>0', (done) => {
    const onEmit = (event, value) => {
      assert.equal(value, '$GPRMC,,A,0600.0000,N,00500.0000,E,1.9,,,,E*7D')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMC')
    app.streambundle.getSelfStream('navigation.speedOverGround').push('1')
    // navigation.courseOverGroundTrue is never pushed
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 5, latitude: 6 })
  })

  it('reports a negative magnetic variation as W', (done) => {
    // Negative radians must flip the hemisphere indicator to W and emit the
    // absolute value of the variation. Covers the magneticVariation < 0 branch
    // in RMC.js (the only remaining uncovered branch in that file).
    const onEmit = (event, value) => {
      assert.equal(
        value,
        '$GPRMC,,A,3749.6038,N,12225.2480,W,1.9,114.6,,180.0,W*79'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'RMC')
    app.streambundle.getSelfStream('navigation.speedOverGround').push('1')
    app.streambundle.getSelfStream('navigation.courseOverGroundTrue').push('2')
    app.streambundle
      .getSelfStream('navigation.magneticVariation')
      .push(-Math.PI)
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: -122.4208, latitude: 37.82673 })
  })
})
