// NMEA0183 Encoder MTW   $IIMTW,40.0,C*17
import * as nmea from '../nmea'
import type { SentenceEncoder, SignalKApp } from '../types/plugin'

export default function (_app: SignalKApp): SentenceEncoder {
  return {
    sentence: 'MTW',
    title: 'MTW - Water Temperature',
    keys: ['environment.water.temperature'],
    f: function (temperature: number): string {
      const celcius = temperature - 273.15
      return nmea.toSentence(['$IIMTW', celcius.toFixed(1), 'C'])
    }
  }
}
