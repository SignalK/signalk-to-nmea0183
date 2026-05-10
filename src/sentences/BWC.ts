/*
Bearing and Distance to Waypoint:
                                                          12  13
     1       2       3 4        5 6         7 8    9 10 11|   |
     |       |       | |        | |         | |    | |  | |   |
$--BWC,hhmmss.ss,llll.ll,a,yyyyy.yy,a,x.x,T,x.x,M,x.x,N,c--c,*hh<CR><LF>

Field Number:
1. UTC time of fix
2. Latitude of waypoint
3. N or S
4. Longitude of waypoint
5. E or W
6. Bearing to waypoint, degrees true
7. T indicating true bearing
8. Bearing to waypoint, degrees magnetic (empty if unknown)
9. M indicating magnetic (empty if field 8 is empty)
10. Distance to waypoint, Nautical miles
11. N indicating Nautical miles
12. Waypoint ID
13. Checksum

Signal K source paths verified by subscribing to the live deltastream of a
running signalk-server with an active route:

  - navigation.datetime                            -> ISO datetime
  - navigation.course.nextPoint                    -> {type, position, [name]}
  - navigation.course.activeRoute                  -> {href, name, pointIndex, pointTotal}
  - navigation.course.calcValues.bearingTrue       -> bearing to waypoint (rad)
  - navigation.course.calcValues.bearingMagnetic   -> bearing to waypoint, magnetic (rad, optional)
  - navigation.course.calcValues.distance          -> distance to waypoint (m)

`navigation.course.nextPoint` is the canonical waypoint path: it is published
as a composite delta containing both `type` (RoutePoint / Location /
VesselPosition) and `position` regardless of the active calculation method.
The parallel `navigation.courseGreatCircle.nextPoint` is silent on the
deltastream (only its leaf children emit) and is NOT what to subscribe to.

Waypoint name (field 12) is resolved by `generateWaypointName`, shared with
RMB/APB/APB-true:
  1. nextPoint.name when SignalK/signalk-server#2608 lands
  2. "WP <pointIndex+1>" when a route is active (e.g. "WP 1", "WP 2")
  3. "WP 1" as a single-point default. BWC is used for both active-route
     and "goto" navigation, so a sensible identifier is preferred over an
     empty field that some chartplotters reject.

Bearing values reflect the calcMethod set in signalk-server (GreatCircle or
Rhumbline). For typical sailing distances the difference is negligible; if
you need strictly great-circle BWC, set the server's course calc method to
GreatCircle.
*/
import * as nmea from '../nmea'
import { generateWaypointName } from '../waypointNameGenerator'
import type { ActiveRoute, NextPoint } from '../waypointNameGenerator'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

function inLatRange(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= -90 && v <= 90
}

function inLonRange(v: unknown): v is number {
  // Match nmea.toNmeaDegreesLongitude which rejects -180 (treats antimeridian
  // as +180 only). Catching here rather than letting it throw downstream
  // keeps emission failures uniform with the other validation paths.
  return typeof v === 'number' && Number.isFinite(v) && v > -180 && v <= 180
}

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'BWC',
    title: 'BWC - Bearing and distance to waypoint',
    keys: [
      'navigation.datetime',
      'navigation.course.nextPoint',
      'navigation.course.activeRoute',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.calcValues.bearingMagnetic',
      'navigation.course.calcValues.distance'
    ],
    // activeRoute defaults to {} so a Location-type destination (no route)
    // still emits; bearingMagnetic seeds with null so older servers that
    // don't publish it still let the combined stream fire (encoder emits
    // empty fields 8/9 when magnetic is missing).
    defaults: ['', undefined, {}, undefined, null, undefined],
    f: function (
      datetime8601: string,
      nextPoint: NextPoint | null | undefined,
      activeRoute: ActiveRoute | null | undefined,
      bearingTrue: number | undefined,
      bearingMagnetic: number | null | undefined,
      distance: number | undefined
    ): string | undefined {
      const datetime = nmea.formatDatetime(datetime8601)
      if (!datetime.time) {
        _app.debug('BWC: skipping emission - invalid or missing datetime')
        return undefined
      }

      if (nextPoint == null) {
        _app.debug('BWC: skipping emission - nextPoint is null')
        return undefined
      }

      const wpLat = nextPoint.position?.latitude
      const wpLon = nextPoint.position?.longitude

      if (
        !inLatRange(wpLat) ||
        !inLonRange(wpLon) ||
        !Number.isFinite(bearingTrue) ||
        !Number.isFinite(distance) ||
        (distance as number) < 0
      ) {
        _app.debug(
          `BWC: skipping emission - invalid input (lat:${wpLat} lon:${wpLon} bearing:${bearingTrue} dist:${distance})`
        )
        return undefined
      }

      const bearingTrueDeg = nmea.radsToPositiveDeg(bearingTrue as number)
      const bearingMagneticDeg = Number.isFinite(bearingMagnetic)
        ? nmea.radsToPositiveDeg(bearingMagnetic as number)
        : undefined

      const waypointId = generateWaypointName(nextPoint, activeRoute)

      return nmea.toSentence([
        '$IIBWC',
        datetime.time,
        nmea.toNmeaDegreesLatitude(wpLat),
        nmea.toNmeaDegreesLongitude(wpLon),
        bearingTrueDeg.toFixed(1),
        'T',
        bearingMagneticDeg !== undefined ? bearingMagneticDeg.toFixed(1) : '',
        bearingMagneticDeg !== undefined ? 'M' : '',
        nmea.mToNm(distance as number).toFixed(2),
        'N',
        waypointId
      ])
    }
  }
}
