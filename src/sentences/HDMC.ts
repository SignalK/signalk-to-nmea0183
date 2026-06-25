/*
 * HDMC - HDM sentence calculated from True heading and Variation
 *
 * Produces a standard $IIHDM sentence but derives the magnetic heading
 * from Signal K's navigation.headingTrue and navigation.magneticVariation
 * rather than from a magnetic sensor directly.
 *
 * Per the Signal K spec:
 *   headingMagnetic = headingTrue − magneticVariation
 *
 * $--HDM,x.x,M*hh<CR><LF>
 *
 * Signal K inputs
 * ---------------
 * navigation.headingTrue       — required; defaults to MISSING.
 * navigation.magneticVariation — required; defaults to MISSING.
 *
 * Both inputs must be present to compute the magnetic heading.  If either
 * is absent the sentence is suppressed (return undefined) because there is
 * no partial value worth emitting.
 *
 * Example: $IIHDM,170.0,M*24
 */

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

const MISSING = '' as const
type MaybeNumber = number | typeof MISSING

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDM',
    title: 'HDM - Heading Magnetic, calculated from True',
    keys: ['navigation.headingTrue', 'navigation.magneticVariation'],
    // Both paths default to MISSING so the combined stream fires as soon
    // as either emits.  The guard in f() suppresses output until both
    // have real values.
    defaults: [MISSING, MISSING],
    f: function hdmc(
      headingTrue: MaybeNumber,
      magneticVariation: MaybeNumber
    ): string | undefined {
      // Both inputs are required to compute a meaningful magnetic heading.
      if (headingTrue === MISSING || magneticVariation === MISSING) {
        return undefined
      }

      return nmea.toSentence([
        '$IIHDM',
        nmea.radsToPositiveDeg(headingTrue - magneticVariation).toFixed(1),
        'M',
      ])
    },
  }
}
