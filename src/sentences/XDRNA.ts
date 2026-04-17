/**
    $IIXDR,A,-0.7,D,PTCH,A,0.9,D,ROLL*0D
*/
// $IIXDR,A,-0.7,D,PTCH,A,0.9,D,ROLL*13

import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

interface Attitude {
  pitch: number
  roll: number
}

export default function (_app: SignalKApp): SentenceEncoder<[Attitude]> {
  return {
    title: 'XDR (PTCH-ROLL) - Pitch and Roll',
    keys: ['navigation.attitude'],
    f: function (attitude: Attitude): string {
      return nmea.toSentence([
        '$IIXDR',
        'A',
        nmea.radsToDeg(attitude.pitch).toFixed(1),
        'D',
        'PTCH',
        'A',
        nmea.radsToDeg(attitude.roll).toFixed(1),
        'D',
        'ROLL'
      ])
    }
  }
}
