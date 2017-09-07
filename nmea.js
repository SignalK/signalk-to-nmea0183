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

function toNmeaDegrees (inVal) {
  let val = Math.abs(inVal)
  let minutes = Math.floor(val)
  let minutes_decimal = val % 1
  minutes_decimal *= 60.0
  return padd(minutes.toFixed(0), 2) + padd(minutes_decimal.toFixed(4), 7)
}

function fixAngle (d) {
  let result = d
  if (d > Math.PI) result -= 2 * Math.PI
  if (d < -Math.PI) result += 2 * Math.PI
  return result
}

module.exports = {
  toSentence: toSentence,
  radsToDeg: radsToDeg,
  msToKnots: msToKnots,
  msToKM: msToKM,
  toNmeaDegrees: toNmeaDegrees,
  fixAngle: fixAngle
}
