/**
$PNKEP,02,x.x*hh<CR><LF>
           \ Course (COG) on other tack from 0 to 359°
*/
// to verify
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'PNKEP,02 - Course (COG) on other tack from 0 to 359°',
    keys: ['performance.tackMagnetic'],
    f: function (tackMagnetic) {
      // console.log("Got tackMagnetic --------------------------------------------------");

      return nmea.toSentence([
        '$PNKEP',
        '02',
        nmea.radsToDeg(tackMagnetic).toFixed(2)
      ])
    }
  }
}
