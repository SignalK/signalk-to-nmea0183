/*
 * Utility helpers to build NMEA 0183 sentences and convert coordinates.
 * All comments are in English to comply with repository guidelines.
 */

const m_hex = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']

function toSentence(parts) {
  // Joins the parts with commas, adds leading '$' if not present,
  // and appends checksum after '*'.
  // Example: ['GPRMB','A','...'] -> '$GPRMB,A,...*CS'
  const body = parts.join(',')
  const prefixed = body.startsWith('$') ? body : ('$' + body)
  const checksumVal = checksum(prefixed.slice(1, prefixed.indexOf('*') > -1 ? prefixed.indexOf('*') : undefined))
  const starIdx = prefixed.indexOf('*')
  const head = starIdx === -1 ? prefixed : prefixed.slice(0, starIdx)
  return head + '*' + checksumVal
}

function checksum(sentenceWithoutDollar) {
  // XOR of all chars until '*' (excluded). Input must NOT start with '$'.
  let cs = 0
  for (let i = 0; i < sentenceWithoutDollar.length; i++) {
    const ch = sentenceWithoutDollar[i]
    if (ch === '*') break
    cs = cs ^ sentenceWithoutDollar.charCodeAt(i)
  }
  // Convert to two uppercase hex digits
  return m_hex[(cs >> 4) & 0x0f] + m_hex[cs & 0x0f]
}

function padd(n, p, c) {
  // Left-pad number n to the same length as p using char c (defaults to '0')
  const pad = (c ? '' + c : '0').repeat(('' + p).length)
  return (pad + n).slice(-pad.length)
}

/**
 * Converts decimal degrees to [degrees, minutes, dirSign].
 * @param {number} degrees decimal degrees
 * @returns {[number, number, 1|-1]} [deg, minutes, dir]; dir=+1 for N/E, -1 for S/W.
 * NOTE: 0 degrees is considered N or E.
 */
function decimalDegreesToDegreesAndDecimalMinutes(degrees) {
  let dir = 1 // default to N or E
  if (degrees < 0) {
    dir = -1
    degrees *= -1
  }
  const degrees_out = Math.floor(degrees)
  const minutes = (degrees % 1) * 60
  return [degrees_out, minutes, dir]
}

/**
 * Converts latitude in decimal degrees to NMEA ddmm.mmmm,N|S
 * Throws if input is not finite or outside [-90, 90].
 */
function toNmeaDegreesLatitude(inVal) {
  if (!Number.isFinite(inVal) || inVal < -90 || inVal > 90) {
    throw new Error('invalid input to toNmeaDegreesLatitude: ' + inVal)
  }
  const [degrees, minutes, dir] = decimalDegreesToDegreesAndDecimalMinutes(inVal)
  return (
    padd(degrees.toFixed(0), 2) +
    padd(minutes.toFixed(4), 7) +
    ',' + (dir > 0 ? 'N' : 'S')
  )
}

/**
 * Converts longitude in decimal degrees to NMEA dddmm.mmmm,E|W
 * Throws if input is not finite or outside [-180, 180).
 */
function toNmeaDegreesLongitude(inVal) {
  if (!Number.isFinite(inVal) || inVal < -180 || inVal >= 180) {
    throw new Error('invalid input to toNmeaDegreesLongitude: ' + inVal)
  }
  const [degrees, minutes, dir] = decimalDegreesToDegreesAndDecimalMinutes(inVal)
  return (
    padd(degrees.toFixed(0), 3) +
    padd(minutes.toFixed(4), 7) +
    ',' + (dir > 0 ? 'E' : 'W')
  )
}

/**
 * Converts radians to degrees in [0,360).
 */
function radToDeg360(rad) {
  let deg = (rad * 180) / Math.PI
  while (deg < 0) deg += 360
  while (deg >= 360) deg -= 360
  return deg
}

/**
 * Returns the talker ID to use for sentences.
 * Defaults to 'GP' (widest compatibility). Can be overridden with env NMEA_TALKER=II.
 */
function talker() {
  const t = (process.env.NMEA_TALKER || 'GP').toUpperCase()
  return t === 'II' ? 'II' : 'GP'
}

module.exports = {
  toSentence,
  checksum,
  toNmeaDegreesLatitude,
  toNmeaDegreesLongitude,
  radToDeg360,
  talker
}
