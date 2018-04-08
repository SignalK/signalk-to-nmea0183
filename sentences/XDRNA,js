/**
    $IIXDR,A,-0.7,D,PTCH,A,0.9,D,ROLL*0D
*/
// $IIXDR,A,-0.7,D,PTCH,A,0.9,D,ROLL*13

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'XDR (PTCH-ROLL) - Pitch and Roll',
    keys: ['navigation.attitude'],
    f: function (attitude) {
      return nmea.toSentence([
        '$IIXDR',
        'A',
        nmea.radsToDeg(attitude.pitch).toFixed(1),
        'D',
        'PTCH',
        'A',
        nmea.radsToDeg(attitude.roll).toFixed(1),
        'D',
        'ROLL'
      ])
    }
  }
}
