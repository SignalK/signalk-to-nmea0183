/*
      APB with all bearings in Magnetic, computed from True bearings and
      magneticVariation.  Same field layout as APB.js but with M references.

      Enable this instead of APB for legacy autopilots (e.g. Raymarine
      SeaTalk 1) that require magnetic bearings.  Do not enable both APB
      and APB-magnetic at the same time.
    */
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'APB',
    title: 'APB - Autopilot info (magnetic bearings)',
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.bearingTrackTrue',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.nextPoint',
      'navigation.magneticVariation'
    ],
    defaults: [undefined, undefined, undefined, {}, undefined],
    f: function (xte, originToDest, bearingTrue, nextPoint, magneticVariation) {
      var waypointId = (nextPoint && nextPoint.name) || ''
      var brg1 = nmea.radsToPositiveDeg(
        nmea.fixAngle(originToDest - magneticVariation)
      )
      var brg2 = nmea.radsToPositiveDeg(
        nmea.fixAngle(bearingTrue - magneticVariation)
      )
      return nmea.toSentence([
        '$IIAPB',
        'A',
        'A',
        Math.abs(nmea.mToNm(xte)).toFixed(3),
        xte > 0 ? 'L' : 'R',
        'N',
        'V',
        'V',
        brg1.toFixed(0),
        'M',
        waypointId,
        brg2.toFixed(0),
        'M',
        brg2.toFixed(0),
        'M'
      ])
    }
  }
}
