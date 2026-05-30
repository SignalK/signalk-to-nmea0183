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
    defaults: [undefined, undefined, undefined, {}],
    f: function (
      xte: number,
      originToDest: number,
      bearingTrue: number,
      nextPoint: NextPoint | null | undefined
    ): string {
      const waypointId = generateWaypointName(nextPoint)
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
