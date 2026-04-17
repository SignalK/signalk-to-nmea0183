import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'DBS',
    title: 'DBS - Depth Below Surface',
    keys: ['environment.depth.belowSurface'],
    f: function dbs(depth: number): string {
      const feet = depth * 3.28084
      const fathoms = depth * 0.546807
      return nmea.toSentence([
        '$IIDBS',
        feet.toFixed(1),
        'f',
        depth.toFixed(2),
        'M',
        fathoms.toFixed(1),
        'F'
      ])
    }
  }
}
