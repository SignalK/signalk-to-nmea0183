// NMEA0183 Encoder HDMC   $IIHDM,212.2,M*21
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDM',
    title: 'HDM - Heading Magnetic, calculated from True',
    keys: ['navigation.headingTrue', 'navigation.magneticVariation'],
    f: function (headingTrue: number, magneticVariation: number): string {
      const heading = headingTrue - magneticVariation
      return nmea.toSentence([
        '$IIHDM',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'M'
      ])
    }
  }
}
