/**
Depth:
$IIDPT,x.x,x.x,,*hh
 I I_Sensor offset, >0 = surface transducer distance, >0 = keel transducer distance.
 I_From Surface To Transduder

 */
// NMEA0183 Encoder DPT   $IIDPT,69.21,-0.001*60
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
