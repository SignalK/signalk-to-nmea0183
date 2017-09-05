
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
const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "RMC - GPS recommended minimum",
      keys: [
        'navigation.datetime', 'navigation.speedOverGround', 'navigation.courseOverGroundTrue', 'navigation.position', 'navigation.magneticVariation'
      ],
      f: function(datetime8601, sog, cog, position, variation) {
        var datetime = new Date(datetime8601);
        var hours = ('00' + datetime.getHours()).slice(-2);
        var minutes = ('00' + datetime.getMinutes()).slice(-2);
        var seconds = ('00' + datetime.getSeconds()).slice(-2);
        var variationDir = 'E'
        if (variation < 0 ) {
          variationDir = 'W';
          variation = -variation;
        } else if ( variation > Math.PI/2) {
          variationDir = 'W';
          variation = variation-Math.PI;
        }
        return nmea.toSentence([
          '$INRMC', hours + minutes + seconds + '.020',
          'A',
          nmea.toNmeaDegrees(position.latitude),
          position.latitude < 0 ? 'S' : 'N',
          nmea.toNmeaDegrees(position.longitude),
          position.longitude < 0 ? 'W' : 'E',
          (sog * 1.94384).toFixed(2),
          nmea.radsToDeg(cog).toFixed(2),
          '0000',
          nmea.radsToDeg(variation).toFixed(2), 
          variationDir
        ]);
      }
  };
}
