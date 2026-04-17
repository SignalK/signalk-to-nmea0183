/*
    $IIXDR,C,19.52,C,TempAir*3D
*/
// $IIXDR,C,34.80,C,TempAir*19

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder<[number]> {
  return {
    title: 'XDR (TempAir) - Air temperature.',
    keys: ['environment.outside.temperature'],
    f: function (temperature: number): string {
      const celcius = temperature - 273.15
      return nmea.toSentence([
        '$IIXDR',
        'C',
        celcius.toFixed(2),
        'C',
        'TempAir'
      ])
    }
  }
}
