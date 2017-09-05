// NMEA0183 Encoder HDM   $IIHDM,206.7,M*21  
const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "HDM - Heading Magnetic",
      keys: [
        'navigation.headingMagnetic'
      ],
      f: function mwv(heading) {
        return nmea.toSentence([
          '$IIHDM',
          nmea.radsToDeg(heading).toFixed(1),
          'M'
        ]);
      }
  };
}

