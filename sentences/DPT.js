/**
DPT - Depth of Water
        1   2   3   4
        |   |   |   |
 $--DPT,x.x,x.x,x.x*hh<CR><LF>
Field Number:
1. Water depth relative to transducer, meters
2. Offset from transducer, meters positive means distance from transducer to water line negative means distance from transducer to keel
3. Maximum range scale in use (NMEA 3.0 and above)
4. Checksum
 */
// NMEA0183 Encoder DPT   $IIDPT,69.21,-0.001*60
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'DPT',
    title: 'DPT - Depth',
    keys: [
      'environment.depth.belowTransducer',
      'environment.depth.transducerToKeel'
    ],
    f: function dpt (belowTransducer, transducerToKeel) {
      return nmea.toSentence([
        '$IIDPT',
        belowTransducer.toFixed(2),
        (-Math.abs(transducerToKeel)).toFixed(3)
      ])
    }
  }
}
