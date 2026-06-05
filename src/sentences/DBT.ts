// NMEA0183 Encoder DBT   $IIDBT,103.0,f,31.38,M,17.2,F*2E
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'DBT',
    title: 'DBT - Depth Below Transducer',
    keys: ['environment.depth.belowTransducer'],
    defaults: [undefined],
    f: function dbt(depth: number | undefined): string | undefined {
      if (depth === undefined || depth === null || isNaN(depth)) {
        return undefined
      }

      return nmea.toSentence([
        '$IIDBT',
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
