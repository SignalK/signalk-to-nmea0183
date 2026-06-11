/*
$--APB,A,A,x.x,a,N,A,A,x.x,a,c--c,x.x,a,x.x,a*hh

Field 1:  Status (A = OK, V = warning)
Field 2:  Status (A = OK, V = LORAN-C cycle-lock warning)
Field 3:  Cross Track Error magnitude (NM)
Field 4:  Direction to steer (L or R)
Field 5:  Cross-track units (N = nautical miles)
Field 6:  Status: A = Arrival Circle Entered
Field 7:  Status: A = Perpendicular passed at waypoint
Field 8:  Bearing origin to destination
Field 9:  M = Magnetic, T = True
Field 10: Destination Waypoint ID
Field 11: Bearing, present position to destination
Field 12: M = Magnetic, T = True
Field 13: Heading-to-steer to destination waypoint
Field 14: M = Magnetic, T = True

All three bearing pairs are reported Magnetic, computed from the True bearings
and `navigation.magneticVariation`. For autopilots that require True bearings
use APB-true.

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
    title: 'APB - Autopilot info (magnetic bearings)',
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.bearingTrackTrue',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.nextPoint',
      'navigation.magneticVariation'
    ],
    defaults: [null, null, null, null, 0],
    f: function apb(
      xte: number | null | undefined,
      originToDest: number | null | undefined,
      bearingTrue: number | null | undefined,
      nextPoint: NextPoint | null,
      magneticVariation: number | null | undefined
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
        isNaN(bearingTrue) ||
        magneticVariation === undefined ||
        magneticVariation === null ||
        isNaN(magneticVariation)
      ) {
        return undefined
      }

      const waypointId = generateWaypointName(nextPoint)
      const bearingOriginToDestMag = nmea
        .radsToPositiveDeg(originToDest - magneticVariation)
        .toFixed(0)
      const bearingToDestMag = nmea
        .radsToPositiveDeg(bearingTrue - magneticVariation)
        .toFixed(0)

      return nmea.toSentence([
        '$IIAPB',
        'A', // Status: A = OK, V = warning
        'A', // Status: A = OK, V = warning
        Math.abs(nmea.mToNm(xte)).toFixed(3), // Cross Track Error magnitude
        xte < 0 ? 'R' : 'L', // Align with XTE.ts: Default to 'L' at 0
        'N', // Cross-track units (N = nautical miles)
        'V', // Status: Arrival Circle Entered (V = Void)
        'V', // Status: Perpendicular passed at waypoint (V = Void)
        bearingOriginToDestMag, // Bearing origin to destination
        'M', // Magnetic
        waypointId,
        bearingToDestMag, // Bearing, present position to destination
        'M', // Magnetic
        bearingToDestMag, // Heading-to-steer to destination waypoint
        'M' // Magnetic
      ])
    }
  }
}
