/*
 * HDTC - HDT sentence calculated from Magnetic heading and Variation
 *
 * Produces a standard $IIHDT sentence but derives the true heading from
 * Signal K's navigation.headingMagnetic and navigation.magneticVariation
 * rather than from a true-north sensor directly.
 *
 * Per the Signal K spec:
 *   headingTrue = headingMagnetic + magneticVariation
 *
 * $--HDT,x.x,T*hh<CR><LF>
 *
 * Signal K inputs
 * ---------------
 * navigation.headingMagnetic   — required; defaults to MISSING.
 * navigation.magneticVariation — required; defaults to MISSING.
 *
 * Both inputs must be present to compute the true heading.  If either
 * is absent the sentence is suppressed (return undefined) because there is
 * no partial value worth emitting.
 *
 * Example: $IIHDT,180.0,T*2B
 */

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

const MISSING = '' as const
type MaybeNumber = number | typeof MISSING

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDTC',
    title: 'HDT - Heading True calculated from magnetic heading and variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation'],
    // Both paths default to MISSING so the combined stream fires as soon
    // as either emits.  The guard in f() suppresses output until both
    // have real values.
    defaults: [MISSING, MISSING],
    f: function hdtc(
      headingMagnetic: MaybeNumber,
      magneticVariation: MaybeNumber
    ): string | undefined {
      // Both inputs are required to compute a meaningful true heading.
      if (headingMagnetic === MISSING || magneticVariation === MISSING) {
        return undefined
      }

      return nmea.toSentence([
        '$IIHDT',
        nmea.radsToPositiveDeg(headingMagnetic + magneticVariation).toFixed(1),
        'T'
      ])
    }
  }
}
