const assert = require('assert')

const { createAppWithPlugin } = require('./testutil')

describe('ZDA', function () {
  it('produces correct sentence with UTC datetime', (done) => {
    const onEmit = (event, value) => {
      assert.equal(value, '$IIZDA,200006.00,15,08,2014,,*7E')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'ZDA')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2014-08-15T20:00:06Z')
  })

  it('uses UTC time for timezone-offset input', (done) => {
    const onEmit = (event, value) => {
      // 14:34:56+02:00 = 12:34:56 UTC, date stays 27 April 2025
      assert.equal(value, '$IIZDA,123456.00,27,04,2025,,*72')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'ZDA')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-04-27T14:34:56+02:00')
  })

  it('handles day-crossing timezone offset', (done) => {
    const onEmit = (event, value) => {
      assert.equal(value, '$IIZDA,200000.00,27,04,2025,,*77')
      done()
    }
    const app = createAppWithPlugin(onEmit, 'ZDA')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-04-28T01:00:00+05:00')
  })

  it('uses full 4-digit year', (done) => {
    const onEmit = (event, value) => {
      // Year must be 4 digits per ZDA spec (xxxx)
      assert.ok(
        value.includes(',2025,'),
        'expected 4-digit year in ZDA sentence'
      )
      done()
    }
    const app = createAppWithPlugin(onEmit, 'ZDA')
    app.streambundle
      .getSelfStream('navigation.datetime')
      .push('2025-04-27T12:34:56Z')
  })
})
