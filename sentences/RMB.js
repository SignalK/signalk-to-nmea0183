/*
 * RMB - Recommended Minimum Navigation Information
 *
 * Generates $--RMB with cross-track error (XTE), origin/destination IDs,
 * destination position, range (NM), true bearing (deg), VMG (knots) if available,
 * and arrival flag (kept as 'V' to avoid triggering alarms).
 *
 * Implementation notes:
 * - Uses Signal K courseGreatCircle keys for consistency with APB/WPL/RTE.
 * - Range is converted from meters to nautical miles.
 * - Latitude/Longitude are formatted as ddmm.mmmm,N|S and dddmm.mmmm,E|W.
 * - Talker can be overridden with env NMEA_TALKER (defaults to 'GP').
 */

const nmea = require('../nmea.js')

module.exports = function (app) {
  return {
    sentence: 'RMB',
    title: 'RMB - Heading and distance to waypoint',
    keys: [
      // Cross-track error (meters). Positive usually means right of track.
      'navigation.courseGreatCircle.crossTrackError',
      // Origin waypoint object (optional: name/identifier)
      'navigation.courseGreatCircle.origin',
      // Next/destination waypoint object (expects position/name/identifier)
      'navigation.courseGreatCircle.nextPoint',
      // Range to destination (meters)
      'navigation.courseGreatCircle.nextPoint.distance',
      // Bearing to destination (True, radians)
      'navigation.courseGreatCircle.nextPoint.bearingTrue',
      // VMG towards destination (m/s), optional
      'navigation.courseGreatCircle.vmgTowardsDestination'
    ],
    f: function (xte_m, origin, nextPoint, dist_m, brgTrue_rad, vmg_ms) {
      const talker = (process.env.NMEA_TALKER || 'GP').toUpperCase()

      // Basic data presence checks
      const hasXte = Number.isFinite(xte_m)
      const pos = nextPoint && nex
