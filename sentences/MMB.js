

/*
Barometer:
$IIMMB,x.x,I,x.x,B*hh
 I I I__I_Atmospheric pressure in bars
 I_ I_Atmospheric pressure in inches of mercury
 */
// $IIMMB,29.6776,I,1.00,B*73
 const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "MMB - Environment outside pressure",
      keys: [
        'environment.outside.pressure'
      ],
      f: function hdg(pressure) {
        //console.log("Got MMB--------------------------");
        return nmea.toSentence([
          '$IIMMB',
          (pressure/3386.39).toFixed(4),
          'I',
          (pressure/1.0E5).toFixed(4),
          'B'
        ]);
      }
  };
}