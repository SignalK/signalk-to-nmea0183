import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'ROT',
    title: 'ROT - Rate of Turn',
    keys: ['navigation.rateOfTurn'],
    f: function (rot: number): string {
      const degm = rot * 3437.74677078493
      return nmea.toSentence(['$IIROT', degm.toFixed(2), 'A'])
    }
  }
}
