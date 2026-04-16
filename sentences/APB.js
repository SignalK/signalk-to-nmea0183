/*
      ------------------------------------------------------------------------------
                                       13    15
      1 2 3   4 5 6 7 8   9 10   11  12|   14|
      | | |   | | | | |   | |    |   | |   | |
      $--APB,A,A,x.x,a,N,A,A,x.x,a,c--c,x.x,a,x.x,a*hh<CR><LF>
      ------------------------------------------------------------------------------

      Field Number:

      1. Status
      V = LORAN-C Blink or SNR warning
      V = general warning flag or other navigation systems when a reliable
      fix is not available
      2. Status
      V = Loran-C Cycle Lock warning flag
      A = OK or not used
      3. Cross Track Error Magnitude
      4. Direction to steer, L or R
      5. Cross Track Units, N = Nautical Miles
      6. Status
      A = Arrival Circle Entered
      7. Status
      A = Perpendicular passed at waypoint
      8. Bearing origin to destination
      9. M = Magnetic, T = True
      10. Destination Waypoint ID
      11. Bearing, present position to Destination
      12. M = Magnetic, T = True
      13. Heading to steer to destination waypoint
      14. M = Magnetic, T = True
      15. Checksum

      Bearing reference (T or M) is controlled by the APB_magneticBearings
      config option.  Default is True, matching pypilot and modern GPS
      autopilots.  Enable magnetic for legacy autopilots (e.g. Raymarine
      SeaTalk 1) that need magnetic bearings -- they also need variation
      from HDG or RMC to convert if this option is off.
    */
const nmea = require('../nmea.js')
module.exports = function (app, plugin) {
  return {
    sentence: 'APB',
    title: 'APB - Autopilot info',
    optionProperties: {
      APB_magneticBearings: {
        title: 'APB: use magnetic bearings (for legacy autopilots)',
        type: 'boolean',
        default: false
      }
    },
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.bearingTrackTrue',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.nextPoint',
      'navigation.magneticVariation'
    ],
    defaults: [undefined, undefined, undefined, {}, null],
    f: function (xte, originToDest, bearingTrue, nextPoint, magneticVariation) {
      var waypointId = (nextPoint && nextPoint.name) || ''
      var useMagnetic =
        plugin.options &&
        plugin.options.APB_magneticBearings &&
        typeof magneticVariation === 'number'
      var ref = useMagnetic ? 'M' : 'T'
      var brg1 = useMagnetic
        ? nmea.radsToPositiveDeg(
            nmea.fixAngle(originToDest - magneticVariation)
          )
        : nmea.radsToPositiveDeg(originToDest)
      var brg2 = useMagnetic
        ? nmea.radsToPositiveDeg(nmea.fixAngle(bearingTrue - magneticVariation))
        : nmea.radsToPositiveDeg(bearingTrue)
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
        ref,
        waypointId,
        brg2.toFixed(0),
        ref,
        brg2.toFixed(0),
        ref
      ])
    }
  }
}
