

/**
    $IIXDR,P,1.02481,B,Barometer*0D
*/
// $IIXDR,P,1.0050,B,Barometer*13

const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "XDR (Barometer) - Atomospheric Pressure",
      keys: [
        'environment.outside.pressure'
      ],
      f: function xdrbaro(pressure) {
        return nmea.toSentence([
          '$IIXDR',
          'P',
          (pressure/1.0E5).toFixed(4),
          'B',
          'Barometer'
        ]);
      }
  };
}
