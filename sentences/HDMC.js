// NMEA0183 Encoder HDMC   $IIHDM,212.2,M*21
const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "HDM - Heading Magnetic, calculated from True",
      keys: [
        'navigation.headingTrue', 'navigation.magneticVariation'
      ],
      f: function mwv(headingTrue, magneticVariation) {
        var heading = headingTrue + magneticVariation;
        return nmea.toSentence([
          '$IIHDM',
          nmea.radsToDeg(heading).toFixed(1),
          'M'
        ]);
      }
  };
}
