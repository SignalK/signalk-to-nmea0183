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

      All three bearing pairs use Magnetic, computed from True bearings
      and magneticVariation.  For autopilots that require True bearings
      use APB-true instead.

      Example: $GPAPB,A,A,0.10,R,N,V,V,011,M,DEST,011,M,011,M*82
    */
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

interface NextPoint {
  name?: string
}

export default function (_app: SignalKApp): SentenceEncoder {
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
    f: function (
      xte: number,
      originToDest: number,
      bearingTrue: number,
      nextPoint: NextPoint | null | undefined,
      magneticVariation: number
    ): string {
      const waypointId = (nextPoint && nextPoint.name) || ''
      const bearingOriginToDestMag = nmea.radsToPositiveDeg(
        nmea.fixAngle(originToDest - magneticVariation)
      )
      const bearingToDestMag = nmea.radsToPositiveDeg(
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
        bearingOriginToDestMag.toFixed(0),
        'M',
        waypointId,
        bearingToDestMag.toFixed(0),
        'M',
        bearingToDestMag.toFixed(0),
        'M'
      ])
    }
  }
}
