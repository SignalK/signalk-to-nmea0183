// NMEA0183 Encoder HDMC   $IIHDM,212.2,M*21
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'HDM',
    title: 'HDM - Heading Magnetic, calculated from True',
    keys: ['navigation.headingTrue', 'navigation.magneticVariation'],
    defaults: [undefined, 0],
    f: function hdmc(
      headingTrue: number | undefined,
      magneticVariation: number | undefined
    ): string | undefined {
      if (
        headingTrue === undefined ||
        headingTrue === null ||
        isNaN(headingTrue) ||
        magneticVariation === undefined ||
        magneticVariation === null ||
        isNaN(magneticVariation)
      ) {
        return undefined
      }

      const heading = headingTrue - magneticVariation
      return nmea.toSentence([
        '$IIHDM',
        nmea.radsToPositiveDeg(heading).toFixed(1),
        'M'
      ])
    }
  }
}
