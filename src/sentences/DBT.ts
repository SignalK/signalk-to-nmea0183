// NMEA0183 Encoder DBT   $IIDBT,103.0,f,31.38,M,17.2,F*2E
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'DBT',
    title: 'DBT - Depth Below Transducer',
    keys: ['environment.depth.belowTransducer'],
    f: function dbt(depth: number): string {
      const feet = depth * 3.28084
      const fathoms = depth * 0.546807
      return nmea.toSentence([
        '$IIDBT',
        feet.toFixed(1),
        'f',
        depth.toFixed(2),
        'M',
        fathoms.toFixed(1),
        'F'
      ])
    }
  }
}
