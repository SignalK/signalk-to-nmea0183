// NMEA0183 Encoder HDT   $IIHDT,200.1,T*21
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'HDT - Heading True',
    keys: ['navigation.headingTrue', 'navigation.headingMagnetic', 'navigation.magneticVariation' ],
    defaults: ['', '', ''],
    f: function (heading, headingMagnetic, magneticVariation) {
      if ( heading != '' ) {
        return nmea.toSentence([
          '$IIHDT',
          nmea.radsToDeg(heading).toFixed(1),
          'T'
        ])
      }
      else if ( headingMagnetic != '' &&  magneticVariation != '') {
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
}
