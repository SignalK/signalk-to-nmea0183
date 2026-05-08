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
8. Bearing to waypoint, degrees magnetic
9. M indicating magnetic
10. Distance to waypoint, Nautical miles
11. N indicating Nautical miles
12. Waypoint ID
13. Checksum
*/
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

interface NextPoint {
  position?: { latitude?: number; longitude?: number }
  bearing?: number
  distance?: number
  name?: string
}

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'BWC',
    title: 'BWC - Bearing and distance to waypoint',
    keys: [
      'navigation.datetime',
      'navigation.courseGreatCircle.nextPoint',
      'navigation.magneticVariation'
    ],
    // No defaults; all three streams must emit before combined stream fires.
    // nextPoint is required (position, bearing, distance must all be present).
    defaults: ['', undefined, undefined],
    f: function (
      datetime8601: string,
      nextPoint: NextPoint,
      magneticVariation: number | undefined
    ): string | undefined {
      const datetime = nmea.formatDatetime(datetime8601)
      if (!datetime.time) {
        _app.debug('BWC: skipping emission - invalid or missing datetime')
        return undefined
      }

      const wpLat = nextPoint.position?.latitude
      const wpLon = nextPoint.position?.longitude
      const bearingTrue = nextPoint.bearing
      const distance = nextPoint.distance

      if (
        typeof wpLat !== 'number' ||
        typeof wpLon !== 'number' ||
        typeof bearingTrue !== 'number' ||
        typeof distance !== 'number'
      ) {
        _app.debug(
          `BWC: skipping emission - missing required field (lat:${wpLat} lon:${wpLon} bearing:${bearingTrue} dist:${distance})`
        )
        return undefined
      }

      const bearingTrueDeg = nmea.radsToPositiveDeg(bearingTrue)
      let bearingMagneticDeg = bearingTrueDeg

      // Calculate magnetic bearing from true bearing and magnetic variation.
      // Formula: mag = true - variation (where east variation is positive).
      // Example: true 30°, variation +10° (east) → mag 20° (compass points east of true).
      if (typeof magneticVariation === 'number') {
        bearingMagneticDeg = bearingTrueDeg - nmea.radsToDeg(magneticVariation)
        // Normalize to 0-360 range
        if (bearingMagneticDeg < 0) {
          bearingMagneticDeg += 360
        } else if (bearingMagneticDeg >= 360) {
          bearingMagneticDeg -= 360
        }
      }

      // Validate and sanitize waypoint name to prevent corruption of NMEA sentence.
      let waypointId = nextPoint.name || ''
      if (waypointId.length > 20) {
        waypointId = waypointId.slice(0, 20)
        _app.debug('BWC: truncated waypoint name to 20 characters')
      }

      return nmea.toSentence([
        '$IIBWC',
        datetime.time,
        nmea.toNmeaDegreesLatitude(wpLat),
        nmea.toNmeaDegreesLongitude(wpLon),
        bearingTrueDeg.toFixed(1),
        'T',
        bearingMagneticDeg.toFixed(1),
        'M',
        nmea.mToNm(distance).toFixed(2),
        'N',
        waypointId
      ])
    }
  }
}
