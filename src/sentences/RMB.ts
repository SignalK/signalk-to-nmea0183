/*
Heading and distance to waypoint:
                                                             14
        1 2   3 4    5    6       7 8        9 10  11  12  13|  15
        | |   | |    |    |       | |        | |   |   |   | |   |
 $--RMB,A,x.x,a,c--c,c--c,llll.ll,a,yyyyy.yy,a,x.x,x.x,x.x,A,m,*hh<CR><LF>
------------------------------------------------------------------------------

Field Number:

1. Status, A= Active, V = Void
2. Cross Track error - nautical miles
3. Direction to Steer, Left or Right
4. TO Waypoint ID
5. FROM Waypoint ID
6. Destination Waypoint Latitude
7. N or S
8. Destination Waypoint Longitude
9. E or W
10. Range to destination in nautical miles
11. Bearing to destination in degrees True
12. Destination closing velocity in knots
13. Arrival Status, A = Arrival Circle Entered
14. FAA mode indicator (NMEA 2.3 and later)
15. Checksum

Field 4 (TO Waypoint ID) comes from nextPoint.name and field 5 (FROM) from
previousPoint.name, both forwarded by generateWaypointName. A server that names
its course points fills these (e.g. "WP2"/"WP1" along a route, or "DP" for a
go-to position with "VP" as the origin); otherwise they are emitted empty.
*/
import * as nmea from '../nmea'
import { generateWaypointName } from '../waypointNameGenerator'
import type { NextPoint } from '../waypointNameGenerator'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

type PreviousPoint = NextPoint

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'RMB',
    title: 'RMB - Heading and distance to waypoint',
    keys: [
      'navigation.course.calcValues.crossTrackError',
      'navigation.course.nextPoint',
      'navigation.course.calcValues.distance',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.calcValues.velocityMadeGood',
      'navigation.course.previousPoint'
    ],
    defaults: [undefined, {}, undefined, undefined, undefined, {}],
    f: function (
      crossTrackError: number,
      wp: NextPoint,
      wpDistance: number,
      bearingTrue: number,
      vmg: number,
      prevWp: PreviousPoint | null | undefined
    ): string | undefined {
      const wpLat = wp?.position?.latitude
      const wpLon = wp?.position?.longitude
      if (typeof wpLat !== 'number' || typeof wpLon !== 'number') {
        return undefined
      }
      const destinationId = generateWaypointName(wp)
      const originId = generateWaypointName(prevWp)
      return nmea.toSentence([
        '$IIRMB',
        'A',
        Math.abs(nmea.mToNm(crossTrackError)).toFixed(3),
        crossTrackError < 0 ? 'R' : 'L',
        destinationId,
        originId,
        nmea.toNmeaDegreesLatitude(wpLat),
        nmea.toNmeaDegreesLongitude(wpLon),
        Math.abs(nmea.mToNm(wpDistance)).toFixed(2),
        nmea.radsToPositiveDeg(bearingTrue).toFixed(0),
        nmea.msToKnots(vmg).toFixed(2),
        '',
        'A'
      ])
    }
  }
}
