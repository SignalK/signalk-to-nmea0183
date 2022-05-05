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
// to verify
const nmea = require('../nmea.js')
module.exports = function (app) {
  return {
    sentence: 'APB',
    title: 'APB - Autopilot info',
    keys: [
      //'navigation.courseGreatCircle.crossTrackError',
      'navigation.course.calcValues.crossTrackError',
      //'navigation.courseGreatCircle.bearingTrackTrue',
      'navigation.course.calcValues.bearingTrackTrue',
      //'navigation.courseGreatCircle.nextPoint'
      'navigation.course.calcValues.nextPoint'
    ],
    f: function (xte, originToDest, nextPoint) {
      console.log(`**APB**`)
      return nmea.toSentence([
        '$IIAPB',
        'A',
        'A',
        Math.abs(xte),
        xte > 0 ? 'L' : 'R',
        'M',
        'V',
        'V',
        nmea.radsToDeg(originToDest).toFixed(0),
        'T',
        '00',
        nmea.radsToDeg(nextPoint.bearingTrue).toFixed(0),
        'T',
        nmea.radsToDeg(nextPoint.bearingMagnetic).toFixed(0),
        'M'
      ])
    }
  }
}
