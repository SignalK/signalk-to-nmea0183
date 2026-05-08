/*
Bearing and Distance to Waypoint (Great Circle):
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
running signalk-server (openplotter) with an active route:

  - navigation.datetime                              -> ISO datetime
  - navigation.courseGreatCircle.nextPoint.position  -> {latitude, longitude}
  - navigation.course.calcValues.bearingTrue         -> bearing to waypoint, true (rad)
  - navigation.course.calcValues.bearingMagnetic     -> bearing to waypoint, magnetic (rad, optional)
  - navigation.course.calcValues.distance            -> distance to waypoint (m)

NB: the parent path 'navigation.courseGreatCircle.nextPoint' is silent on the
deltastream (signalk-server only publishes its leaf children), so subscribe
to '.position' directly. Waypoint name (field 12) currently has no published
delta source; left empty until SignalK/signalk-server#2595 lands.

The course-provider publishes calcValues with calcMethod="GreatCircle", so the
'course' namespace carries the great-circle values that BWC requires.
*/
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

interface Position {
  latitude?: number
  longitude?: number
}

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
      'navigation.courseGreatCircle.nextPoint.position',
      'navigation.course.calcValues.bearingTrue',
      'navigation.course.calcValues.bearingMagnetic',
      'navigation.course.calcValues.distance'
    ],
    // bearingMagnetic seeds with null so the combined stream fires even when
    // the server has not yet published it (older servers, or before the first
    // recompute). The encoder treats a non-finite value as "magnetic unknown"
    // and emits empty fields 8 and 9 per NMEA0183 convention.
    // All other inputs are required (undefined default = wait for first delta).
    defaults: ['', undefined, undefined, null, undefined],
    f: function (
      datetime8601: string,
      position: Position | null | undefined,
      bearingTrue: number | undefined,
      bearingMagnetic: number | null | undefined,
      distance: number | undefined
    ): string | undefined {
      const datetime = nmea.formatDatetime(datetime8601)
      if (!datetime.time) {
        _app.debug('BWC: skipping emission - invalid or missing datetime')
        return undefined
      }

      const wpLat = position?.latitude
      const wpLon = position?.longitude

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
        '' // waypoint name has no live delta source today; see file header
      ])
    }
  }
}
