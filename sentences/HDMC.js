// NMEA0183 Encoder HDMC   $IIHDM,212.2,M*21
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'HDM',
    title: 'HDM - Heading Magnetic, calculated from True',
    keys: ['navigation.headingTrue', 'navigation.magneticVariation'],
    f: function (headingTrue, magneticVariation) {
      var heading = headingTrue - magneticVariation
      if (heading > 2 * Math.PI) heading -= 2 * Math.PI
      else if (heading < 0) heading += 2 * Math.PI
      return nmea.toSentence([
        '$IIHDM',
        nmea.radsToDeg(heading).toFixed(1),
        'M'
      ])
    }
  }
}
