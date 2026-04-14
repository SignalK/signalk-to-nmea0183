const assert = require('assert')
const {
  formatDatetime,
  toNmeaDegreesLatitude,
  toNmeaDegreesLongitude
} = require('../nmea.js')

describe('nmea', function () {
  describe('toNmeaDegreesLatitude()', function () {
    it('convert correctly to Degrees and Decimal Minutes in format DDMM.MMMM', function () {
      assert.equal(toNmeaDegreesLatitude(0), '0000.0000,N')
      assert.equal(toNmeaDegreesLatitude(0.016668333333333334), '0001.0001,N')
      assert.equal(toNmeaDegreesLatitude(-1.016668333333333334), '0101.0001,S')
      assert.equal(toNmeaDegreesLatitude(1.016668333333333334), '0101.0001,N')
      assert.throws(
        function () {
          toNmeaDegreesLatitude(-99.999)
        },
        Error,
        'expected Error'
      )
      assert.throws(
        function () {
          toNmeaDegreesLatitude(100)
        },
        Error,
        'expected Error'
      )
      assert.throws(
        function () {
          toNmeaDegreesLatitude('23.333')
        },
        Error,
        'expected Error'
      )
      assert.throws(
        function () {
          toNmeaDegreesLatitude(undefined)
        },
        Error,
        'expected Error'
      )
      assert.throws(
        function () {
          toNmeaDegreesLatitude('hello world')
        },
        Error,
        'expected Error'
      )
    })
  })
  describe('toNmeaDegreesLongitude()', function () {
    it('convert correctly to Degrees and Decimal Minutes in format DDDMM.MMMM', function () {
      assert.equal(toNmeaDegreesLongitude(0), '00000.0000,E')
      assert.equal(toNmeaDegreesLongitude(0.016668333333333334), '00001.0001,E')
      assert.equal(
        toNmeaDegreesLongitude(-1.016668333333333334),
        '00101.0001,W'
      )
      assert.equal(toNmeaDegreesLongitude(1.016668333333333334), '00101.0001,E')
      assert.equal(toNmeaDegreesLongitude(-99.9999983333333333), '09959.9999,W')
      assert.equal(toNmeaDegreesLongitude(-122.4208), '12225.2480,W')
      assert.throws(
        function () {
          toNmeaDegreesLongitude(-181)
        },
        Error,
        'expected Error'
      )
      assert.throws(
        function () {
          toNmeaDegreesLongitude(197)
        },
        Error,
        'expected Error'
      )
      assert.throws(
        function () {
          toNmeaDegreesLongitude('-122')
        },
        Error,
        'expected Error'
      )
      assert.throws(
        function () {
          toNmeaDegreesLongitude(undefined)
        },
        Error,
        'expected Error'
      )
      assert.throws(
        function () {
          toNmeaDegreesLongitude('hello world')
        },
        Error,
        'expected Error'
      )
    })
  })
  describe('formatDatetime()', function () {
    it('formats ISO datetime strings to NMEA0183 format', function () {
      assert.deepEqual(formatDatetime('2025-04-27T12:34:56Z'), {
        date: '270425',
        day: '27',
        hours: '12',
        minutes: '34',
        month: '04',
        seconds: '56',
        centiseconds: '00',
        time: '123456.00',
        year: '2025'
      })
    })

    it('handles timezones with +02:00 offset', function () {
      assert.deepEqual(formatDatetime('2025-04-27T14:34:56+02:00'), {
        date: '270425',
        day: '27',
        hours: '12',
        minutes: '34',
        month: '04',
        seconds: '56',
        centiseconds: '00',
        time: '123456.00',
        year: '2025'
      })
    })

    it('handles timezones with -05:00 offset', function () {
      assert.deepEqual(formatDatetime('2025-04-27T07:34:56-05:00'), {
        date: '270425',
        day: '27',
        hours: '12',
        minutes: '34',
        month: '04',
        seconds: '56',
        centiseconds: '00',
        time: '123456.00',
        year: '2025'
      })
    })

    it('handles timezones with +00:00 offset (UTC)', function () {
      assert.deepEqual(formatDatetime('2025-04-27T12:34:56+00:00'), {
        date: '270425',
        day: '27',
        hours: '12',
        minutes: '34',
        month: '04',
        seconds: '56',
        centiseconds: '00',
        time: '123456.00',
        year: '2025'
      })
    })

    it('preserves fractional seconds as centiseconds', function () {
      // 789ms = 78 centiseconds (truncated, not rounded)
      assert.deepEqual(formatDatetime('2025-04-27T12:34:56.789Z'), {
        date: '270425',
        day: '27',
        hours: '12',
        minutes: '34',
        month: '04',
        seconds: '56',
        centiseconds: '78',
        time: '123456.78',
        year: '2025'
      })
    })

    it('pads midnight correctly', function () {
      assert.deepEqual(formatDatetime('2025-01-01T00:00:00Z'), {
        date: '010125',
        day: '01',
        hours: '00',
        minutes: '00',
        month: '01',
        seconds: '00',
        centiseconds: '00',
        time: '000000.00',
        year: '2025'
      })
    })

    it('handles day-crossing timezone offset', function () {
      // 2025-04-28T01:00:00+05:00 = 2025-04-27T20:00:00Z
      var result = formatDatetime('2025-04-28T01:00:00+05:00')
      assert.equal(result.day, '27')
      assert.equal(result.hours, '20')
      assert.equal(result.date, '270425')
    })

    it('handles year boundary', function () {
      // Dec 31 at 23:59:59 UTC
      var result = formatDatetime('2025-12-31T23:59:59Z')
      assert.equal(result.day, '31')
      assert.equal(result.month, '12')
      assert.equal(result.year, '2025')
      assert.equal(result.date, '311225')
    })

    it('returns empty fields for invalid input', function () {
      const empty = {
        date: '',
        day: '',
        hours: '',
        minutes: '',
        month: '',
        seconds: '',
        centiseconds: '',
        time: '',
        year: ''
      }
      assert.deepEqual(formatDatetime(1), empty)
      assert.deepEqual(formatDatetime(null), empty)
      assert.deepEqual(formatDatetime(undefined), empty)
      assert.deepEqual(formatDatetime(''), empty)
    })

    it('returns empty fields for unparseable date strings', function () {
      // Non-empty strings that Date() cannot parse must not leak NaN into the
      // output sentence. Covers typos, garbage, and out-of-range components.
      const empty = {
        date: '',
        day: '',
        hours: '',
        minutes: '',
        month: '',
        seconds: '',
        centiseconds: '',
        time: '',
        year: ''
      }
      assert.deepEqual(formatDatetime('not-a-date'), empty)
      assert.deepEqual(formatDatetime('hello world'), empty)
      assert.deepEqual(formatDatetime('2025-13-45T99:99:99Z'), empty)
    })
  })
})
