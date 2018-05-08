// NMEA0183 Encoder HDT   $IIHDT,200.1,T*21
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'HDT - Heading True calculated from magnetic heading and variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation' ],
    f: function (headingMagnetic, magneticVariation) {
      heading = headingMagnetic + magneticVariation;
      if (heading > 2 * Math.PI) heading -= 2 * Math.PI
      else if (heading < 0 ) heading += 2 * Math.PI
      return nmea.toSentence([
        '$IIHDT',
        nmea.radsToDeg(heading).toFixed(1),
        'T'
      ])
    }
  }
}
