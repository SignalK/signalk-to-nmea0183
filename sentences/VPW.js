/**
$IIVPW,x.x,N,x.x,M*hh
       I I I I__I_Surface speed in meters per second
       __I_Surface speed in knots
 */

// NMEA0183 Encoder VPW   $IIVHW,6.5,N,12.64,M*48

const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'VPW',
    title: 'VPW - Speed – Measured Parallel to Wind',
    keys: [
      'performance.velocityMadeGood'
    ],
    f: function vpw (velocityMadeGood) {
      return nmea.toSentence([
        '$IIVPW',
        nmea.msToKnots(velocityMadeGood).toFixed(2),
        'N',
        velocityMadeGood.toFixed(2),
        'M'
      ])
    }
  }
}
