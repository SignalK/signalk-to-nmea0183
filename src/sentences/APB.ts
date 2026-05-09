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

Waypoint ID (field 10) follows the BWC pattern: prefer `nextPoint.name`, then
synthesize "WP <pointIndex+1>" from `activeRoute.pointIndex`, else empty.
*/
import * as nmea from '../nmea'
import { generateWaypointName } from '../waypointNameGenerator'
import type { ActiveRoute, NextPoint } from '../waypointNameGenerator'
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
      'navigation.magneticVariation',
      'navigation.course.activeRoute'
    ],
    defaults: [undefined, undefined, undefined, {}, undefined, {}],
    f: function (
      xte: number,
      originToDest: number,
      bearingTrue: number,
      nextPoint: NextPoint | null | undefined,
      magneticVariation: number,
      activeRoute: ActiveRoute | null | undefined
    ): string {
      const waypointId = generateWaypointName(nextPoint, activeRoute)
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
