/*
 * HDM - Heading, Magnetic
 *
 * $--HDM,x.x,M*hh<CR><LF>
 *
 * Field 0: Heading in degrees, magnetic
 * Field 1: M (magnetic)
 *
 * Signal K input
 * --------------
 * navigation.headingMagnetic — required; no default.  When it has not
 * emitted the combined stream does not fire and no sentence is produced.
 * This is correct: a partial HDM sentence (empty heading) has no value.
 *
 * Example: $IIHDM,206.7,M*21
 */

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDM',
    title: 'HDM - Heading Magnetic',
    keys: ['navigation.headingMagnetic'],
    // No default: the sentence is meaningless without the heading value.
    f: function hdm(heading: number): string {
      return nmea.toSentence([
        '$IIHDM',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'M'
      ])
    }
  }
}
