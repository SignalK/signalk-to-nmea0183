/**
    $IIXDR,P,1.02481,B,Barometer*0D
*/
// $IIXDR,P,1.0050,B,Barometer*13

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'XDR',
    title: 'XDR (Barometer) - Atmospheric Pressure',
    keys: ['environment.outside.pressure'],
    defaults: [null],
    f: function xdrBaro(
      pressure: number | null | undefined
    ): string | undefined {
      if (pressure === null || pressure === undefined || isNaN(pressure)) {
        return undefined
      }

      return nmea.toSentence([
        '$IIXDR',
        'P',
        nmea.paToBar(pressure).toFixed(4),
        'B',
        'Barometer'
      ])
    }
  }
}
