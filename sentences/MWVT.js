

//NMEA0183 Encoder MWVTCB   $INMWV,61.44,T,6.04,M,A*0A

const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "MWV - True Wind heading and speed",
      keys: [
        'environment.wind.angleTrue', 'environment.wind.speedTrue'
      ],

      f: function mwv(angle, speed) {
        return nmea.toSentence([
          '$INMWV',
          nmea.radsToDeg(angle).toFixed(2),
          'T',
          speed.toFixed(2),
          'M',
          'A'
        ]);
      }
  };
}
