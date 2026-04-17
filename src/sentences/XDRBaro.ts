/**
    $IIXDR,P,1.02481,B,Barometer*0D
*/
// $IIXDR,P,1.0050,B,Barometer*13

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder<[number]> {
  return {
    title: 'XDR (Barometer) - Atmospheric Pressure',
    keys: ['environment.outside.pressure'],
    f: function (pressure: number): string {
      return nmea.toSentence([
        '$IIXDR',
        'P',
        (pressure / 1.0e5).toFixed(4),
        'B',
        'Barometer'
      ])
    }
  }
}
