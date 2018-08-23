/*PSILCD1 - Proprietary polar boat speed sentence for Silva => Nexus => Garmin displays


           0     1     2
           |     |     |
 $PSILCD1,XX.xx,YY.yy,*hh<CR><LF>
Field Number:
0 Polar Boat speed in knots
1 Target wind angle
2 Checksum
*/

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'PSILCD1 - Send polar speed and target wind angle to Silva/Nexus/Garmin displays',
    keys: ['performance.polarSpeed', 'performance.targetAngle'],
    f: function (polarSpeed, targetAngle) {
      return nmea.toSentence(['$PSILCD1', nmea.msToKnots(polarSpeed).toFixed(2), nmea.radsToDeg(targetAngle).toFixed(2)])
    }
  }
}
