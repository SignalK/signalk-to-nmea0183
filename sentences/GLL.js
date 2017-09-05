


 /*
Geographical position, latitude and longitude:
$IIGLL,IIII.II,a,yyyyy.yy,a,hhmmss.ss,A,A*hh
 I I I I I I_Statut, A= valid data, V= non valid data
 I I I I I_UTC time
 I I I___ I_Longitude, E/W
 I__I_Latidude, N/S 
*/
// NMEA0183 Encoder GLL   $IIGLL,5943.4970,N,2444.1983,E,200001.020,A*16

const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "GLL - Geographical position, latitude and longitude",
      keys: [
        'navigation.datetime', 'navigation.position'
      ],
      f: function gll(datetime8601, position) {
        var datetime = new Date(datetime8601);
        var hours = ('00' + datetime.getHours()).slice(-2);
        var minutes = ('00' + datetime.getMinutes()).slice(-2);
        var seconds = ('00' + datetime.getSeconds()).slice(-2);
        return nmea.toSentence([
          '$IIGLL',
          nmea.toNmeaDegrees(position.latitude),
          position.latitude < 0 ? 'S' : 'N',
          nmea.toNmeaDegrees(position.longitude),
          position.longitude < 0 ? 'W' : 'E',
          hours + minutes + seconds + '.020',
          'A'
        ]);
      }
    };
}
