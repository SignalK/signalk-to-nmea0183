// NMEA0183 Encoder HDT   $IIHDT,200.1,T*21
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDTC',
    title: 'HDT - Heading True calculated from magnetic heading and variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation'],
    f: function (headingMagnetic: number, magneticVariation: number): string {
      const heading = headingMagnetic + magneticVariation
      return nmea.toSentence([
        '$IIHDT',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'T'
      ])
    }
  }
}
