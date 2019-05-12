/**
Rudder Sensor Angle:
$--RSA,x.x,A,x.x,A*hh
Field Number:
1 Starboard (or single) rudder sensor, "-" means Turn To Port
2 Status, A means data is valid
3 Port rudder sensor
4 Status, A means data is valid
5 Checksum
 */

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'RSA - Rudder Sensor Angle',
    keys: ['steering.rudderAngle'],
    f: function (rudderAngle) {
      return nmea.toSentence([
        '$IIRSA',
        nmea.radsToDeg(rudderAngle).toFixed(2),
        'A',
        '',
        ''
      ])
    }
  }
}
