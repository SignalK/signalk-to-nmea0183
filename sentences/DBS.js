// to verify
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'DBS',
    title: 'DBS - Depth Below Surface',
    keys: ['environment.depth.belowSurface'],
    f: function mwv (depth) {
      var feet = depth * 3.28084
      var fathoms = depth * 0.546807
      return nmea.toSentence([
        '$IIDBS',
        feet.toFixed(1),
        'f',
        depth.toFixed(2),
        'M',
        fathoms.toFixed(1),
        'F'
      ])
    }
  }
}
