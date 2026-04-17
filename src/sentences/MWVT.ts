// NMEA0183 Encoder MWVTCB   $INMWV,61.44,T,6.04,M,A*0A

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'MWV',
    title: 'MWV - True Wind heading and speed',
    keys: ['environment.wind.angleTrueWater', 'environment.wind.speedTrue'],

    f: function (angle: number, speed: number): string {
      return nmea.toSentence([
        '$IIMWV',
        nmea.radsToPositiveDeg(angle).toFixed(2),
        'T',
        speed.toFixed(2),
        'M',
        'A'
      ])
    }
  }
}
