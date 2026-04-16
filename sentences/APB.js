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

      Example: $GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*82
    */
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'APB',
    title: 'APB - Autopilot info',
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.bearingTrackTrue',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.calcValues.bearingMagnetic',
      'navigation.course.nextPoint'
    ],
    // nextPoint defaults to {} so APB still fires when only calcValues are
    // available (the common case today). Once signalk-server populates
    // nextPoint.name (see SignalK/signalk-server#2595, SignalK/specification#676),
    // the waypoint identifier will flow through automatically.
    defaults: [undefined, undefined, undefined, undefined, {}],
    f: function (xte, originToDest, bearingTrue, bearingMagnetic, nextPoint) {
      var waypointId = (nextPoint && nextPoint.name) || ''
      return nmea.toSentence([
        '$IIAPB',
        'A',
        'A',
        Math.abs(nmea.mToNm(xte)).toFixed(3),
        xte > 0 ? 'L' : 'R',
        'N',
        'V',
        'V',
        nmea.radsToPositiveDeg(originToDest).toFixed(0),
        'T',
        waypointId,
        nmea.radsToPositiveDeg(bearingTrue).toFixed(0),
        'T',
        nmea.radsToPositiveDeg(bearingMagnetic).toFixed(0),
        'M'
      ])
    }
  }
}
