const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    title: 'PNKEP,99 - Debug',
    keys: [
      'environment.wind.angleApparent',
      'environment.wind.speedApparent',
      'environment.wind.angleTrueWater',
      'environment.wind.speedTrue',
      'navigation.speedThroughWater',
      'performance.polarSpeed',
      'performance.polarSpeedRatio'
    ],
    f: function (
      angleApparent,
      speedApparent,
      angleTrueWater,
      speedTrue,
      speedThroughWater,
      polarSpeed,
      polarSpeedRatio
    ) {
      return nmea.toSentence([
        '$PNKEP',
        '99',
        nmea.radsToDeg(angleApparent),
        nmea.msToKnots(speedApparent),
        nmea.radsToDeg(angleTrueWater),
        nmea.msToKnots(speedTrue),
        nmea.msToKnots(speedThroughWater),
        nmea.msToKnots(polarSpeed),
        polarSpeedRatio
      ])
    }
  }
}
