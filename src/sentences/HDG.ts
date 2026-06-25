/*
 * HDG - Heading, Deviation & Variation
 *
 *        0   1   2 3   4
 *        |   |   | |   |
 * $--HDG,x.x,x.x,a,x.x,a*hh<CR><LF>
 *
 * Field 0: Magnetic sensor heading in degrees
 * Field 1: Magnetic deviation, degrees  (always empty — Signal K's
 *           headingMagnetic already has deviation applied)
 * Field 2: Deviation direction E/W      (always empty for the same reason)
 * Field 3: Magnetic variation, degrees
 * Field 4: Variation direction E/W
 *
 * Signal K inputs and priority rules
 * -----------------------------------
 * navigation.headingMagnetic  — required; sentence is suppressed without it.
 * navigation.magneticVariation — optional; fields 3-4 are left empty when
 *   absent (strict NMEA: both the value and the direction indicator are
 *   omitted so chartplotters see a cleanly empty field pair).
 *
 * Example: $IIHDG,201.10,,,9.00,E*16
 */

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

const MISSING = '' as const
type MaybeNumber = number | typeof MISSING

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDG',
    title: 'HDG - Heading, Deviation & Variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation'],
    // headingMagnetic has no default — the sentence is suppressed until it
    // emits at least once.  magneticVariation defaults to MISSING so the
    // combined stream can fire even when variation is not yet available.
    defaults: [undefined, MISSING],
    f: function hdg(
      headingMagnetic: number,
      magneticVariation: MaybeNumber
    ): string | undefined {
      // headingMagnetic is required; without it there is nothing to emit.
      // (The stream will not fire at all until headingMagnetic emits, but
      // a runtime guard keeps the type system happy and adds robustness.)
      if ((headingMagnetic as MaybeNumber) === MISSING) {
        return undefined
      }

      // Variation: emit value + direction, or leave both fields empty.
      let variationDeg = ''
      let variationDir = ''
      if (magneticVariation !== MISSING) {
        if (magneticVariation < 0) {
          variationDir = 'W'
          variationDeg = nmea.radsToDeg(Math.abs(magneticVariation)).toFixed(2)
        } else {
          variationDir = 'E'
          variationDeg = nmea.radsToDeg(magneticVariation).toFixed(2)
        }
      }

      return nmea.toSentence([
        '$IIHDG',
        nmea.radsToPositiveDeg(headingMagnetic).toFixed(2),
        '', // deviation — always empty (already applied in SK)
        '', // deviation direction — always empty
        variationDeg,
        variationDir,
      ])
    },
  }
}
