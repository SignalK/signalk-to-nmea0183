// NMEA0183 Encoder HDT   $IIHDT,200.1,T*21
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDTC',
    title: 'HDT - Heading True calculated from magnetic heading and variation',
    keys: ['navigation.headingMagnetic', 'navigation.magneticVariation'],
    defaults: [undefined, 0],
    f: function hdtc(
      headingMagnetic: number | undefined,
      magneticVariation: number | undefined
    ): string | undefined {
      if (
        headingMagnetic === undefined ||
        headingMagnetic === null ||
        isNaN(headingMagnetic) ||
        magneticVariation === undefined ||
        magneticVariation === null ||
        isNaN(magneticVariation)
      ) {
        return undefined
      }

      const heading = headingMagnetic + magneticVariation
      return nmea.toSentence([
        '$IIHDT', // Talker ID: Integrated Instrumentation
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'T'
      ])
    }
  }
}
