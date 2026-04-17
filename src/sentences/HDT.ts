// NMEA0183 Encoder HDT   $IIHDT,200.1,T*21
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDT',
    title: 'HDT - Heading True',
    keys: ['navigation.headingTrue'],
    f: function (heading: number): string {
      return nmea.toSentence([
        '$IIHDT',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'T'
      ])
    }
  }
}
