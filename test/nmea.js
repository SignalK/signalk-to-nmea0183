const assert = require('assert')
const { toNmeaDegreesLatitude, toNmeaDegreesLongitude } = require('../nmea.js')

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
