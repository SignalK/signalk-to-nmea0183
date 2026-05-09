/*
$--APB,A,A,x.x,a,N,A,A,x.x,a,c--c,x.x,a,x.x,a*hh

Same field layout as APB but all three bearing pairs are reported True. For
autopilots that require Magnetic bearings use APB.

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
    title: 'APB - Autopilot info (true bearings)',
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.calcValues.bearingTrackTrue',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.nextPoint',
      'navigation.course.activeRoute'
    ],
    defaults: [undefined, undefined, undefined, {}, {}],
    f: function (
      xte: number,
      originToDest: number,
      bearingTrue: number,
      nextPoint: NextPoint | null | undefined,
      activeRoute: ActiveRoute | null | undefined
    ): string {
      const waypointId = generateWaypointName(nextPoint, activeRoute)
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
        nmea.radsToPositiveDeg(bearingTrue).toFixed(0),
        'T'
      ])
    }
  }
}
