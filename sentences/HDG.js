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
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation' ],
    defaults: [undefined, ''],
    f: function hdg (headingMagnetic, magneticVariation) {
      var magneticVariationDir = '';
      if ( magneticVariation != '' ) {
        magneticVariationDir = 'E';
        if ( headingMagnetic < 0 ) {
          magneticVariationDir = 'W';
          magneticVariation =   Math.abs(magneticVariation);
        }
        magneticVariation = nmea.radsToDeg(magneticVariation).toFixed(2);
      }

      return nmea.toSentence([
        '$IIHDG',
        nmea.radsToDeg(headingMagnetic).toFixed(2),
        magneticVariation,
        magneticVariationDir,
        '',
        ''
      ])
    }
  }
}
