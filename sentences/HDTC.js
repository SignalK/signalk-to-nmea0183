// NMEA0183 Encoder HDT   $IIHDT,200.1,T*21
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'HDTC',
    title: 'HDT - Heading True calculated from magnetic heading and variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation'],
    f: function (headingMagnetic, magneticVariation) {
      var heading = headingMagnetic + magneticVariation
      return nmea.toSentence([
        '$IIHDT',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'T'
      ])
    }
  }
}
