/**
Total log and daily log:
$IIVLW,x.x,N,x.x,N*hh
 I I I__I_Daily log in miles
 I__I_Total log in miles
 */
// NMEA0183 Encoder VLW   $IIVLW,9417.40,N,43.18,N*4C

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'VLW',
    title: 'VLW - Total log and daily log',
    keys: ['navigation.log', 'navigation.trip.log'],
    defaults: [null, null],
    f: function vlw(
      logDistance: number | null,
      tripDistance: number | null
    ): string | undefined {
      const totalLog = (logDistance !== null && !isNaN(logDistance))
        ? nmea.mToNm(logDistance).toFixed(2)
        : ''

      const tripLog = (tripDistance !== null && !isNaN(tripDistance))
        ? nmea.mToNm(tripDistance).toFixed(2)
        : ''

      if (totalLog === '' && tripLog === '') {
        return undefined
      }

      return nmea.toSentence([
        '$IIVLW',
        totalLog,
        'N',
        tripLog,
        'N'
      ])
    }
  }
}
