/**
$IIVWT,x.x,a,x.x,N,x.x,M,x.x,K*hh
 I I I I I I I__I_Wind speed in kph
 I I I I I__I_Wind speed in m/s
 I I I_ I_Wind speed in knots
 I__I_True wind angle from 0° to 180° , L=port, R=starboard
 */

// NMEA0183 Encoder VWT   $IIVWT,86.71,a,12.58,N,6.47,M,23.29,K*45

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'VWT - True wind speed relative to boat.',
    keys: ['environment.wind.angleTrue', 'environment.wind.speedTrue'],
    f: function (angleTrueWater, speedTrue) {
      return nmea.toSentence([
        '$IIVWT',
        nmea.radsToDeg(angleTrueWater).toFixed(2),
        'a',
        nmea.msToKnots(speedTrue).toFixed(2),
        'N',
        speedTrue.toFixed(2),
        'M',
        nmea.msToKM(speedTrue).toFixed(2),
        'K'
      ])
    }
  }
}
