/**
DPT - Depth of Water
$--DPT,x.x,x.x*hh
 Fields:
 - Water depth relative to transducer, meters
 - Offset from transducer, meters. Positive means distance from transducer to water line, negative means distance from transducer to keel
 - Checksum
 */
// NMEA0183 Encoder DPT   $IIDPT,9.2,1.1*4B
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'DPT',
    title: 'DPT - Depth at Surface (using surfaceToTransducer)',
    keys: [
      'environment.depth.belowTransducer',
      'environment.depth.surfaceToTransducer'
    ],
    f: function dpt (belowTransducer, surfaceToTransducer) {
      return nmea.toSentence([
        '$IIDPT',
        belowTransducer.toFixed(2),
        surfaceToTransducer.toFixed(3)
      ])
    }
  }
}
