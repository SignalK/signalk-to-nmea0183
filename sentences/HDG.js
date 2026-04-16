/*
HDG - Heading, Deviation & Variation

       0   1   2 3   4
       |   |   | |   |
$--HDG,x.x,x.x,a,x.x,a*hh<CR><LF>

Field Number:
0 Magnetic Sensor heading in degrees
1 Magnetic Deviation, degrees
2 Magnetic Deviation direction, E = Easterly, W = Westerly
3 Magnetic Variation degrees
4 Magnetic Variation direction, E = Easterly, W = Westerly
*/

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'HDG',
    title: 'HDG - Heading, Deviation & Variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation'],
    defaults: [undefined, ''],
    f: function hdg(headingMagnetic, magneticVariation) {
      let magneticVariationDeg = ''
      let magneticVariationDir = ''
      if (magneticVariation !== '') {
        magneticVariationDir = 'E'
        if (magneticVariation < 0) {
          magneticVariationDir = 'W'
          magneticVariation = Math.abs(magneticVariation)
        }
        magneticVariationDeg = nmea.radsToDeg(magneticVariation).toFixed(2)
      }

      return nmea.toSentence([
        '$IIHDG',
        nmea.radsToDeg(headingMagnetic).toFixed(2),
        '',
        '',
        magneticVariationDeg,
        magneticVariationDir
      ])
    }
  }
}
