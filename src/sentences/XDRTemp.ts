/*
    $IIXDR,C,19.52,C,TempAir*3D
*/
// $IIXDR,C,34.80,C,TempAir*19

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'XDR',
    title: 'XDR (TempAir) - Air temperature.',
    keys: ['environment.outside.temperature'],
    defaults: [null],
    f: function xdrTemp(
      temperature: number | null | undefined
    ): string | undefined {
      if (
        temperature === null ||
        temperature === undefined ||
        isNaN(temperature)
      ) {
        return undefined
      }

      return nmea.toSentence([
        '$IIXDR',
        'C',
        nmea.kToC(temperature).toFixed(2),
        'C',
        'TempAir'
      ])
    }
  }
}
