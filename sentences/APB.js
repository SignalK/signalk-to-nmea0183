/*
 * APB - Autopilot Sentence "APB"
 * Generates $--APB using cross-track error, bearings and (optionally) magnetic variation.
 *
 * Notes:
 * - Uses Signal K courseGreatCircle keys for consistency with RMB/WPL/RTE.
 * - If magnetic bearing is not provided, it is computed from bearingTrue + magneticVariation.
 * - Talker can be overridden with env NMEA_TALKER (defaults to 'GP').
 *
 * NMEA 0183 APB reference (common variant used by this plugin):
 * $--APB,A,A,x.x,a,N,V,V,xxx,T,00,xxx,T,xxx,M*hh
 *   1  2  3   4   5 6 7   8   9 10 11 12 13 14
 * 1-2: Status flags (A/A)
 * 3-5: Cross Track Error magnitude (NM), steer direction (L/R), units (N)
 * 6-7: Arrival/perpendicular passed (often V/V for generic use)
 * 8-9: Bearing origin→destination (degrees, True)
 * 10 : (Placeholder / not used in this variant)
 * 11-12: Bearing present position→destination (degrees, True)
 * 13-14: Bearing present position→destination (degrees, Magnetic)
 */

const nmea = require('../nmea.js')

module.exports = function (app) {
  return {
    sentence: 'APB',
    title: 'APB - Autopilot info',
    keys: [
      // Cross-track error in meters (+ means right of track)
      'navigation.courseGreatCircle.crossTrackError',
      // Track/bearing (True) along the great circle
      'navigation.courseGreatCircle.bearingTrackTrue',
      // Bearing from present position to next waypoint (True)
      'navigation.courseGreatCircle.nextPoint.bearingTrue',
      // Bearing from present position to next waypoint (Magnetic), if provided
      'navigation.courseGreatCircle.nextPoint.bearingMagnetic',
      // Magnetic variation (radians, +E). Used if magnetic bearing is not provided.
      'navigation.magneticVariation'
    ],
    f: function (xte_m, trackTrue_rad, nextTrue_rad, nextMag_rad, var_rad) {
      // Choose talker: default 'GP', allow override via env
      const talker = (process.env.NMEA_TALKER || 'GP').toUpperCase()

      // Basic numeric validation
      const hasXte = Number.isFinite(xte_m)
      const trueBearing = Number.isFinite(nextTrue_rad)
        ? nextTrue_rad
        : trackTrue_rad

      if (!hasXte || !Number.isFinite(trueBearing)) {
        // Not enough data to emit APB
        return
      }

      // Cross track error: meters -> nautical miles (absolute magnitude for field #3)
      const xteNm = Math.abs(nmea.mToNm(xte_m)).toFixed(3)

      // Direction to steer: R if XTE is to the right of track, else L
      // (Signal K crossTrackError > 0 typically means right of track)
      const steerDir = xte_m >= 0 ? 'R' : 'L'

      // Compute magnetic bearing if not explicitly provided:
      // bearingMagnetic = bearingTrue + magneticVariation
      let bearingMag_rad = Number.isFinite(nextMag_rad)
        ? nextMag_rad
        : (Number.isFinite(var_rad) ? trueBearing + var_rad : undefined)

      // Build sentence fields
      const parts = [
        `$${talker}APB`,
        'A',                               // 1: status
        'A',                               // 2: status
        xteNm,                             // 3: XTE magnitude (NM)
        steerDir,                          // 4: steer L/R
        'N',                               // 5: units = Nautical miles
        'V',                               // 6: arrival circle entered (V in this variant)
        'V',                               // 7: perpendicular passed (V in this variant)
        nmea.radsToPositiveDeg(trueBearing).toFixed(0), // 8: origin→dest bearing (deg)
        'T',                               // 9: True
        '00',                              // 10: placeholder / not used here
        nmea.radsToPositiveDeg(trueBearing).toFixed(0), // 11: bearing P→D (deg True)
        'T',                               // 12: True
        Number.isFinite(bearingMag_rad)
          ? nmea.radsToPositiveDeg(bearingMag_rad).toFixed(0)
          : '',                            // 13: bearing P→D (deg Magnetic) if known
        'M'                                // 14: Magnetic
      ]

      return nmea.toSentence(parts)
    }
  }
}
