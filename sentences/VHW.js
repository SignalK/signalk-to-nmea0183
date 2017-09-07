/**
$IIVHW,x .x,T,x.x,M,x.x,N,x.x,K*hh
       I I I I I I I__I_Surface speed in kph
       I I I I I__I_Surface speed in knots
       I I I__I_Magnetic compass heading
       I__I_True compass heading
 */

// NMEA0183 Encoder VHW   $IIVHW,201.1,T,209.2,M,6.5,N,12.0,K*6E

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'VHW - Speed and direction',
    keys: [
      'navigation.headingTrue',
      'navigation.magneticVariation',
      'navigation.speedThroughWater'
    ],
    f: function vhw (headingTrue, magneticVariation, speedThroughWater) {
      var headingMagnetic = headingTrue + magneticVariation
      if (headingMagnetic > Math.PI * 2) {
        headingMagnetic -= Math.PI * 2
      }
      if (headingMagnetic < 0) {
        headingMagnetic += Math.PI * 2
      }
      return nmea.toSentence([
        '$IIVHW',
        nmea.radsToDeg(headingTrue).toFixed(1),
        'T',
        nmea.radsToDeg(headingMagnetic).toFixed(1),
        'M',
        nmea.msToKnots(speedThroughWater).toFixed(2),
        'N',
        nmea.msToKM(speedThroughWater).toFixed(2),
        'K'
      ])
    }
  }
}
