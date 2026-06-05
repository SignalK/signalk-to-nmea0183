// NMEA0183 Encoder HDT   $IIHDT,200.1,T*21
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDT',
    title: 'HDT - Heading True',
    keys: ['navigation.headingTrue'],
    defaults: [undefined],
    f: function hdt(heading: number | undefined): string | undefined {
      if (heading === undefined || heading === null || isNaN(heading)) {
        return undefined
      }

      return nmea.toSentence([
        '$IIHDT',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'T'
      ])
    }
  }
}
