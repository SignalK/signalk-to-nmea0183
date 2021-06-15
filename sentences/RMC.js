/*
      RMC - Recommended Minimum Navigation Information
      This is one of the sentences commonly emitted by GPS units.

      12
      1         2 3       4 5        6  7   8   9    10 11|  13
      |         | |       | |        |  |   |   |    |  | |   |
      $--RMC,hhmmss.ss,A,llll.ll,a,yyyyy.yy,a,x.x,x.x,xxxx,x.x,a,m,*hh<CR><LF>
      Field Number:
      1 UTC Time
      2 Status, V=Navigation receiver warning A=Valid
      3 Latitude
      4 N or S
      5 Longitude
      6 E or W
      7 Speed over ground, knots
      8 Track made good, degrees true
      9 Date, ddmmyy
      10 Magnetic Variation, degrees
      11 E or W
      12 FAA mode indicator (NMEA 2.3 and later)
      13 Checksum
    */
// This needs to run faster that others.

// NMEA0183 Encoder RMC   $INRMC,200152.020,A,5943.2980,N,2444.1043,E,6.71,194.30,0000,8.1,E*40
const { toSentence, toNmeaDegreesLatitude, toNmeaDegreesLongitude, radsToDeg } = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'RMC',
    title: 'RMC - GPS recommended minimum',
    keys: [
      'navigation.datetime',
      'navigation.speedOverGround',
      'navigation.courseOverGroundTrue',
      'navigation.position',
      'navigation.magneticVariation'
    ],
    defaults: ['', undefined, undefined, undefined, ''],
    f: function (datetime8601, sog, cog, position, magneticVariation) {
      let time = ''
      let date = ''
      if (datetime8601.length > 0) {
        let datetime = new Date(datetime8601)
        let hours = ('00' + datetime.getUTCHours()).slice(-2)
        let minutes = ('00' + datetime.getUTCMinutes()).slice(-2)
        let seconds = ('00' + datetime.getUTCSeconds()).slice(-2)

        let day = ('00' + datetime.getUTCDate()).slice(-2)
        let month = ('00' + (datetime.getUTCMonth() + 1)).slice(-2) // months from 1-12
        let year = ('00' + datetime.getUTCFullYear()).slice(-2)
        time = hours + minutes + seconds
        date = day + month + year
      }
      var magneticVariationDir = 'E'
      if ( magneticVariation < 0 ) {
        magneticVariationDir = 'W';
        magneticVariation = magneticVariation * -1;
      }
      return toSentence([
        '$GPRMC',
        time,
        'A',
        toNmeaDegreesLatitude(position.latitude),
        toNmeaDegreesLongitude(position.longitude),
        (sog * 1.94384).toFixed(1),
        radsToDeg(cog).toFixed(1),
        date,
        typeof magneticVariation === 'number' ? radsToDeg(magneticVariation).toFixed(1) : magneticVariation,
        magneticVariationDir
      ])
    }
  }
}
