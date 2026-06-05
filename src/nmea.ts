/**
 * NMEA 0183 formatting helpers used by the sentence encoders in
 * src/sentences/. Centralised so that every encoder shares the same
 * checksum computation, lat/lon formatting, angle fixing, and unit
 * conversions.
 */

export function toSentence(parts: Array<string | number>): string {
  const base = parts.join(',')
  return base + computeChecksum(base)
}

function computeChecksum(sentence: string): string {
  // skip the $
  let i = 1
  // init to first character
  let c1 = sentence.charCodeAt(i)
  // process rest of characters, zero delimited
  for (i = 2; i < sentence.length; ++i) {
    c1 = c1 ^ sentence.charCodeAt(i)
  }
  return '*' + c1.toString(16).toUpperCase().padStart(2, '0')
}

export function radsToDeg(radians: number): number {
  return (radians * 180) / Math.PI
}

export function radsPerSecToDegPerMin(v: number): number {
  return radsToDeg(v) * 60
}

export function msToKnots(v: number): number {
  return (v * 3600) / 1852.0
}

export function msToKM(v: number): number {
  return (v * 3600.0) / 1000.0
}

export function mToNm(v: number): number {
  return v * 0.000539957
}

export function mToFeet(v: number): number {
  return v * 3.28084
}

export function mToFathoms(v: number): number {
  return v * 0.546807
}

export function kToC(v: number): number {
  return v - 273.15
}

export function paToInHg(v: number): number {
  return v / 3386.39
}

export function paToBar(v: number): number {
  return v / 100000.0
}

function padd(n: string, p: number, c?: string): string {
  return n.padStart(p, c ?? '0')
}

function decimalDegreesToDegreesAndDecimalMinutes(
  degrees: number
): [number, number, number] {
  /*
    decimalDegreesToDegreesAndDecimalMinutes takes a float (degrees)
    representing decimal degrees and returns a tuple [deg, min, dir], where
    deg is an int representing degrees, min is a float representing decimal
    minutes and dir is a positive or negative integer representing the
    direction from the origin ( +1 for N and E, -1 for S and W )

    NOTE: 0 degrees is N or E
  */

  let dir = 1 // default to N or E

  if (degrees < 0) {
    dir = -1
    degrees *= -1
  }

  const degrees_out = Math.floor(degrees)
  const minutes = (degrees % 1) * 60
  return [degrees_out, minutes, dir]
}

export function toNmeaDegreesLatitude(inVal: unknown): string {
  /*
    toNmeaDegreesLatitude takes a float (inVal) representing decimal degrees
    and returns a string formatted as degrees and decimal minutes suitable for
    use in an NMEA0183 sentence. (e.g. DDMM.MMMM)
  */

  if (typeof inVal !== 'number' || inVal < -90 || inVal > 90) {
    throw new Error('invalid input to toNmeaDegreesLatitude: ' + inVal)
  }

  const [degrees, minutes, dir] =
    decimalDegreesToDegreesAndDecimalMinutes(inVal)

  return (
    padd(degrees.toFixed(0), 2) +
    padd(minutes.toFixed(4), 7) +
    ',' +
    (dir > 0 ? 'N' : 'S')
  )
}

export function toNmeaDegreesLongitude(inVal: unknown): string {
  /*
    toNmeaDegreesLongitude takes a float (inVal) representing decimal degrees
    and returns a string formatted as degrees and decimal minutes suitable for
    use in an NMEA0183 sentence. (e.g. DDDMM.MMMM)
  */

  if (typeof inVal !== 'number' || inVal <= -180 || inVal > 180) {
    throw new Error('invalid input to toNmeaDegreesLongitude: ' + inVal)
  }

  const [degrees, minutes, dir] =
    decimalDegreesToDegreesAndDecimalMinutes(inVal)

  return (
    padd(degrees.toFixed(0), 3) +
    padd(minutes.toFixed(4), 7) +
    ',' +
    (dir > 0 ? 'E' : 'W')
  )
}

export function fixAngle(d: number): number {
  // Use modulo to handle multi-wrap angles and keep within [-PI, PI]
  const angle = d % (2 * Math.PI)
  if (angle > Math.PI) return angle - 2 * Math.PI
  if (angle < -Math.PI) return angle + 2 * Math.PI
  return angle
}

function toPositiveRadians(d: number): number {
  let result = d % (2 * Math.PI)
  if (result < 0) result += 2 * Math.PI
  return result
}

export function radsToPositiveDeg(r: number): number {
  return radsToDeg(toPositiveRadians(r))
}

export interface FormattedDatetime {
  hours: string
  minutes: string
  seconds: string
  centiseconds: string
  time: string
  day: string
  month: string
  year: string
  date: string
}

// Parses an ISO 8601 datetime string into NMEA0183 time/date components (UTC).
// Input:  '2025-04-27T14:34:56.789+02:00'
// Output: { hours: '12', minutes: '34', seconds: '56', centiseconds: '78',
//           time: '123456.78', day: '27', month: '04', year: '2025', date: '270425' }
//
// The input must include a timezone designator (e.g. 'Z' or '+02:00'). A naive
// ISO string like '2025-04-27T14:34:56' is interpreted as LOCAL time by the
// Date constructor, which is exactly the class of bug this function exists to
// prevent. Non-string, empty, or unparseable input returns empty fields.
export function formatDatetime(datetime8601: unknown): FormattedDatetime {
  const empty: FormattedDatetime = {
    hours: '',
    minutes: '',
    seconds: '',
    centiseconds: '',
    time: '',
    day: '',
    month: '',
    year: '',
    date: ''
  }

  if (typeof datetime8601 !== 'string' || datetime8601.length === 0) {
    return empty
  }

  const datetime = new Date(datetime8601)
  if (isNaN(datetime.getTime())) {
    return empty
  }

  const hours = padd(datetime.getUTCHours().toString(), 2)
  const minutes = padd(datetime.getUTCMinutes().toString(), 2)
  const seconds = padd(datetime.getUTCSeconds().toString(), 2)
  const centiseconds = padd(Math.floor(datetime.getUTCMilliseconds() / 10).toString(), 2)

  const day = padd(datetime.getUTCDate().toString(), 2)
  const month = padd((datetime.getUTCMonth() + 1).toString(), 2)
  const year = '' + datetime.getUTCFullYear()
  return {
    hours,
    minutes,
    seconds,
    centiseconds,
    time: hours + minutes + seconds + '.' + centiseconds,
    day,
    month,
    year,
    date: day + month + year.slice(-2)
  }
}
