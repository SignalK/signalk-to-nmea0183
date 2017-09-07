/**
True wind direction and speed:
$IIMWD,x.x,T,x.x,M,x.x,N,x.x,M*hh
 I I I I I I I__I_Wind speed in m/s
 I I I I I__I_ Wind speed in knots
 I I I__I_Wind direction from 0° to 359° magnetic
 I__I_Wind direction from 0° to 359° true

 speed Might be ground speed.
 */

// NMEA0183 Encoder MWD   $IIMWD,279.07,T,90.97,M,9.75,N,5.02,M*74
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'MWD - Wind relative to North, speed might be ground speed.',
    keys: [
      'environment.wind.directionTrue',
      'navigation.magneticVariation',
      'environment.wind.speedTrue'
    ],
    f: function (directionTrue, magneticVariation, speedTrue) {
      var directionMagnetic = nmea.fixAngle(directionTrue - magneticVariation)
      return nmea.toSentence([
        '$IIMWD',
        nmea.radsToDeg(directionTrue).toFixed(2),
        'T',
        nmea.radsToDeg(directionMagnetic).toFixed(2),
        'M',
        nmea.msToKnots(speedTrue).toFixed(2),
        'N',
        speedTrue.toFixed(2),
        'M'
      ])
    }
  }
}
