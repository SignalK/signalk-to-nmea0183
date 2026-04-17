/**
$PNKEP,02,x.x*hh<CR><LF>
           \ Course (COG) on other tack from 0 to 359°
*/
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    title: 'PNKEP,02 - Course (COG) on other tack from 0 to 359°',
    keys: ['performance.tackMagnetic'],
    f: function (tackMagnetic: number): string {
      return nmea.toSentence([
        '$PNKEP',
        '02',
        nmea.radsToPositiveDeg(tackMagnetic).toFixed(2)
      ])
    }
  }
}
