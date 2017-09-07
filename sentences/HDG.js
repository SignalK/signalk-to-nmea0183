/*
Heading magnetic:
$IIHDG,x.x,,,,*hh
 I_Heading magnetic
 */
// NMEA0183 Encoder HDG   $IIHDG,206.71,,,,*7B

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'HDG - Heading magnetic:.',
    keys: ['navigation.headingMagnetic'],
    f: function hdg (headingMagnetic) {
      return nmea.toSentence([
        '$IIHDG',
        nmea.radsToDeg(headingMagnetic).toFixed(2),
        '',
        '',
        '',
        ''
      ])
    }
  }
}
