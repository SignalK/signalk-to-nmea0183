/*
Air temperature:
$IIMTA,x.x,C*hh
 I__I_Temperature in degrees C
  */
// $IIMTA,34.80,C*3A

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'MTA',
    title: 'MTA - Air temperature.',
    keys: ['environment.outside.temperature'],
    defaults: [null],
    f: function mta(
      temperature: number | null | undefined
    ): string | undefined {
      if (
        temperature === null ||
        temperature === undefined ||
        isNaN(temperature)
      ) {
        return undefined
      }

      return nmea.toSentence(['$IIMTA', nmea.kToC(temperature).toFixed(2), 'C'])
    }
  }
}
