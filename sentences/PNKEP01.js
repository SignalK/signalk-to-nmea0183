
/*
Man over board:
$TRWPL,,,,,MOB,*hh
 I_Name of the WP
$PMLR,05,01,02,037,*hh (this phrase launches the “MOB” procedure on compatible MLR GPS).
 I I I I_Checksum
 I I I_Data bytes (02= MOB key of the GPS)
 I I_Number of data bytes (01 = only 1 data byte)
 I_Type of phrase (05 = simulating key pressing on the keyboard) 
*/
/*
 Sentence 1
$PNKEP,01,x.x,N,x.x,K*hh
 | STW target in knots
| STW target in km/h
*/

// $PNKEP,01,3.69,N,6.83,K*69
const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "PNKEP,01 - Target Polar speed",
      keys: [
        'performance.polarSpeed'
      ],
      f: function pnkep1(polarSpeed) {
        //console.log("Got Polar speed --------------------------------------------------");
        return nmea.toSentence([
          '$PNKEP',
          '01',
          nmea.msToKnots(polarSpeed).toFixed(2),
          'N',          
          nmea.msToKM(polarSpeed).toFixed(2),
          'K'
        ]);
      }
  };
}
