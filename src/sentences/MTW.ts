// NMEA0183 Encoder MTW   $IIMTW,40.0,C*17
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'MTW',
    title: 'MTW - Water Temperature',
    keys: ['environment.water.temperature'],
    defaults: [null],
    f: function mtw(
      temperature: number | null | undefined
    ): string | undefined {
      if (
        temperature === null ||
        temperature === undefined ||
        isNaN(temperature)
      ) {
        return undefined
      }

      return nmea.toSentence(['$IIMTW', nmea.kToC(temperature).toFixed(1), 'C'])
    }
  }
}
