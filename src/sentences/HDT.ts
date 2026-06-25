/*
 * HDT - Heading, True
 *
 * $--HDT,x.x,T*hh<CR><LF>
 *
 * Field 0: Heading in degrees, true
 * Field 1: T (true)
 *
 * Signal K input
 * --------------
 * navigation.headingTrue — required; no default.  When it has not emitted
 * the combined stream does not fire and no sentence is produced.
 * This is correct: a partial HDT sentence (empty heading) has no value.
 *
 * If you need true heading derived from magnetic + variation, use HDTC
 * instead; HDT is strictly for cases where a true-heading sensor is present.
 *
 * Example: $IIHDT,200.1,T*21
 */

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDT',
    title: 'HDT - Heading True',
    keys: ['navigation.headingTrue'],
    // No default: the sentence is meaningless without the heading value.
    f: function hdt(heading: number): string {
      return nmea.toSentence([
        '$IIHDT',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'T'
      ])
    }
  }
}
