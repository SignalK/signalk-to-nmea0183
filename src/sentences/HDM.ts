// NMEA0183 Encoder HDM   $IIHDM,206.7,M*21
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDM',
    title: 'HDM - Heading Magnetic',
    keys: ['navigation.headingMagnetic'],
    f: function (heading: number): string {
      return nmea.toSentence([
        '$IIHDM',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'M'
      ])
    }
  }
}
