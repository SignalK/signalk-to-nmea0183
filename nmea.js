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

function toSentence (parts) {
  var base = parts.join(',')
  return base + computeChecksum(base)
}

function computeChecksum (sentence) {
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

function toHexString (v) {
  let msn = (v >> 4) & 0x0f
  let lsn = (v >> 0) & 0x0f
  return m_hex[msn] + m_hex[lsn]
}

function radsToDeg (radians) {
  return radians * 180 / Math.PI
}

function msToKnots (v) {
  return v * 3600 / 1852.0
}

function msToKM (v) {
  return v * 3600.0 / 1000.0
}

function mToNm (v) {
  return v * 0.000539957
}

function padd (n, p, c) {
  let pad_char = typeof c !== 'undefined' ? c : '0'
  let pad = new Array(1 + p).join(pad_char)
  return (pad + n).slice(-pad.length)
}

function decimalDegreesToDegreesAndDecimalMinutes ( degrees ) {
  /*
    decimalDegreesToDegreesAndDecimalMinutes takes a float (degrees)
    representing decimal degrees and returns a tuple [deg, min, dir], where
    deg is an int representing degrees, min is a float representing decimal
    minutes and dir is a positive or negative integer representing the
    direction from the origin ( +1 for N and E, -1 for S and W )

    NOTE: 0 degrees is N or E
  */

  let dir=1 // default to N or E

  if (degrees<0) {
    dir = -1
    degrees *= -1
  }

  let degrees_out = Math.floor(degrees)
  let minutes = (degrees % 1) * 60
  return [ degrees_out, minutes, dir ]
}

function toNmeaDegreesLatitude (inVal) {
  /*
    toNmeaDegreesLatitude takes a float (inVal) representing decimal degrees
    and returns a string formatted as degrees and decimal minutes suitable for
    use in an NMEA0183 sentence. (e.g. DDMM.MMMM)
  */

  if (typeof inVal != 'number' || inVal < -90 || inVal > 90) {
    throw new Error("invalid input to toNmeaDegreesLatitude: " + inVal)
  }

  let [degrees, minutes, dir] = decimalDegreesToDegreesAndDecimalMinutes(inVal)

  return(
      padd(degrees.toFixed(0), 2)
      + padd(minutes.toFixed(4), 7)
      + "," + (dir > 0 ? "N" : "S")
    )
}

function toNmeaDegreesLongitude (inVal) {
  /*
    toNmeaDegreesLongitude takes a float (inVal) representing decimal degrees
    and returns a string formatted as degrees and decimal minutes suitable for
    use in an NMEA0183 sentence. (e.g. DDDMM.MMMM)
  */

  if (typeof inVal != 'number' || inVal <= -180 || inVal > 180) {
    throw new Error("invalid input to toNmeaDegreesLongitude: " + inVal)
  }

  let [degrees, minutes, dir] = decimalDegreesToDegreesAndDecimalMinutes(inVal)

  return(
      padd(degrees.toFixed(0), 3)
      + padd(minutes.toFixed(4), 7)
      + "," + (dir > 0 ? "E" : "W")
    )
}

function fixAngle (d) {
  let result = d
  if (d > Math.PI) result -= 2 * Math.PI
  if (d < -Math.PI) result += 2 * Math.PI
  return result
}

function toPositiveRadians (d) {
  return d < 0 ? d + 2 * Math.PI : d
}

function radsToPositiveDeg(r) {
  return radsToDeg(toPositiveRadians(r))
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
  mToNm
}
