const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

// Multi-input sentence with NO defaults. Exercises combineStreamsWith with
// multiple non-defaulted streams — both inputs are plain Buses, the helper's
// chained .combine path is what produces the Property the downstream
// .changes() needs.
describe('GLL', function () {
  it('emits position once both datetime and position have been pushed', (done) => {
    const onEmit = (event, value) => {
      // Format: $GPGLL,lat,N|S,lon,E|W,hhmmss.020,A*<checksum>
      // Position 47.5/8.5 → 4730.0000,N,00830.0000,E
      assert.match(
        value,
        /^\$GPGLL,4730\.0000,N,00830\.0000,E,\d{6}\.020,A\*[0-9A-F]{2}$/
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'GLL')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-01-01T12:34:56Z')
    app.streambundle
      .getSelfStream('navigation.position')
      .push({ longitude: 8.5, latitude: 47.5 })
  })
})
