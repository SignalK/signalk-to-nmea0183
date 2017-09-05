
/*
Sentence 3
$PNKEP,03,x.x,x.x,x.x*hh
        | optimum angle from 0 to 359°
              | VMG efficiency up/down wind in %
                  | Polar efficiency in %

*/

// to verify
const nmea = require('../nmea.js');
module.exports = function(app) {
  return {
      title: "PNKEP,03 - Polar and VMG, and optimum angle.",
      keys: [
        'performance.targetAngle', 'performance.polarVelocityMadeGoodRatio',  'performance.polarSpeedRatio'
      ],
      f: function pnkep2(targetAngle, polarVelocityMadeGoodRatio, polarSpeedRatio) {
        return nmea.toSentence([
          '$PNKEP',
          '03',
          nmea.radsToDeg(targetAngle).toFixed(2),
          (polarVelocityMadeGoodRatio*100.0).toFixed(2),
          (polarSpeedRatio*100.0).toFixed(2)
        ]);
      }
  };
}