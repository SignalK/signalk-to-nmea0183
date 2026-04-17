/*
PSILTBS - Proprietary target boat speed sentence for Silva => Nexus => Garmin displays


           0     1  2
           |     |  |
 $PSILTBS,XX.xx,N,*hh<CR><LF>
Field Number:
0 Target Boat speed in knots
1 N for knots
2 Checksum
*/

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    title: 'PSILTBS - Garmin proprietary target boat speed',
    keys: ['performance.targetSpeed'],
    f: function (tbs: number): string {
      return nmea.toSentence(['$PSILTBS', nmea.msToKnots(tbs).toFixed(2), 'N'])
    }
  }
}
