/*
Geographical position, latitude and longitude:
$--GLL,llll.ll,a,yyyyy.yy,a,hhmmss.ss,A*hh
       |       | |        | |          |_Status (A=valid, V=invalid)
       |       | |        | |_UTC time
       |       | |________|_Longitude, E/W
       |_______|_Latitude, N/S

Example: $GPGLL,5943.4970,N,02444.1983,E,200001.00,A*03
*/

const nmea = require('../nmea.js')
const { formatDatetime } = nmea
module.exports = function (app) {
  return {
    sentence: 'GLL',
    title: 'GLL - Geographical position, latitude and longitude',
    keys: ['navigation.datetime', 'navigation.position'],
    f: function gll(datetime8601, position) {
      const datetime = formatDatetime(datetime8601)
      if (position !== null) {
        return nmea.toSentence([
          '$GPGLL',
          nmea.toNmeaDegreesLatitude(position.latitude),
          nmea.toNmeaDegreesLongitude(position.longitude),
          datetime.time,
          'A'
        ])
      }
    }
  }
}
