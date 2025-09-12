const nmea = require('../nmea.js')

module.exports = function (app) {
  return {
    sentence: 'APB',
    title: 'APB - Autopilot info (Signal K)',
    keys: [
      'navigation.courseGreatCircle.crossTrackError',
      'navigation.courseGreatCircle.bearingTrackTrue',
      'navigation.courseGreatCircle.nextPoint.bearingTrue',
      'navigation.magneticVariation',
      // Candado: solo emitimos APB si hay WP activo con lat/lon válidos
      'navigation.courseRhumbline.nextPoint.position'
    ],
    f: function (xte_m, trackTrue_rad, bearingTrue_rad, var_rad, wpPos) {
      // DEBUG
      console.log('[APB DEBUG]', {
        crossTrackError_m: xte_m,
        bearingTrackTrue_rad: trackTrue_rad,
        bearingTrue_rad: bearingTrue_rad,
        magneticVariation_rad: var_rad,
        wpPos
      })

      // Requisitos numéricos
      const numOk =
        Number.isFinite(xte_m) &&
        Number.isFinite(trackTrue_rad) &&
        Number.isFinite(bearingTrue_rad)

      if (!numOk) {
        console.warn('[APB DEBUG] Faltan claves numéricas finitas (XTE/Track/Bearing). No emito APB.')
        return
      }

      // Candado: WP activo (lat/lon finitos)
      const hasWp =
        wpPos &&
        Number.isFinite(wpPos.latitude) &&
        Number.isFinite(wpPos.longitude)

      if (!hasWp) {
        console.warn('[APB DEBUG] No hay waypoint activo (lat/lon no finitos). No emito APB.')
        return
      }

      const xteNm = Math.abs(nmea.mToNm(xte_m || 0)).toFixed(3)
      const dir = (xte_m > 0 ? 'L' : 'R')

      const originToDest_T = nmea.radsToPositiveDeg(trackTrue_rad || 0)
      const bearingTrue_T  = nmea.radsToPositiveDeg(bearingTrue_rad || 0)

      let bearingMag_M = bearingTrue_T
      if (Number.isFinite(var_rad)) {
        const varDeg = nmea.radsToDeg(var_rad)
        bearingMag_M = ((bearingTrue_T - varDeg) % 360 + 360) % 360
      }

      return nmea.toSentence([
        '$IIAPB',
        'A',                      // Status 1
        'A',                      // Status 2
        xteNm,                    // Cross Track Error Magnitude (NM, abs)
        dir,                      // Direction to steer
        'N',                      // Units = Nautical Miles
        'V',                      // Arrival circle status (como tenías)
        'V',                      // Perpendicular passed (como tenías)
        originToDest_T.toFixed(0),
        'T',
        '00',                     // Bearing origin to dest (magnético opcional; lo dejamos '00' como en tu ejemplo)
        bearingTrue_T.toFixed(0),
        'T',
        bearingMag_M.toFixed(0),
        'M'
      ])
    }
  }
}
