/*
Barometer:
$IIMMB,x.x,I,x.x,B*hh
 I I I__I_Atmospheric pressure in bars
 I_ I_Atmospheric pressure in inches of mercury
 */
// $IIMMB,29.6776,I,1.00,B*73
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'MMB',
    title: 'MMB - Environment outside pressure',
    keys: ['environment.outside.pressure'],
    f: function (pressure: number): string {
      return nmea.toSentence([
        '$IIMMB',
        (pressure / 3386.39).toFixed(4),
        'I',
        (pressure / 1.0e5).toFixed(4),
        'B'
      ])
    }
  }
}
