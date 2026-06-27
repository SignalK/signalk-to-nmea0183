/*
      === MWV - Wind Speed and Angle ===

      ------------------------------------------------------------------------------
      1   2 3   4 5
      |   | |   | |
      $--MWV,x.x,a,x.x,a*hh<CR><LF>
      ------------------------------------------------------------------------------

      Field Number:

      1. Wind Angle, 0 to 360 degrees
      2. Reference, R = Relative, T = True
      3. Wind Speed
      4. Wind Speed Units, K/M/N
      5. Status, A = Data Valid
      6. Checksum

      Signal K inputs and missing-data handling
      -----------------------------------------
      environment.wind.angleApparent — apparent wind angle.
      environment.wind.speedApparent — apparent wind speed (m/s).

      Both default to MISSING so the combined stream fires as soon as either
      path emits.  A non-finite value (null, NaN, Infinity or a non-numeric
      value) is treated as absent and produces an empty field rather than a
      fabricated "0.0" or a literal "NaN".  When neither field can be
      populated the sentence is suppressed entirely.
    */

// NMEA0183 Encoder MWVR   $INMWV,35.01,R,7.9,M,A*30
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

const MISSING = '' as const
type MaybeNumber = number | typeof MISSING

// Treats null, NaN, Infinity and non-numeric values as absent.
const finiteNum = (v: MaybeNumber): v is number => Number.isFinite(v as number)

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'MWV',
    title: 'MWV - Apparent Wind heading and speed',
    keys: ['environment.wind.angleApparent', 'environment.wind.speedApparent'],
    defaults: [MISSING, MISSING],
    f: function (angle: MaybeNumber, speed: MaybeNumber): string | undefined {
      const angleField = finiteNum(angle)
        ? nmea.radsToPositiveDeg(angle).toFixed(2)
        : ''
      const speedField = finiteNum(speed) ? speed.toFixed(2) : ''

      // Nothing useful to report — suppress rather than emit an empty hull.
      if (angleField === '' && speedField === '') {
        return undefined
      }

      return nmea.toSentence(['$IIMWV', angleField, 'R', speedField, 'M', 'A'])
    }
  }
}
