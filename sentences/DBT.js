// NMEA0183 Encoder DBT   $IIDBT,103.0,f,31.38,M,17.2,F*2E
const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "DBT - Depth Below Transducer",
      keys: [
        'environment.depth.belowTransducer'
      ],
      f: function mwv(depth) {
        var feet = depth * 3.28084
        var fathoms = depth * 0.546807
        return nmea.toSentence([
          '$IIDBT',
          feet.toFixed(1),
          'f',
          depth.toFixed(2),
          'M',
          fathoms.toFixed(1),
          'F'
        ]);
      }
    };
};
