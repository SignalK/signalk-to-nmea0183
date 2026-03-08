const assert = require('assert');
const { formatDatetime, toNmeaDegreesLatitude, toNmeaDegreesLongitude } = require('../nmea.js');

describe('nmea', function () {
  describe('toNmeaDegreesLatitude()', function(){
    it('convert correctly to Degrees and Decimal Minutes in format DDMM.MMMM', function(){
      assert.equal(toNmeaDegreesLatitude(0),'0000.0000,N')
      assert.equal(toNmeaDegreesLatitude(0.016668333333333334),'0001.0001,N')
      assert.equal(toNmeaDegreesLatitude(-1.016668333333333334),'0101.0001,S')
      assert.equal(toNmeaDegreesLatitude(1.016668333333333334),'0101.0001,N')
      assert.throws(function(){toNmeaDegreesLatitude(-99.999)}, Error, 'expected Error')
      assert.throws(function(){toNmeaDegreesLatitude(100)}, Error, 'expected Error')
      assert.throws(function(){toNmeaDegreesLatitude('23.333')}, Error, 'expected Error')
      assert.throws(function(){toNmeaDegreesLatitude(undefined)}, Error, 'expected Error')
      assert.throws(function(){toNmeaDegreesLatitude('hello world')}, Error, 'expected Error')
    })
  })
  describe('toNmeaDegreesLongitude()', function(){
    it('convert correctly to Degrees and Decimal Minutes in format DDDMM.MMMM', function(){
      assert.equal(toNmeaDegreesLongitude(0),'00000.0000,E')
      assert.equal(toNmeaDegreesLongitude(0.016668333333333334),'00001.0001,E')
      assert.equal(toNmeaDegreesLongitude(-1.016668333333333334),'00101.0001,W')
      assert.equal(toNmeaDegreesLongitude(1.016668333333333334),'00101.0001,E')
      assert.equal(toNmeaDegreesLongitude(-99.9999983333333333),'09959.9999,W')
      assert.equal(toNmeaDegreesLongitude(-122.4208),'12225.2480,W')
      assert.throws(function(){toNmeaDegreesLongitude(-181)}, Error, 'expected Error')
      assert.throws(function(){toNmeaDegreesLongitude(197)}, Error, 'expected Error')
      assert.throws(function(){toNmeaDegreesLongitude('-122')}, Error, 'expected Error')
      assert.throws(function(){toNmeaDegreesLongitude(undefined)}, Error, 'expected Error')
      assert.throws(function(){toNmeaDegreesLongitude('hello world')}, Error, 'expected Error')
    })
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
        time: '123456',
        year: '25'
      });
    });

    it('handles timezones with +02:00 offset', function () {
      assert.deepEqual(formatDatetime('2025-04-27T14:34:56+02:00'), {
        date: '270425',
        day: '27',
        hours: '12',
        minutes: '34',
        month: '04',
        seconds: '56',
        time: '123456',
        year: '25'
      });
    });

    it('handles timezones with -05:00 offset', function () {
      assert.deepEqual(formatDatetime('2025-04-27T07:34:56-05:00'), {
        date: '270425',
        day: '27',
        hours: '12',
        minutes: '34',
        month: '04',
        seconds: '56',
        time: '123456',
        year: '25'
      });
    });

    it('handles timezones with +00:00 offset (UTC)', function () {
      assert.deepEqual(formatDatetime('2025-04-27T12:34:56+00:00'), {
        date: '270425',
        day: '27',
        hours: '12',
        minutes: '34',
        month: '04',
        seconds: '56',
        time: '123456',
        year: '25'
      });
    });

    it('returns empty', function () {
      assert.deepEqual(formatDatetime(1), {
        date: '',
        day: '',
        hours: '',
        minutes: '',
        month: '',
        seconds: '',
        time: '',
        year: ''
      });
      assert.deepEqual(formatDatetime(null), {
        date: '',
        day: '',
        hours: '',
        minutes: '',
        month: '',
        seconds: '',
        time: '',
        year: ''
      });
      assert.deepEqual(formatDatetime(undefined), {
        date: '',
        day: '',
        hours: '',
        minutes: '',
        month: '',
        seconds: '',
        time: '',
        year: ''
      });
    });
  });
});
