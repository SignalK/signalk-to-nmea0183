import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'DBS',
    title: 'DBS - Depth Below Surface',
    keys: ['environment.depth.belowSurface'],
    defaults: [undefined],
    f: function dbs(depth: number | undefined): string | undefined {
      if (depth === undefined || depth === null || isNaN(depth)) {
        return undefined
      }

      return nmea.toSentence([
        '$IIDBS',
        nmea.mToFeet(depth).toFixed(1),
        'f',
        depth.toFixed(2),
        'M',
        nmea.mToFathoms(depth).toFixed(1),
        'F'
      ])
    }
  }
}
