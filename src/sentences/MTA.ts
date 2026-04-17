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
    f: function (temperature: number): string {
      const celcius = temperature - 273.15
      return nmea.toSentence(['$IIMTA', celcius.toFixed(2), 'C'])
    }
  }
}
