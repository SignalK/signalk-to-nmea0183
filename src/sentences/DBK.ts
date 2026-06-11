// NMEA0183 Encoder DBK   $IIDBK,102.9,f,31.38,M,17.2,F*39
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'DBK',
    title: 'DBK - Depth Below Keel',
    keys: ['environment.depth.belowKeel'],
    defaults: [undefined],
    f: function dbk(depth: number | undefined): string | undefined {
      if (depth === undefined || depth === null || isNaN(depth)) {
        return undefined
      }

      return nmea.toSentence([
        '$IIDBK',
        nmea.mToFeet(depth).toFixed(1),
        'f',
        depth.toFixed(2),
        'M',
        nmea.mToFathoms(depth).toFixed(1),
        'F'
      ])
    }
  }
}
