// NMEA0183 Encoder HDM   $IIHDM,206.7,M*21
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDM',
    title: 'HDM - Heading Magnetic',
    keys: ['navigation.headingMagnetic'],
    defaults: [undefined],
    f: function hdm(heading: number | undefined): string | undefined {
      if (heading === undefined || heading === null || isNaN(heading)) {
        return undefined
      }

      return nmea.toSentence([
        '$IIHDM',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'M'
      ])
    }
  }
}
