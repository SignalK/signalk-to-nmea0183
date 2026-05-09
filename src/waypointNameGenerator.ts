/**
 * Generates a NMEA0183 waypoint identifier from Signal K's `nextPoint` /
 * `previousPoint` and `activeRoute` deltas. Used by RMB (fields 4 and 5),
 * APB (field 10), APB-true (field 10), and BWC (field 12).
 *
 * Resolution order:
 *   1. `point.name`              -- once signalk-server populates this
 *      in the delta stream (see SignalK/signalk-server#2608).
 *   2. `synthesizeFallbackName()` -- pre-2608 fallback that mirrors the
 *      defaults the upstream PR applies, so behavior is consistent both
 *      before and after that PR ships. REMOVE the fallback once #2608
 *      is released and we can rely on `point.name` always being set.
 *
 * NMEA0183 reserves a few framing characters; we strip them defensively
 * in case `point.name` ever contains them.
 */

export interface CoursePoint {
  type?: string
  name?: string
  position?: { latitude?: number; longitude?: number }
  href?: string | null
}

export interface ActiveRoute {
  href?: string | null
  name?: string | null
  pointIndex?: number | null
  pointTotal?: number | null
}

// Preserved for backward compatibility with callers that imported the
// original `NextPoint` name; the shape is identical to CoursePoint.
export type NextPoint = CoursePoint

const NMEA_RESERVED = /[,*$\r\n]/g
const MAX_WAYPOINT_NAME_LEN = 20

export function generateWaypointName(
  point: CoursePoint | null | undefined,
  activeRoute: ActiveRoute | null | undefined
): string {
  const p = point ?? {}
  if (typeof p.name === 'string' && p.name.length > 0) {
    return sanitize(p.name)
  }
  return sanitize(synthesizeFallbackName(p, activeRoute ?? {}))
}

/**
 * Pre-#2608 fallback: synthesize a default name from the point type.
 * Mirrors signalk-server's CourseAPI defaults so the NMEA output stays
 * consistent before and after #2608 lands:
 *
 *   RoutePoint     -> "WP<pointIndex+1>" (e.g. "WP1", "WP2", ...)
 *   Waypoint       -> "WP1"   (single-point goto-waypoint)
 *   Location       -> "DP"    (direct-to-position)
 *   VesselPosition -> "VP"    (previousPoint at start of any goto)
 *   (anything else)-> "WP1"   (last-ditch default matching upstream)
 *
 * REMOVE this function once SignalK/signalk-server#2608 is released and
 * point.name is reliably populated in the delta stream.
 */
function synthesizeFallbackName(
  point: CoursePoint,
  activeRoute: ActiveRoute
): string {
  if (point.type === 'RoutePoint') {
    if (typeof activeRoute.pointIndex === 'number') {
      return `WP${activeRoute.pointIndex + 1}`
    }
    return 'WP1'
  }
  if (point.type === 'Location') {
    return 'DP'
  }
  if (point.type === 'VesselPosition') {
    return 'VP'
  }
  // Waypoint or unknown type
  return 'WP1'
}

function sanitize(name: string): string {
  const stripped = name.replace(NMEA_RESERVED, '')
  return stripped.length > MAX_WAYPOINT_NAME_LEN
    ? stripped.slice(0, MAX_WAYPOINT_NAME_LEN)
    : stripped
}
