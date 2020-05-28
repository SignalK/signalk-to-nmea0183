/*
GNS - Fix data
       1         2       3 4        5 6    7  8   9   10  11  12  13
       |         |       | |        | |    |  |   |   |   |   |   |
$--GNS,hhmmss.ss,llll.ll,a,yyyyy.yy,a,c--c,xx,x.x,x.x,x.x,x.x,x.x*hh
Field Number:

1. UTC of position
2. Latitude
3. N or S (North or South)
4. Longitude
5. E or W (East or West)
6. Mode indicator (non-null)
7. Total number of satelites in use, 00-99
8. Horizontal Dilution of Precision, HDOP
9. Antenna altitude, meters, re:mean-sea-level(geoid).
10. Goeidal separation meters
11. Age of differential data
12. Differential reference station ID
13. Navigational status (optional) S = Safe C = Caution U = Unsafe V = Not valid for navigation
*/

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'GNS',
    title: 'GNS - Fix data',
    keys: [
      'navigation.datetime', 
      'navigation.position', 
      'navigation.gnss.satellites', 
      'navigation.gnss.horizontalDilution'],
    f: function (
      datetime8601, 
      position, 
      satellites,
      hdop) {
      var datetime = new Date(datetime8601)
      var hours = ('00' + datetime.getHours()).slice(-2)
      var minutes = ('00' + datetime.getMinutes()).slice(-2)
      var seconds = ('00' + datetime.getSeconds()).slice(-2)
      return nmea.toSentence([
        '$GPGNS',
        hours + minutes + seconds + '.00',
        nmea.toNmeaDegreesLatitude(position.latitude),
        nmea.toNmeaDegreesLongitude(position.longitude),
        'A',
        nmea.padd(satellites, 2),
        hdop,
        '',
        '',
        '',
        ''
      ])
    }
  }
}
