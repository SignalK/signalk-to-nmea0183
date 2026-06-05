/**
DPT - Depth of Water
        1   2   3   4
        |   |   |   |
 $--DPT,x.x,x.x,x.x*hh<CR><LF>
Field Number:
1. Water depth relative to transducer, meters
2. Offset from transducer, meters positive means distance from transducer to water line negative means distance from transducer to keel
3. Maximum range scale in use (NMEA 3.0 and above)
4. Checksum
 */
// NMEA0183 Encoder DPT   $IIDPT,9.2,1.1*4B
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'DPT',
    title: 'DPT - Depth at Surface (using surfaceToTransducer)',
    keys: [
      'environment.depth.belowTransducer',
      'environment.depth.surfaceToTransducer'
    ],
    defaults: [null, 0],
    f: function dptSurface(
      belowTransducer: number | null | undefined,
      surfaceToTransducer: number | null | undefined
    ): string | undefined {
      if (
        belowTransducer === undefined ||
        belowTransducer === null ||
        isNaN(belowTransducer)
      ) {
        return undefined
      }

      const offset =
        typeof surfaceToTransducer === 'number' && !isNaN(surfaceToTransducer)
          ? Math.abs(surfaceToTransducer)
          : 0

      return nmea.toSentence([
        '$IIDPT',
        belowTransducer.toFixed(2),
        offset.toFixed(3),
        '' // Field 3: Maximum range scale (optional)
      ])
    }
  }
}
