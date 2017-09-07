/*
 Sentence 1
$PNKEP,01,x.x,N,x.x,K*hh
 | STW target in knots
| STW target in km/h
*/

// $PNKEP,01,3.69,N,6.83,K*69
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'PNKEP,01 - Target Polar speed',
    keys: ['performance.polarSpeed'],
    f: function (polarSpeed) {
      // console.log("Got Polar speed --------------------------------------------------");
      return nmea.toSentence([
        '$PNKEP',
        '01',
        nmea.msToKnots(polarSpeed).toFixed(2),
        'N',
        nmea.msToKM(polarSpeed).toFixed(2),
        'K'
      ])
    }
  }
}
