const m_hex = [
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F'
]

function toSentence(parts) {
  var base = parts.join(',')
  return base + computeChecksum(base)
}

function computeChecksum(sentence) {
  // skip the $
  let i = 1
  // init to first character
  let c1 = sentence.charCodeAt(i)
  // process rest of characters, zero delimited
  for (i = 2; i < sentence.length; ++i) {
    c1 = c1 ^ sentence.charCodeAt(i)
  }
  return '*' + toHexString(c1)
}

function toHexString(v) {
  let msn = (v >> 4) & 0x0f
  let lsn = (v >> 0) & 0x0f
  return m_hex[msn] + m_hex[lsn]
}

function radsToDeg(radians) {
  return (radians * 180) / Math.PI
}

function msToKnots(v) {
  return (v * 3600) / 1852.0
}

function msToKM(v) {
  return (v * 3600.0) / 1000.0
}

function mToNm(v) {
  return v * 0.000539957
}

function padd(n, p, c) {
  let pad_char = typeof c !== 'undefined' ? c : '0'
  let pad = new Array(1 + p).join(pad_char)
  return (pad + n).slice(-pad.length)
}

function decimalDegreesToDegreesAndDecimalMinutes(degrees) {
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

  let degrees_out = Math.floor(degrees)
  let minutes = (degrees % 1) * 60
  return [degrees_out, minutes, dir]
}

function toNmeaDegreesLatitude(inVal) {
  /*
    toNmeaDegreesLatitude takes a float (inVal) representing decimal degrees
    and returns a string formatted as degrees and decimal minutes suitable for
    use in an NMEA0183 sentence. (e.g. DDMM.MMMM)
  */

  if (typeof inVal != 'number' || inVal < -90 || inVal > 90) {
    throw new Error('invalid input to toNmeaDegreesLatitude: ' + inVal)
  }

  let [degrees, minutes, dir] = decimalDegreesToDegreesAndDecimalMinutes(inVal)

  return (
    padd(degrees.toFixed(0), 2) +
    padd(minutes.toFixed(4), 7) +
    ',' +
    (dir > 0 ? 'N' : 'S')
  )
}

function toNmeaDegreesLongitude(inVal) {
  /*
    toNmeaDegreesLongitude takes a float (inVal) representing decimal degrees
    and returns a string formatted as degrees and decimal minutes suitable for
    use in an NMEA0183 sentence. (e.g. DDDMM.MMMM)
  */

  if (typeof inVal != 'number' || inVal <= -180 || inVal > 180) {
    throw new Error('invalid input to toNmeaDegreesLongitude: ' + inVal)
  }

  let [degrees, minutes, dir] = decimalDegreesToDegreesAndDecimalMinutes(inVal)

  return (
    padd(degrees.toFixed(0), 3) +
    padd(minutes.toFixed(4), 7) +
    ',' +
    (dir > 0 ? 'E' : 'W')
  )
}

function fixAngle(d) {
  let result = d
  if (d > Math.PI) result -= 2 * Math.PI
  if (d < -Math.PI) result += 2 * Math.PI
  return result
}

function toPositiveRadians(d) {
  return d < 0 ? d + 2 * Math.PI : d
}

function radsToPositiveDeg(r) {
  return radsToDeg(toPositiveRadians(r))
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
function formatDatetime(datetime8601) {
  const empty = {
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

  const hours = ('00' + datetime.getUTCHours()).slice(-2)
  const minutes = ('00' + datetime.getUTCMinutes()).slice(-2)
  const seconds = ('00' + datetime.getUTCSeconds()).slice(-2)
  const centiseconds = (
    '00' + Math.floor(datetime.getUTCMilliseconds() / 10)
  ).slice(-2)

  const day = ('00' + datetime.getUTCDate()).slice(-2)
  const month = ('00' + (datetime.getUTCMonth() + 1)).slice(-2)
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
    date: day + month + ('00' + year).slice(-2)
  }
}

module.exports = {
  toSentence: toSentence,
  radsToDeg: radsToDeg,
  msToKnots: msToKnots,
  msToKM: msToKM,
  toNmeaDegreesLatitude: toNmeaDegreesLatitude,
  toNmeaDegreesLongitude: toNmeaDegreesLongitude,
  fixAngle: fixAngle,
  radsToPositiveDeg,
  mToNm,
  formatDatetime: formatDatetime
}
