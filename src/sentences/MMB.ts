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
    defaults: [null],
    f: function mmb(pressure: number | null | undefined): string | undefined {
      if (pressure === null || pressure === undefined || isNaN(pressure)) {
        return undefined
      }

      return nmea.toSentence([
        '$IIMMB',
        nmea.paToInHg(pressure).toFixed(4),
        'I',
        nmea.paToBar(pressure).toFixed(4),
        'B'
      ])
    }
  }
}
