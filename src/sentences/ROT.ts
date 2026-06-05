import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'ROT',
    title: 'ROT - Rate of Turn',
    keys: ['navigation.rateOfTurn'],
    defaults: [null],
    f: function rot(rot: number | null | undefined): string | undefined {
      if (rot === null || rot === undefined || isNaN(rot)) {
        return undefined
      }

      return nmea.toSentence([
        '$IIROT',
        nmea.radsPerSecToDegPerMin(rot).toFixed(2),
        'A'
      ])
    }
  }
}
