/**
$PNKEP,02,x.x*hh<CR><LF>
           \ Course (COG) on other tack from 0 to 359°
*/
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'PNKEP,02 - Course (COG) on other tack from 0 to 359°',
    keys: ['performance.tackMagnetic'],
    f: function (tackMagnetic) {
      return nmea.toSentence([
        '$PNKEP',
        '02',
        nmea.radsToPositiveDeg(tackMagnetic).toFixed(2)
      ])
    }
  }
}
