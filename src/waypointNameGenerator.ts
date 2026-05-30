/**
 * Resolves the NMEA0183 waypoint identifier (the "c--c" Waypoint ID field)
 * from a Signal K course point. Shared by RMB (fields 4/5), APB and APB-true
 * (field 10), and BWC (field 12).
 *
 * The Signal K server owns waypoint naming. When a destination is set it
 * publishes `nextPoint.name` / `previousPoint.name`, using the route point or
 * waypoint resource name where the operator gave one and otherwise a generated
 * default ("WP1", "WP2", ... along a route, "DP" for a go-to position, "VP" for
 * the vessel's starting point). This function forwards that name verbatim so
 * the NMEA identifier always matches what the rest of Signal K displays; it
 * never invents one. If the server supplies no name (an older server, or a
 * route point with no metadata) the field is emitted empty rather than guessed.
 *
 * Names can be operator-defined, so they are sanitised before going on the
 * wire. See `sanitize` below.
 */

export interface CoursePoint {
  type?: string
  name?: string
  position?: { latitude?: number; longitude?: number }
  href?: string | null
}

// `CoursePoint` is the shared shape of both course points; the sentence
// encoders import it under the `NextPoint` alias (RMB re-aliases it again to
// `PreviousPoint`) so each call site reads as the point it handles.
export type NextPoint = CoursePoint

const NMEA_RESERVED = /[,*$\r\n]/g
const MAX_WAYPOINT_NAME_LEN = 20

export function generateWaypointName(
  point: CoursePoint | null | undefined
): string {
  const name = point?.name
  if (typeof name !== 'string') {
    return ''
  }
  return sanitize(name)
}

// NMEA0183 reserves ',', '*' and '$' for field/checksum framing and CR/LF as
// the line terminator, so an operator-defined name containing any of them would
// corrupt the sentence; strip those, then cap the length so a long name can't
// overflow a receiver's fixed-width waypoint-ID field.
// Example: "St *Tropez,1$" -> "St Tropez1"
function sanitize(name: string): string {
  const stripped = name.replace(NMEA_RESERVED, '')
  return stripped.length > MAX_WAYPOINT_NAME_LEN
    ? stripped.slice(0, MAX_WAYPOINT_NAME_LEN)
    : stripped
}
