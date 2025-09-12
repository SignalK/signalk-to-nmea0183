const m_hex = [
  '0','1','2','3','4','5','6','7','8','9',
  'A','B','C','D','E','F'
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

function decimalDegreesToDegreesAndDecimalMinutes (degrees) {
  /*
    Toma grados decimales y devuelve [deg, min, dir]
    donde dir = +1 (N/E), -1 (S/W).
  */
  let dir = 1
  if (degrees < 0) {
    dir = -1
    degrees *= -1
  }
  let degrees_out = Math.floor(degrees)
  let minutes = (degrees % 1) * 60
  return [degrees_out, minutes, dir]
}

function toNmeaDegreesLatitude (inVal) {
  /*
    Devuelve "DDMM.MMMM,N|S".
    Lanza si el valor no es finito o está fuera de [-90, 90].
  */
  if (!Number.isFinite(inVal) || inVal < -90 || inVal > 90) {
    throw new Error("invalid input to toNmeaDegreesLatitude: " + inVal)
  }
  let [degrees, minutes, dir] = decimalDegreesToDegreesAndDecimalMinutes(inVal)
  return (
    padd(degrees.toFixed(0), 2) +
    padd(minutes.toFixed(4), 7) +
    "," + (dir > 0 ? "N" : "S")
  )
}

function toNmeaDegreesLongitude (inVal) {
  /*
    Devuelve "DDDMM.MMMM,E|W".
    Lanza si el valor no es finito o está fuera de [-180, 180).
  */
  if (!Number.isFinite(inVal) || inVal < -180 || inVal >= 180) {
    throw new Error("invalid input to toNmeaDegreesLongitude: " + inVal)
  }
  let [degrees, minutes, dir] = decimalDegreesToDegreesAndDecimalMinutes(inVal)
  return (
    padd(degrees.toFixed(0), 3) +
    padd(minutes.toFixed(4), 7) +
    "," + (dir > 0 ? "E" : "W")
  )
}

// Helpers opcionales que no lanzan, devuelven null en caso de error
function toNmeaDegreesLatitudeOrNull(v) {
  try { return toNmeaDegreesLatitude(v) } catch { return null }
}
function toNmeaDegreesLongitudeOrNull(v) {
  try { return toNmeaDegreesLongitude(v) } catch { return null }
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
  toSentence,
  radsToDeg,
  msToKnots,
  msToKM,
  toNmeaDegreesLatitude,
  toNmeaDegreesLongitude,
  toNmeaDegreesLatitudeOrNull,
  toNmeaDegreesLongitudeOrNull,
  fixAngle,
  radsToPositiveDeg,
  mToNm
}
