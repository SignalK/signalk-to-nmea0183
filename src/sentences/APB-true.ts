/*
$--APB,A,A,x.x,a,N,A,A,x.x,a,c--c,x.x,a,x.x,a*hh

Same field layout as APB but all three bearing pairs are reported True. For
autopilots that require Magnetic bearings use APB.

Field 10 (Destination Waypoint ID) is nextPoint.name, forwarded by
generateWaypointName; it is emitted empty when the server sends no name.
*/
import * as nmea from '../nmea'
import { generateWaypointName } from '../waypointNameGenerator'
import type { NextPoint } from '../waypointNameGenerator'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'APB',
    title: 'APB - Autopilot info (true bearings)',
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.bearingTrackTrue',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.nextPoint'
    ],
    defaults: [null, null, null, null],
    f: function apbTrue(
      xte: number | null | undefined,
      originToDest: number | null | undefined,
      bearingTrue: number | null | undefined,
      nextPoint: NextPoint | null
    ): string | undefined {
      if (
        xte === undefined ||
        xte === null ||
        isNaN(xte) ||
        originToDest === undefined ||
        originToDest === null ||
        isNaN(originToDest) ||
        bearingTrue === undefined ||
        bearingTrue === null ||
        isNaN(bearingTrue)
      ) {
        return undefined
      }

      const waypointId = generateWaypointName(nextPoint)
      const bearingToDest = nmea.radsToPositiveDeg(bearingTrue).toFixed(0)

      return nmea.toSentence([
        '$IIAPB',
        'A', // Status: A = OK
        'A', // Cycle lock: A = OK
        Math.abs(nmea.mToNm(xte)).toFixed(3), // Cross Track Error magnitude
        xte < 0 ? 'R' : 'L', // Align with XTE.ts: Default to 'L' at 0
        'N', // XTE units (Nautical Miles)
        'V', // Status: Arrival Circle Entered
        'V', // Status: Perpendicular passed at waypoint
        nmea.radsToPositiveDeg(originToDest).toFixed(0),
        'T', // Bearing origin to destination (True)
        waypointId,
        bearingToDest,
        'T', // Bearing, present position to destination (True)
        bearingToDest,
        'T' // Heading-to-steer to destination waypoint (True)
      ])
    }
  }
}
