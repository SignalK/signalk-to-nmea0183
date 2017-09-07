/**
Depth:
$IIDPT,x.x,x.x,,*hh
 I I_Sensor offset, >0 = surface transducer distance, >0 = keel transducer distance.
 I_Bottom transducer distance

 */
// NMEA0183 Encoder DPT   $IIDPT,69.21,-0.001*60
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'DPT - Depth',
    keys: [
      'environment.depth.belowTransducer',
      'environment.depth.transducerToKeel'
    ],
    f: function dpt (belowTransducer, transducerToKeel) {
      return nmea.toSentence([
        '$IIDPT',
        belowTransducer.toFixed(2),
        transducerToKeel.toFixed(3)
      ])
    }
  }
}
