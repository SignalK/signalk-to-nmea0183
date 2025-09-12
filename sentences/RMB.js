/*
Heading and distance to waypoint:
$IIRMB,A,x.x,a,,,IIII.II,a,yyyyy.yy,a,x.x,x.x,x.x,A,a*hh
 I I I I I I I I I_Speed to WP in knots
 I I I I I I I I_True heading to destination in degrees
 I I I I I I I_Distance to destination in miles
 I I I I I_ ___ I_Longitude of the WP to destination, E/W
 I I I__ I_Latidude of the WP to destination, N/S
 I I_Direction of cross-track error, L/R
 I_Distance of cross-track error in miles
*/
// to verify
const nmea = require('../nmea.js')

function metersToNm(m) {
  return m == null ? null : m / 1852
}

module.exports = function (app) {
  return {
    sentence: 'RMB',
    title: 'RMB - Heading and distance to waypoint (Signal K)',
    keys: [
      'navigation.courseRhumbline.crossTrackError',
      'navigation.courseRhumbline.nextPoint.position',
      'navigation.courseRhumbline.nextPoint.distance',
      'navigation.courseRhumbline.nextPoint.bearingTrue'
    ],
    f: function (xte_m, wpPos, wpDistance_raw, bearingTrue_rad) {
      // DEBUG
      console.log('[RMB DEBUG]', {
        crossTrackError_m: xte_m,
        waypointPos: wpPos,
        wpDistance_raw,
        bearingTrue_rad
      })

      // Guardas de validez numérica
      const hasWp =
        wpPos &&
        Number.isFinite(wpPos.latitude) &&
        Number.isFinite(wpPos.longitude)

      if (!hasWp) {
        console.warn('[RMB DEBUG] Waypoint inválido o ausente (lat/lon no finitos). No emito RMB.')
        return
      }

      if (!Number.isFinite(wpDistance_raw)) {
        console.warn('[RMB DEBUG] Distancia a WP no finita. No emito RMB.')
        return
      }

      if (!Number.isFinite(bearingTrue_rad)) {
        console.warn('[RMB DEBUG] Rumbo verdadero a WP no finito. No emito RMB.')
        return
      }

      // XTE puede venir null; si no es finito lo tratamos como 0 para el formato
      const xteNmRaw = Number.isFinite(xte_m) ? metersToNm(xte_m) : 0
      const xteNm = (xteNmRaw || 0)
      const dir = (xteNm < 0) ? 'R' : 'L'

      const distNm = (wpDistance_raw > 1000
        ? metersToNm(wpDistance_raw)
        : wpDistance_raw || 0)

      const bearingTrueDeg = nmea.radsToDeg(bearingTrue_rad || 0)

      return nmea.toSentence([
        '$IIRMB',
        Math.abs(xteNm).toFixed(2),
        dir,
        nmea.toNmeaDegreesLatitude(wpPos.latitude),
        nmea.toNmeaDegreesLongitude(wpPos.longitude),
        (distNm || 0).toFixed(2),
        (bearingTrueDeg || 0).toFixed(2),
        'V', // Arrival circle status (lo dejamos como venía)
        ''
      ])
    }
  }
}
