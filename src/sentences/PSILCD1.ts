/*PSILCD1 - Proprietary polar boat speed sentence for Silva => Nexus => Garmin displays


           0     1     2
           |     |     |
 $PSILCD1,XX.xx,YY.yy,*hh<CR><LF>
Field Number:
0 Polar Boat speed in knots
1 Target wind angle
2 Checksum
*/

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    title:
      'PSILCD1 - Send polar speed and target wind angle to Silva/Nexus/Garmin displays',
    keys: ['performance.polarSpeed', 'performance.targetAngle'],
    f: function (polarSpeed: number, targetAngle: number): string {
      return nmea.toSentence([
        '$PSILCD1',
        nmea.msToKnots(polarSpeed).toFixed(2),
        nmea.radsToPositiveDeg(targetAngle).toFixed(2)
      ])
    }
  }
}
